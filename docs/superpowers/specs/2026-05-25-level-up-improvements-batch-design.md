# Spec: Level Up 体验改进批次

**Date:** 2026-05-25
**Status:** Draft — ready for review
**Scope:** 一批 bug 修复 + 功能改进，作为一个 release batch 设计与执行

## 概览

本 spec 汇总 7 个 topic，按用户提供的清单顺序对齐：

| # | Topic | 类型 | 状态 |
|---|-------|------|------|
| 1 | 分享打卡 modal 背景透明 | Bug | ✅ 已对齐 |
| 2 | DailyEntryForm 草稿持久化（= 用户视角的"历史缓存"） | Bug | ✅ 已对齐 |
| 3 | 社群消息不实时 | Bug | ✅ 已对齐 |
| 4 | 今日回声重构为"成长教练日记" | 改进 | ✅ 已对齐 |
| 5 | 成长热力图重做：分层 × 长时间 × Quantile 强度 | 改进 | ✅ 已对齐 |
| 6 | 移动端横屏专注页面 — 桌面钟模式，Typography 主导 | 改进 | ✅ 已对齐 |
| 7 | 专注页面可选计时器 — 强鲁棒性 + 加速度感应 + 与 SessionEndPanel confirmation 合并 | 改进 | ✅ 已对齐 |

> 跨 topic 共享的 pattern、依赖关系、实现顺序建议见文末 **Cross-cutting concerns** 段。

---

## §1 · 分享打卡 modal 背景透明

### 1.1 Problem

"分享打卡" modal（社群页面 ChatInput 中由 `setCheckinDialog(...)` 打开）背景透明：dialog 区域没有自己的不透明背景层，背面的频道列表、消息内容全部透过来，严重影响可读性与点击区域识别。

截图证据由用户提供，可见 dialog 区域只有一层灰蒙蒙的视觉。

### 1.2 Root Cause

`src/app/community/community.css` 中分享 modal 相关样式引用了两个 CSS 变量：

- `var(--color-surface)` — 行 1043（`.checkin-privacy-dialog` 背景）
- `var(--color-surface-2)` — 行 1068 / 1114 / 1143

但在整个 codebase 内（特别是 `src/app/globals.css` 的 `@theme inline` block）**没有任何地方定义这两个变量**。它们是幽灵 token —— CSS 引用未定义自定义属性时回退为 `initial`，对 `background` 而言即透明。

**已排除：** 父级（`.community-page` / `.community-layout` / `.community-main` / `.chat-input-area`）无 `transform / filter / backdrop-filter / will-change / perspective`，`position: fixed` 的 containing block 干净，**无需 portal**。

### 1.3 Solution

按现有 token 语义对应关系，把错误 token 名替换为存在的 token：

| 行号 | 选择器 | 原值 | 新值 |
|------|--------|------|------|
| 1043 | `.checkin-privacy-dialog` | `var(--color-surface)` | `var(--color-card)` |
| 1068 | `.checkin-privacy-preview` | `var(--color-surface-2)` | `var(--color-bg-sub)` |
| 1114 | `.checkin-privacy-note-preview` | `var(--color-surface-2)` | `var(--color-bg-sub)` |
| 1143 | `.checkin-privacy-cancel:hover` | `var(--color-surface-2)` | `var(--color-bg-sub)` |

**改动量：** `src/app/community/community.css` 修改 4 行。不需要新组件 / Portal / backdrop-filter / TS 改动。

### 1.4 Scope Boundary

不做：modal 抽组件 / backdrop-filter / 入场动画 / 其他 modal 同类问题（单独立项）/ 引入新 token。

### 1.5 Verification

1. dev server 启动，进入社群页面点"打卡分享"，确认 dialog 不透明白底、preview 区与 note 预览为米色子底、取消按钮 hover 米色高亮。
2. `grep -r "color-surface" src/` 修复后应返回 0。
3. 浅色主题下视觉与 `design-tokens.ts` 中 `colors.card` (`#ffffff`) / `colors.bg.sub` (`#f3efe9`) 一致。

### 1.6 Out-of-scope Follow-ups

- **系统性 token 审计**：grep 全 codebase 中所有 `var(--color-*)` 引用，对照 `globals.css` 中定义清单，找出其他可能的幽灵 token。建议作为独立 follow-up。
- 未来暗色主题支持：`--color-card` / `--color-bg-sub` 已在 token 系统内，主题切换自动生效。

### 1.7 Risks

极低。CSS 替换 4 行，无逻辑改动、无结构改动、无新依赖。

---

## §2 · DailyEntryForm 草稿持久化

### 2.1 Mental Model

用户原始诉求里"写一半被清空"与"历史记录缓存没做好"实质是同一件事的两个视角：

- **"历史记录" = 已 submit 进 `daily_records` 表的过去打卡**（按"保存记录"按钮才入库）
- **"历史缓存没做好" = 用户在按保存之前的中间状态全部丢失** —— 下次再开 form，那段"未提交的历史"就没了

引入草稿持久化（保存到 localStorage，但不入库）就同时填补这两个表述。**§2 不拆成两条独立工作**。

### 2.2 Problem

`src/components/analysis/DailyEntryForm.tsx` 中所有用户可编辑字段（`dayType` / `habitCheckins` / `note` / `progressNote` / `progressLevel` / `stateLabel`）只活在 React state。任意以下事件会导致中间状态全部丢失：

