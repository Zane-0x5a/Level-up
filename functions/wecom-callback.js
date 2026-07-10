/**
 * 企业微信"接收消息服务器URL"验证握手（一次性，握手通过后即可删除本文件）
 *
 * 背景：企业微信要求配置"企业可信IP"前先通过可信域名或回调URL验证；
 * pages.dev 无法ICP备案走不了可信域名，故用本函数完成回调握手。
 *
 * 凭据全部走 Cloudflare Pages 环境变量（本仓库公开，不落库）：
 *   WECOM_TOKEN / WECOM_AESKEY / WECOM_CORPID
 *
 * 协议（GET ?msg_signature&timestamp&nonce&echostr）：
 *   1. SHA1(sort(token,timestamp,nonce,echostr).join('')) == msg_signature
 *   2. AES-256-CBC 解密 echostr：key=base64(EncodingAESKey+'=')，iv=key前16字节
 *      明文 = 16字节随机 + 4字节大端长度 + msg + receiveid(corpid)
 *   3. 原样返回 msg 纯文本
 *
 * WebCrypto 只认 PKCS7-16 填充而企业微信用 PKCS7-32，这里用"追加自构造
 * 合法填充块"的标准技巧拿到未去填充的完整明文后手工去填充。
 */

function b64decode(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const q = new URL(request.url).searchParams;
  const msgSignature = q.get("msg_signature");
  const timestamp = q.get("timestamp");
  const nonce = q.get("nonce");
  // URLSearchParams 会把 '+' 解成空格，而 echostr 是 base64，需还原
  const echostr = (q.get("echostr") || "").replace(/ /g, "+");

  const TOKEN = env.WECOM_TOKEN;
  const AESKEY = env.WECOM_AESKEY;
  const CORPID = env.WECOM_CORPID;
  if (!TOKEN || !AESKEY) return new Response("env not configured", { status: 500 });
  if (!msgSignature || !timestamp || !nonce || !echostr)
    return new Response("bad request", { status: 400 });

  // 1. 验签
  const sorted = [TOKEN, timestamp, nonce, echostr].sort();
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(sorted.join("")));
  const sig = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (sig !== msgSignature) return new Response("signature mismatch", { status: 403 });

  // 2. 解密
  const keyBytes = b64decode(AESKEY + "=");
  if (keyBytes.length !== 32) return new Response("bad aeskey", { status: 500 });
  const iv = keyBytes.slice(0, 16);
  const ct = b64decode(echostr);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, [
    "encrypt",
    "decrypt",
  ]);
  // 追加块技巧：E(pad16 ^ lastCtBlock) 拼在密文尾部，让 WebCrypto 的
  // PKCS7-16 校验剥掉的正好是我们追加的块，从而拿到含原始填充的完整明文
  const lastBlock = ct.slice(ct.length - 16);
  const pad16 = new Uint8Array(16).fill(16);
  const extra = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-CBC", iv: lastBlock }, key, pad16)
  ).slice(0, 16);
  const full = new Uint8Array(ct.length + 16);
  full.set(ct);
  full.set(extra, ct.length);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, full));

  // 手工去 PKCS7-32 填充
  const padN = plain[plain.length - 1];
  if (!(padN >= 1 && padN <= 32)) return new Response("bad padding", { status: 500 });
  const content = plain.slice(0, plain.length - padN);

  // 3. 解析 16随机 + 4长度 + msg + receiveid
  const msgLen = (content[16] << 24) | (content[17] << 16) | (content[18] << 8) | content[19];
  const msg = content.slice(20, 20 + msgLen);
  const receiveid = new TextDecoder().decode(content.slice(20 + msgLen));
  if (CORPID && receiveid !== CORPID) return new Response("corpid mismatch", { status: 403 });

  return new Response(msg, { headers: { "Content-Type": "text/plain" } });
}
