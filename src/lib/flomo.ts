export async function sendToFlomo(content: string) {
  const apiUrl = localStorage.getItem('flomo_api_url')
  if (!apiUrl) throw new Error('未配置 flomo API URL，请在设置中配置')

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('发送到 flomo 失败')
}