- 刷新页面 / 切到其他路由再回来
- 浏览器崩溃 / 标签页意外关闭
- 切换 form 内的 `date` 字段（loadRecord 重新填表，旧 date 未保存的修改丢）
- 跨午夜场景：23:50 写 5/24 草稿，过 00:00 关页面，第二天 mount 时 date 默认成 5/25

### 2.3 Design

#### 数据结构（参照 `src/lib/focus-draft.ts` 范式）

**新模块**：`src/lib/daily-entry-draft.ts`

**Storage key**：`daily-entry-draft:${userId}:${date}`  
按 `(userId, date)` 分桶 —— 与 `daily_records` 表 PK 一致，跨日草稿互不覆盖。

**草稿字段**：`dayType / habitCheckins / note / progressNote / progressLevel / stateLabel`

**不入草稿**：
- `focus_in_class / focus_out_class / entertainment` —— 由 `focus_sessions` 表派生，read-only，每次 mount 重算
- `date` —— 作为 key，不作为 value

#### 行为

| 时机 | 行为 |
|------|------|
| 字段变化 | debounce 300ms 写 localStorage |
| `loadRecord(date)` 完成后 | 读对应 date 的 draft，存在则覆盖 form state |
| `handleSave` 成功后 | 清当前 date 的 draft |
| mount 时 date 默认为系统今天 | 不主动 surface 其他 date 的草稿（信任用户对路径的记忆） |

**冲突优先级**：先 loadRecord（server）→ 后 restore draft（覆盖）。即 draft 永远代表"用户最近的未提交意图"。

### 2.4 Files Changed

1. `src/lib/daily-entry-draft.ts`（新增，~80 行）
2. `src/lib/daily-entry-draft.test.ts`（新增，参照 focus-draft.test.ts）
3. `src/components/analysis/DailyEntryForm.tsx`（修改）：
   - mount / date 变化后读 draft 并覆盖 state
   - 各字段 setter 改成 setState + debounce 写 draft
   - `handleSave` 成功路径增加 `clearDailyEntryDraft(userId, date)`

### 2.5 Out-of-scope (Follow-up)

- 跨设备 sync（draft 同步到 Supabase 表）
- "本地有未保存改动"的视觉提示（Banner / Badge）
- 已保存草稿的自动 TTL 清理
- 多个未完成日期草稿的 Discovery UI（用户已明确：信任用户记忆，不主动 surface）

### 2.6 Verification

- Unit test：read / write / clear with stub storage（参照 `focus-draft.test.ts`）
- 手动验证：
  - 填一半 → 刷新 → 数据还在
  - 按保存 → 刷新 → 干净
  - 切日期 → 新日期独立草稿
  - 23:50 写 5/24 草稿，模拟跨日（直接改系统时间 / 改 form date），5/24 草稿不丢

### 2.7 Risks

低。新增的 draft 模块完全独立，DailyEntryForm 改动局限在状态生命周期，不动业务逻辑。

---

## §3 · 社群消息不实时

### 3.1 Problem

两个独立但同源的 Realtime 失常：

**Bug ①**：`src/components/community/MessageList.tsx:84-92` 的 DELETE listener 在 `subscribeToChannel()` 返回之后才追加 `.on('postgres_changes', { event: 'DELETE', ... })`。但 `subscribeToChannel` 内部已经调用了 `.subscribe()` —— supabase-js 的 channel 一旦 subscribe，再追加 listener 不会触发。**结果：删除事件从未被监听过**（删消息后，另一端必须刷新才能消失）。

**Bug ②**：`sendTextMessage` / `sendImageMessage` 当前 return `Promise<void>`，发送方完全依赖 Realtime 回流才能看到自己的消息。一旦 Realtime 偶发 hiccup，自己发的消息就"看似没发出去"。只有 `sendCheckinMessage` 走了 `onNewMessage → pendingMessage` 的乐观路径，所以打卡分享是好的。

### 3.2 Design

#### 修复 ① — DELETE listener 时序

**`src/lib/api/messages.ts`**：把 DELETE listener 移进 `subscribeToChannel`，确保所有 `.on()` 都在 `.subscribe()` 之前注册。

```ts
export function subscribeToChannel(
  channelId: string,
  onNewMessage: (msg: Message) => void,
  onDelete?: (id: string) => void,  // 新增 optional 参数
): RealtimeChannel {
  return supabase
    .channel(`channel-${channelId}`)
    .on('postgres_changes', { event: 'INSERT', ... }, async (payload) => { /* 现有逻辑 */ })
    .on('postgres_changes', { event: 'DELETE', ... }, (payload) => {
      onDelete?.(payload.old.id)
    })
    .subscribe()
}
```

`MessageList.tsx`：删除现有 line 84-92 错误位置的 `.on()` 调用，把 onDelete 通过参数传进去。

#### 修复 ② — 文本/图片消息乐观更新

**`src/lib/api/messages.ts`**：

```ts
// sendTextMessage 改成 Promise<Message>
export async function sendTextMessage(...): Promise<Message> {
  const { data, error } = await supabase.from('messages')
    .insert({...}).select().single()
  if (error) throw error
  return data as Message
}
// sendImageMessage 同理
```

**`src/components/community/ChatInput.tsx`**：

- `handleSend`：`const msg = await sendTextMessage(...); onNewMessage?.(msg)`
- `handleImageUpload`：同上
- catch 路径**不调** `onNewMessage` —— 发送失败不进行乐观插入

#### 去重保障

`MessageList.tsx` line 67-74 已存在 idx 去重逻辑：Realtime 回流时 replace 而非 duplicate。乐观插入 + Realtime 回流不会重复显示。

### 3.3 Files Changed

1. `src/lib/api/messages.ts`：
   - `subscribeToChannel` 新增 optional `onDelete` 参数，内部在 `.subscribe()` 前 `.on('DELETE')`
   - `sendTextMessage` 改 return `Promise<Message>`
   - `sendImageMessage` 改 return `Promise<Message>`
2. `src/components/community/MessageList.tsx`：删除 line 84-92，subscribe 调用传 onDelete
3. `src/components/community/ChatInput.tsx`：`handleSend` / `handleImageUpload` 走乐观路径

### 3.4 Out-of-scope (Follow-up)

- 发送失败重试 / 重发按钮
- 离线 queue（断网时本地排队 + 联网时 flush）
- 网络断线状态提示
- 重连后 missed events 补拉

### 3.5 Verification

手动：
- 发文本 / 图片，立即出现在自己界面（不依赖 Realtime 延迟）
- 删自己消息，对侧实时消失
- 切频道后回来，乐观插入的消息不重复
- 发送失败时（断网模拟）不会有"幽灵消息"留在界面

### 3.6 Risks

低。
- signature 变化是 additive（`onDelete` optional），不破坏现有调用方
- 乐观插入与 Realtime 回流靠现有 idx 去重防重

---

## §4 · 今日回声 — 重构为"成长教练日记"

### 4.1 第一性 framing

"今日回声"作为 Level Up 的一个 surface，根本目的应该是 **用户每日数据 → 心智反馈循环**。具体覆盖五条 user need：被看见、被理解、被串联、被推动、被陪伴。

当前 `buildGrowthEcho` 是 "append-if-present" 的模板拼接（哪个 field 有值就拼一句），本质是 "data reader" 而非 "growth observer" —— 内容空洞、无对比、无温度。**这次是重构，不是修 bug**。

### 4.2 概念

把"今日回声"重做成 **整体精挑 3-5 句的"成长教练日记"**，tone = **温和陪伴**（不评价、留余裕、有温度）。

### 4.3 内容轴 — 4 类 generator

| Generator | 候选职责 |
|-----------|----------|
| Snapshot | 今天事实（投入小时数 / 回归次数 / 学习日 / 状态等） |
| Position | 跟昨天 / 本周均值 / 30 天均值 / 个人最佳 的对比 |
| Pattern | 4 类 pattern 检测：状态持续/切换、投入连续性、主线推进节奏、异常波动 |
| Voice | 综合 state + pattern + position 后的一句温和"陪伴语" |

每个 generator 产出 `Observation { text: string, score: number, tags: string[] }` 候选数组。

### 4.4 Curator 跨块精挑

Curator 是 pure function：输入所有 generator 的候选 → 输出 3-5 个最终 observation。规则：

1. **Snapshot 锚一句** —— 必占首 slot（保"被看见"baseline）
2. **Voice 收尾** —— 必占末 slot（保结尾的教练温度）
3. **中间 1-3 slot** 从 Position + Pattern 候选中按 `score` 倒序选
4. **多样性约束** —— 同 tag 最多 2 个（避免连续 3 句都是"连续 N 天 X"复读）

最终输出 3-5 句，固定框架 `[Snapshot] → [Position/Pattern × 1-3] → [Voice]`。

### 4.5 Voice library

按 `(state_label, dominant_pattern_tag)` 组合做模板池，每组合 3-5 句备选，随机选 1（避免每天重复）。

示例 — `("恢复中", "投入连续性 streak")`：

- "节奏在，别给自己添重量。"
- "今晚早点睡，明天继续。"
- "稳着走就够了。"
- "连续 N 天的低空巡航也是飞行。"

预计文案总量 ~80-150 句（4 个 state_label × 4-5 个 dominant tag × 3-5 备选）。未覆盖组合 fallback 到通用 voice 池。

### 4.6 UI 容器

保留 `GrowthEchoCard`，内部布局调整为：

```
┌─────────────────────────────────────────────┐
│ 今日回声                                     │
│ 基于今天的成长记录生成的反馈                 │
├─────────────────────────────────────────────┤
│                                             │
│  今天 3.2h，连续 4 个学习日。                │
│  状态慢慢在转温，从"恢复中"走到"稳住了"。    │
│  今晚别熬太晚，明天继续。                    │
│                                             │
├─────────────────────────────────────────────┤
│ [投入] [回归] [主线] [状态]                   │
└─────────────────────────────────────────────┘
```

narrative 段为主体（上方），chip 行保留作 quick scan / data anchor（与现有 chip 4 项一致）。

### 4.7 模块结构

```
src/lib/analysis/echo/
├── index.ts                  # 入口：buildGrowthEcho(records, today, prefs) → EchoOutput
├── types.ts                  # Observation / EchoOutput / Generator interface
├── snapshot-generator.ts
├── position-generator.ts
├── pattern-generator.ts
├── voice-generator.ts
├── voice-library.ts          # 文案模板池
├── curator.ts                # 排序 + 多样性约束
└── *.test.ts                 # 每个 generator + curator 单测
```

老 `growth-metrics.ts` 中的 `buildGrowthEcho` 删除，引用点统一替换为新入口。

### 4.8 接口契约

```ts
type EchoOutput = {
  narrative: string[]   // 3-5 句
  chips: ChipData[]     // 保持现有 4 chip 数据契约
}
```

`src/app/analysis/page.tsx` 调用 `buildGrowthEcho(records, today, preferences) → EchoOutput`，传入 `GrowthEchoCard`。

### 4.9 数据需求

- 30 天历史已由 `getAllDailyRecords(userId)` 返回，足够
- pure function，mount 时同步计算，不需要 cache

### 4.10 Files Changed

- 新增：`src/lib/analysis/echo/` 目录 + 7-8 个文件
- 修改：`src/components/analysis/GrowthEchoCard.tsx`（接收 EchoOutput 渲染 narrative + chip）
- 修改：`src/app/analysis/page.tsx`（调用入口换成新 echo 模块）
- 修改：`src/lib/analysis/growth-metrics.ts`（删除 `buildGrowthEcho`，保留其他 helper）

### 4.11 Out-of-scope (Follow-up)

- AI 接入（未来替换 voice-generator 这一层接口即可，架构上预留）
- 用户可调"教练风格"开关（多 tone 切换）
- 历史回声归档（看历史天的回声）
- 多语言
- 通知推送 / 分享到社群

### 4.12 Verification

- 每个 generator 单测：given records / preferences → 候选 observations 满足期望
- curator 单测：多样性约束、Voice 收尾、Snapshot 锚位
- voice-library 覆盖率测试：每个 state_label 至少有 N 句可用 voice
- 集成 snapshot test：3 套典型 records → 期望 narrative 数组

### 4.13 Risks

**中**。重构 + 新增 ~7 个文件，但每个 generator 是 pure function 独立测试，curator 也是 pure function，集成爆炸面小。

**主要风险在 voice library 的文案质量** —— 写得好坏决定整个 feature 的体感。这是产品风险，不是技术风险，需要单独投入时间打磨文案。如果一次写不到位，可以分阶段：先 release 一个保守版（少量通用 voice），上线后根据使用反馈迭代扩充。

---

## §5 · 成长热力图 — 分层 × 长时间 × Quantile 强度

### 5.1 第一性 framing

热力图作为 analysis 页的 surface，根本服务的 user need：

1. 被见证持续性（"我一直都在"）
2. 被看见强度差异（高峰 vs 低谷）
3. 被识别周期（周末懒？周三密集？）
4. 被发现盲区（哪几天空白、哪个维度长期为零）

现有 35 天 × 4 档混合 score 几乎只满足 (1)。混合 score 抹平维度差异 ⇒ (4) 看不出；35 天 ⇒ (3) 看不出；4 档色阶 ⇒ (2) 粗糙。**重做不修补**。

### 5.2 概念

把热力图重做成 **分层 × 90 天 × Quantile 连续强度**：

- 时间维度变长：90 天（13 周 × 7 行 GitHub style）
- 维度可切换：默认混合"总览"，可切到分维度视图（专注 / 习惯 / 主线 / Note / 状态）
- 强度个性化：按用户自己历史分布 quantile 映射，跟自己比不跟绝对值比

### 5.3 时间窗口

- 桌面默认 90 天，13 周 × 7 行
- 移动端：30 天竖屏 或 90 天 horizontal scroll（决策延迟到 §6 横屏一起定）

### 5.4 维度切换 UI

顶部 chip 行：

```
[ 总览 ] [ 专注 ] [ 习惯 ] [ 主线 ] [ Note ] [ 状态 ]
```

- 单选 segmented control，切换即重渲染
- 默认"总览"（混合 score）
- 切换不重 fetch，同一份 records 重 compute

### 5.5 色阶映射 — Quantile 个性化

```ts
mapToIntensity(value, dimensionDistribution):
  if value === 0: return 0          // 空格
  percentile = quantileRank(distribution, value)
  return percentile → [0.2, 0.5, 0.8, 1.0] 色阶
```

每个维度独立 distribution：

| 维度 | distribution 源 |
|------|---------------|
| 总览 | `getGrowthEvidenceScore` 综合 score |
| 专注 | `focus_in_class + focus_out_class` 小时 |
| 习惯 | `ibetter_count` |
| 主线 | `progress_level` 数值化（slight=1 / solid=2 / breakthrough=3） |
| Note | `note.length` |
| 状态 | `state_label` 序数化（recovering=1 / steady=2 / good=3 / energized=4） |

**Fallback**：当用户历史数据 < 30 天时，退化到 Log 映射 `log(1+v) / log(13)`，避免 distribution 不足时映射诡异。

### 5.6 单格视觉

- 圆角小方块（沿用现有 cell 风格）
- 0 值：仅 border / 浅灰底
- 今天高亮：1px coral 边框 + 微 glow

### 5.7 颜色策略

| 视图 | 色相 |
|------|-----|
| 总览 | coral |
| 专注 | coral |
| 习惯 | sage |
| 主线 | honey |
| Note | sky |
| 状态 | rose |

各维度独立色相，强化"切换"视觉认知。

### 5.8 Tooltip

桌面 hover / 移动 short-tap 触发（移动端 tap 后显示 3s 自动消失，与 §7 产品语言一致 — 避免 long-press），显示该天所有维度明细：

```
2026-05-23 学习日
专注 3.2h（课内 1.0 + 课外 2.2）
习惯 2 项
主线：有突破
Note：写了
状态：稳住了
```

### 5.9 月份分隔标签

顶部周列上方显示月份切换点（"4 月 | 5 月"），GitHub style，辅助识别"周期 + 时间锚定"。

### 5.10 模块结构

```
src/lib/analysis/heatmap/
├── build-heatmap.ts    # records + dimension + days → cells
├── quantile.ts         # quantile rank + log fallback
├── dimensions.ts       # 维度定义 + per-dimension value extractor
└── *.test.ts
```

修改：
- `src/components/analysis/GrowthHeatmap.tsx` — 接收 cells + dimension + onDimensionChange + tooltip 子组件
- `src/app/analysis/page.tsx` — 增加 dimension state，传 records / dimension 给组件
- `src/lib/analysis/growth-metrics.ts` — 删除 `buildHeatmapData`，引用点换到新入口

### 5.11 Files Changed

新增：~4 文件（heatmap 目录）
修改：3 文件（GrowthHeatmap.tsx / analysis/page.tsx / growth-metrics.ts）

### 5.12 Out-of-scope (Follow-up)

- 365 天完整年视图
- 维度互相对比线图叠加
- 导出 PNG / 分享
- 点击 cell 跳转那天的编辑界面
- 热力图嵌入 §4 今日回声里做交叉引用

### 5.13 Verification

- `quantile.ts` 单测：已知分布 + 已知值 → 已知 percentile
- `build-heatmap.ts` 单测：各维度、不同 records 数量、< 30 天 fallback 路径
- `GrowthHeatmap` 渲染 snapshot test：默认视图 + 切到分维度视图
- 手动：维度切换无延迟、tooltip 内容正确、今天高亮可见

### 5.14 Risks

低-中。
- 模块拆分清晰，每块 pure function 易测
- 主要打磨成本在视觉层：色阶 ramp、tooltip 定位、月份标签错位、移动端响应式
- 移动端布局决策跟 §6 共享，需要协同

---

## §6 · 移动端横屏专注页面 — 桌面钟模式

### 6.1 第一性 framing

横屏专注页的真实 use case 不是"用户偶尔翻了手机方向"，而是 **"桌面钟"模式**：

- 学生把手机横放在桌上面对自己，作为"环境指引"
- 用户实际用纸笔 / 电脑 / 书学习，手机基本不操作（避免通知打断）
- 偶尔按"回归"按钮（走神时拉回来 +1）
- sticky note 是陪伴文字、AudioPlayer 偶尔切换

这个 use case 跟竖屏完全不同：
- **竖屏** = 拿在手上 / 短时间触屏 → 元素紧凑、点选优先
- **横屏** = 放桌上 / 远距离看 / 少操作 → typography 主导、orb 退位、负空间承载氛围

### 6.2 关键认知修正

第一版方案错误地假定 "orb 在横屏下仍是视觉中心"。但手机横屏可用高度只有 360-430px，orb 即使放大也只能到 ~200px，根本撑不起"中心锚点"。

**修正：横屏下视觉重心 = sticky note typography + 背景图氛围；orb 退位为右下侧的"回归按钮"，保持圆形不变形（不破坏 breathing orb 的品牌视觉语言）。**

### 6.3 触发条件

```css
@media (orientation: landscape) and (max-height: 500px) {
  /* 重排规则 */
}
```

只命中真正的"短高度横屏"（手机横放 / 小屏平板横屏），桌面浏览器宽屏不触发。

### 6.4 布局

```
┌──────────────────────────────────────────────────────────────┐
│ 今日回归 5                                              [×]  │
│                                                              │
│                                                              │
│         "给自己一段不被打扰的时间。"                          │
│         （大字体 typography，视觉重心）                       │
│                                                              │
│                                                              │
│                                            ╭───╮             │
│                                            │ ⊙ │             │
│                                            ╰───╯             │
│                                             回归              │
│                                                              │
│ [♫]                                                          │
└──────────────────────────────────────────────────────────────┘
```

### 6.5 元素变化对照

| 元素 | 竖屏 | 横屏 |
|------|------|------|
| sticky note | 屏幕底部小字陪衬 | 画面中央偏上，**字号 28-32px，typography 主导** |
| orb | 中央大型呼吸锚点 ~200px | **缩到 ~80px** 放右下侧，作为"回归按钮"，**保持圆形** |
| "回归"标签 | orb 内嵌 | orb 下方独立小字 |
| 回归计数 capsule | orb 下方 | **左上角小标**，眼角余光可见 |
| AudioPlayer | 屏幕底部 | 左下角小图标 |
| 退出按钮 × | 右上 | 右上（不变） |

### 6.6 设计理由

- **Typography 而非 orb 占视觉重心** —— 符合桌面钟远距离观看场景，陪伴文字才是真正被读的内容
- **orb 右下符合 Fitts's law** —— 手机横持时拇指自然 reach 区，单手可点
- **保留 orb 圆形** —— 不破坏品牌 breathing orb 视觉语言一致性
- **背景图 + 大段负空间** —— Drift 漂浮感的核心
- **数据点退到角落** —— 桌面钟模式下用户不需要它们抢视线

### 6.7 跟 §5 热力图移动端的协同

§5 决策延迟到这里 —— 推荐：移动端 analysis 页默认 30 天竖屏视图（不受 §6 影响）；analysis 页本身不是横屏 use case，不为它做特殊横屏优化。

### 6.8 Files Changed

只改 `src/app/focus/focus.css`：增加一段 `@media (orientation: landscape) and (max-height: 500px)` block，约 60-80 行 CSS。

涉及选择器：
- `.focus-immersive` —— 容器 padding
- `.immersive-sticky` —— 字号 + 绝对定位居中偏上
- `.return-orb-wrapper` —— transform: scale(~0.45) + 绝对定位右下
- `.return-count-capsule` —— 移到左上 + 缩小
- AudioPlayer 内部选择器 —— absolute 左下

不改任何 React 组件、不改任何 JS。

### 6.9 Out-of-scope (Follow-up)

- iPad 横屏的"大屏桌面 chrome"扩展（更大字号、更丰富的环境指引）
- 自动旋转锁定提示 / 引导
- 横屏下的统计数据浮层（如 §7 计时器横屏布局，在 §7 单独设计时再处理）
- 横屏下交互手势（如左滑切 sticky / 上滑显示数据）

### 6.10 Verification

- Chrome DevTools rotate 横屏模拟，确认布局正确
- 真机：iPhone 横放、安卓机横放、iPad 横放各试一遍
  - sticky note 文字可读（≥ 30cm 距离）
  - orb 单手拇指可点
  - 回归 +1 toast 在小屏不被遮挡
- 不影响竖屏 / 桌面：加 media query 不让原布局崩
- 横竖屏旋转过程中无闪烁 / 元素跳跃

### 6.11 Risks

低。纯 CSS 改动，不动组件结构。最大风险是真机适配（不同手机横屏高度差异 360px vs 430px vs 平板），需要至少 3 个机型测试。

---

## §7 · 专注页面可选计时器

### 7.1 第一性 framing

加计时器解决三层 user problem：
1. 退出后填表负担 — SessionEndPanel 现在凭记忆手填，常不准
2. 不打扰但可查 — 偶尔想知道"已经投入多久"作为 motivation
3. 后续记录可信 — 实测比记忆准，长期统计才有意义

**核心 product value** = (1)+(3) 链通 = **退出沉浸态时自动 commit 进 SessionEndPanel 的 confirmation 视图**，闭环"专注 → 记录"流程。

### 7.2 强鲁棒性 — localStorage + 8h invalidation

**用户定义**：刷新 / 关标签页 / 关浏览器再开 都不能"退出"。这要求计时器 + 沉浸态本身都得跨标签页 persist。

实现：
- `focus-timer-start` 存 **localStorage**（不是 sessionStorage）
- 现有的 `focus_state`（沉浸态状态）也升级到 **localStorage**
- mount 时 check：
  - 不存在 → 新启计时器 / 默认 default 态
  - 存在 + elapsed ≤ 8h → restore 沉浸态 + 计时器继续
  - 存在 + elapsed > 8h → silent invalidate（认作僵尸 session，自动 clean）

### 7.3 沉浸态内的时间显示触发

**保留**这块 —— 用户主动查询时浮现，是"不打扰但可查"的核心。两种 trigger，按平台分：

| 平台 / 条件 | trigger |
|------------|---------|
| 桌面 | hover return orb → 显示；离开 → 隐藏 |
| 移动 + 加速度授权（iOS 13+ 弹原生 `DeviceMotionEvent.requestPermission`，Android 一般免授权） | 拿起手机（加速度峰值 > threshold 持续 ~100ms） → 显示；放下（静止 + 接近水平 ≥ 2s）→ 隐藏 |

iOS 权限请求时机：在 FocusDefaultState 的"开始专注" click handler 内调用（必须 user gesture 触发），授权一次后持久。

**无 fallback**：移动端加速度不可用 / 用户拒绝授权 → 沉浸态内完全不显示时间数字。用户依靠退出后 SessionEndPanel 的 confirmation 视图看到记录值。这跟"不打扰"DNA 一致，"无加速度感应"的 case 也罕见。**不引入 long-press 等替代 trigger**（避免跟回归按钮短按冲突 + 学习成本）。

**显示形式**：

```
   ╭───╮
   │ ⊙ │
   ╰───╯
    回归
   23:45   ← 主动触发时才显示
```

- 格式：`mm:ss` (< 1h) / `h:mm` (≥ 1h)
- 字号小、低对比、不抢戏
- fade in / out 150ms

### 7.4 防误触 — 5min silent skip

```ts
const MIN_FOCUS_MS = 5 * 60 * 1000

function consumeFocusTimer(): number | null {
  const start = readStart()
  if (!start) return null
  const elapsedMs = Date.now() - start
  clearStart()
  if (elapsedMs < MIN_FOCUS_MS) return null  // silent skip
  return elapsedMs
}
```

- < 5min 退出 → 不自动 commit；进 SessionEndPanel 的 input 表单让用户手填
- ≥ 5min 退出 → 走自动 commit 流程

### 7.5 退出衔接 — 与 SessionEndPanel confirmation 视图合并

**关键设计**：复用现有 SessionEndPanel 的 confirmation 视图作为"自动 commit 的反馈"。零额外 UI、零 nudge / hint。

```
进沉浸态 ─────► startFocusTimer (localStorage)
   │
   │   ... 专注中 ...
   │
退出沉浸态 ──► FocusPage 切到 'ending' state
   │
   ▼
SessionEndPanel mount
   │
   ├─ elapsed < 5min  ──► silent skip，照旧进 input 表单（用户手填）
   │
   └─ elapsed ≥ 5min  ──► consume timer 拿 elapsedMs
                          ├─ 拉取 category default (见 7.6)
                          ├─ 自动调用 addFocusSession(userId, category, elapsedHours)
                          ├─ writeSubmittedSession(userId, session)
                          └─ setSubmittedSession ──► 直接渲染 confirmation 视图
                                                       │
                                                       ├─ [完成] ──► onComplete (回 default 态)
                                                       └─ [更正刚刚记录] ──► 回 input 表单改 → 保存 → 又回 confirmation
```

用户视觉体感：

```
退出沉浸态 → 立刻看到 "已记录本次专注 / 02h 05min / 课外学习 / [完成] [更正]"
```

**为什么这个 flow 优雅**：
- 复用现有 confirmation 视图的全部 UX 语义（系统保存 + 修改入口）
- 不需要任何 ambient hint / nudge / banner
- "更正刚刚记录"是天然的修改入口（既有按钮）
- 跟原有手填流程合并到同一最终状态（confirmation）

### 7.6 Category default — last submitted session

timer 只给时长，给不了 category。用 **上次保存的 focus_session 的 category** 作为 default：

新增 helper:
```ts
// src/lib/api/focus-sessions.ts
export async function getLastFocusCategory(userId: string): Promise<string | null>
```

查询 `focus_sessions` 表中该 user 最近一条 session 的 category，返回。

SessionEndPanel mount 时拉取 → 用作自动 commit 的 category。

Fallback 链：last category → focus-draft category → `'in_class'`（DEFAULT_FOCUS_DRAFT.category）

### 7.7 Edge case — 忘记退出的 over-shoot

明确**不做 auto trim**。理由：
- Web app 无法可靠检测"真实专注时长" —— 用户的专注信号可能完全在 app 之外（用纸笔 / 电脑别软件 / 手机别 app）
- 浏览器关闭后 client-side activity tracking 完全失效
- 所有 client-side 检测都是脆弱假设的堆叠，违反 §2 已确立的 "信任用户对自己路径的判断" 产品 DNA

**Honest 兜底**：用户在 confirmation 视图看到 elapsed 时，自行判断是否点"更正刚刚记录"修改。confirmation 视图的[更正]按钮本来就是为这个 case 设计的。

### 7.8 opt-in / settings

加两个字段到 user preferences：
- `enable_focus_timer` (默认 **true**) — 计时器总开关；关掉则不写 localStorage / 不显示时间数字 / 不预填 SessionEndPanel（保持现状手填）
- `enable_motion_detection` (默认 **true**) — 移动端加速度感应；关掉则沉浸态内不显示时间数字（无 fallback，与 7.3 一致）

### 7.9 横屏适配 — 跟 §6 协同

§6 横屏下 orb 缩到右下 ~80px。计时数字浮层跟着 orb 位置（仍在"回归"label 下方），整体跟着 orb 在右下小区域内呈现。motion detector / hover trigger 不变。

### 7.10 Files Changed

**新增**：
- `src/lib/focus-timer.ts` — start / read elapsed / consume / clear（all localStorage）+ 8h invalidation
- `src/lib/focus-timer.test.ts`
- `src/lib/motion-detector.ts` — DeviceMotion 权限申请 + pickup / putdown 检测 emit 事件
- `src/lib/motion-detector.test.ts`

**修改**：
- `src/app/focus/page.tsx` — `focus_state` sessionStorage → localStorage + 8h invalidation
- `src/components/focus/FocusDefaultState.tsx` — "开始专注" click handler 内调 iOS motion permission request（如 enable_motion_detection）
- `src/components/focus/FocusImmersiveState.tsx` — mount 调 `startFocusTimer()` + initMotionDetector，onExit 不做 consume（交给 SessionEndPanel）
- `src/components/focus/ReturnButton.tsx` — 加 hover / pickup-putdown 触发显示时间数字（无 long-press）
- `src/components/focus/SessionEndPanel.tsx` — mount 时 useEffect 拿 timer elapsed → 走 7.5 描述的自动 commit 分支
- `src/lib/api/focus-sessions.ts` — 加 `getLastFocusCategory` helper
- `src/lib/api/growth-preferences.ts` + DB schema — 加 `enable_focus_timer` + `enable_motion_detection`
- `src/app/settings/page.tsx` — 加两个 toggle UI

### 7.11 Verification

**自动**：
- `focus-timer.ts` 单测（start / read / consume / clear + 8h invalidation）
- `motion-detector.ts` 单测（模拟 DeviceMotion event 序列 → pickup / putdown 检测）

**手动**：
- 进沉浸态 1min → hover orb → 看到 "01:00"
- 进沉浸态 → **关闭整个浏览器** → 重新打开 → 仍在沉浸态 + 计时器从原 timestamp 继续 ✓
- 进沉浸态后过 9h 再开 → 沉浸态自动 reset，计时器清空
- iOS：首次进沉浸态弹原生 motion 授权弹窗，授权后拿起手机时间浮现，放下消失
- iOS 拒绝授权 → 沉浸态内不显示时间数字（用户依赖退出后 SessionEndPanel 看记录值）
- 桌面：hover orb 显示时间，离开隐藏
- 4 分钟退出 → SessionEndPanel input 表单（手填模式），不自动 commit
- 6 分钟退出 → SessionEndPanel 直接显示 confirmation 视图 "已记录 06min / [上次 category]"
- Confirmation 视图点[更正] → 回 input 表单改 → 保存 → 又回 confirmation
- Settings 关 enable_focus_timer → 进沉浸态 → orb 不显示数字 → 退出走原 input 表单流程
- Settings 关 enable_motion_detection → 移动端进沉浸态 → 不请求 motion 权限 → 沉浸态内不显示时间数字

### 7.12 Out-of-scope (Follow-up)

- 倒计时 / pomodoro 目标时长模式（设 25/50/90min 到点提示）
- 暂停 / 继续
- 跨设备 sync（多设备开同一 session）
- "今日累计专注"hover 显示
- 完成时 sound feedback
- 加速度 threshold 用户可调
- 自动学习用户的拿起/放下模式（ML personalization）
- "8h 僵尸 session"恢复 prompt（"你上次专注似乎没退出，要继续还是清空？"）—— 现在做 silent invalidate

### 7.13 Risks

中。
- 协同 4 个组件（FocusDefaultState / FocusImmersiveState / ReturnButton / SessionEndPanel）通过 localStorage + focus-draft 串联
- localStorage migration：既有 sessionStorage 用户首次访问会发现"上次沉浸态不见了"，但因为之前本来就靠 sessionStorage 保不住，无实质回归
- 加速度传感器跨设备表现差异需要 threshold tuning（先给默认值 ~2 m/s² 突变，根据使用反馈调）
- iOS 授权弹窗的 first-time UX 需要好的引导（放在"开始专注"按钮 click handler，避免弹得突兀）

---

## Cross-cutting concerns

### C1 · "信任用户路径"作为统一产品 DNA

§2 / §6 / §7 三处独立得出同一结论：**不靠系统替用户判断 / 不主动 surface 推断结果 / 把决定权留给用户**。

具体体现：
- §2 不主动 surface "你有未完成的 5/22 草稿"（信任用户记忆）
- §6 横屏下 typography 主导、数据点退到角落（信任用户的专注本身）
- §7 拒绝 client-side auto trim、不在 SessionEndPanel 加 ambient hint（信任用户对自己时长的判断）

这条 DNA 应该贯穿整个 batch 的实现取舍：任何"系统帮用户决定"的诱惑都要先验证是否违反此原则。

### C2 · LocalStorage Persistence Pattern

§2（DailyEntryForm draft）+ §7（focus timer + 沉浸态 state）都用 localStorage 做客户端 persistence。共享的 pattern：

- 按 `(userId, [date | sessionId])` 分桶的 storage key
- mount 时读 + 用户操作时 debounced 写
- 完成事件后 clear（§2 是保存成功、§7 是 5min 阈值未达 / 已 consume）
- TTL / invalidation：§7 8h 自动 clean，§2 不主动清旧草稿
- 复用既有 `focus-draft.ts` 的代码风格（statelessly pure helpers + storage 注入）

可以考虑抽一个 `src/lib/storage/` 子目录统一 helpers，但 **本 batch 不抽** —— 避免提前抽象，等第三个 use case 出现再说。

### C3 · Persistence model 升级影响面

§7 把 `focus_state`（沉浸态状态）从 sessionStorage 升级到 localStorage 是个**模型升级**：
- 跨 tab、跨浏览器关闭都 persist
- 加 8h auto invalidation
- 既有 `focus-last-bg`（背景图 url 缓存）、`focus-last-submitted-session` 等也需要 review 是否要同步升级

**本 batch 仅升级 `focus_state`**，其他相关 storage keys 留作 follow-up 评估。

### C4 · Token 系统审计 follow-up

§1 暴露了"幽灵 token"问题（`--color-surface` / `--color-surface-2` 未定义但被引用）。本 batch 只修这 4 处，**但强烈建议作为 follow-up 做一次全 codebase grep**：

```bash
grep -rE "var\(--color-[a-z0-9-]+\)" src/ | extract token names
diff against tokens defined in src/app/globals.css @theme inline
```

清单 → 单独 PR 修复其他幽灵 token。

### C5 · 移动端 / 横屏的耦合考虑

§5（热力图） / §6（横屏专注） / §7（横屏计时器浮层） 都涉及移动端布局：

- §5：决定移动端 analysis 页保持竖屏，**不为横屏特化**
- §6：横屏专注页是核心 use case，重排为 typography 主导
- §7：时间数字浮层跟随 §6 的 orb 位置（右下小区域）

三者协同：**只有 focus 页面做横屏特化，其他页面竖屏即可**。这是个统一决策，避免分散投入做不必要的横屏适配。

### C6 · 实现顺序建议

按风险 / 依赖 / 验证难度排序，建议实现顺序：

1. **§1 Token fix**（最简、可独立 ship，立刻让用户看到效果）
2. **§3 Realtime fixes**（修两个 bug，独立、改动可控）
3. **§2 Draft persistence**（参照 focus-draft.ts 范式，独立）
4. **§6 横屏布局**（纯 CSS，无 JS）
5. **§7 Timer**（涉及多组件协同，依赖 §6 横屏布局已就绪）
6. **§5 热力图重做**（重构一个组件 + 新增 ~4 文件）
7. **§4 今日回声重构**（最复杂，新增 ~7 文件 + voice library 文案打磨）

前 4 项可视为 "Phase A"（bug 修复 + 简单改进），可独立 ship；后 3 项是 "Phase B"（重构 + voice library 打磨），需要更多测试与文案投入。
