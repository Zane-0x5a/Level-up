# Level Up — 个人成长管理系统 设计文档

**日期：** 2026-02-27

---

## 一、项目定位

Level Up 是一个高度个人化的成长管理系统，定位为「连接者」：不重复造轮子，而是将现有工具（iBetter、iHour、flomo）的数据汇聚到一处，提供统一的可视化视图和沉浸式体验。

---

## 二、技术架构

| 层 | 工具 | 说明 |
|---|---|---|
| 前端框架 | Next.js | 页面、交互、图表 |
| 数据库 | Supabase (PostgreSQL) | 存储所有数据 |
| 文件存储 | Supabase Storage | 图片、音频文件 |
| 部署 | Vercel | 提供网址，电脑手机均可访问 |
| 图表 | Recharts | 饼图、曲线图等 |
| 笔记集成 | flomo API | 一键发送每日总结 |

**扩展性说明：** 所有数据表预留 `user_id` 字段，现阶段单用户使用（固定值），未来接入 Supabase Auth 即可支持多用户，无需重构数据结构。

---

## 三、数据库设计

### `daily_records`（每日记录）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 预留扩展 |
| date | date | 日期 |
| day_type | enum | `study_day` / `rest_day` |
| focus_in_class | float | 课内投入（小时） |
| focus_out_class | float | 课外投入（小时） |
| entertainment | float | 娱乐消费（小时） |
| ibetter_count | int | iBetter 打卡完成数 |
| return_count | int | 专注回归按钮次数（自动记录） |
| note | text | 今日总结文字 |
| created_at | timestamp | 创建时间 |

### `countdowns`（倒计时）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 预留扩展 |
| label | text | 名称（如"高考"） |
| target_date | date | 目标日期 |

### `sticky_notes`（便签提醒）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 预留扩展 |
| content | text | 内容 |
| order | int | 显示顺序 |

### `audio_clips`（音频片段）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 预留扩展 |
| label | text | 音频名称 |
| file_path | text | Supabase Storage 路径 |
| order | int | 播放顺序 |

### `focus_images`（专注模式背景图）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| user_id | uuid | 预留扩展 |
| file_path | text | Supabase Storage 路径 |

---

## 四、功能模块

### 🏠 首页（默认模式）

- 关键日倒计时（可自定义添加/删除）
- 便签式提醒（可自定义内容和顺序）
- 今日数据概览
- 「每日录入」按钮，点击弹出录入表单

### 🎯 专注模式

- 全屏背景图（用户上传，随机轮换）
- 浮动提醒文字标签（来自首页便签）
- **回归按钮**：大而显眼，每次意识到走神并拉回时按下，记录当日次数，作为专注力训练的正反馈
- 今日回归次数实时显示
- 音频播放器（播放用户上传的音频片段）

### 📊 反思与分析

- **数据可视化：**
  - iHour 三板块时长：饼图 + 曲线图
  - iBetter 打卡完成数：曲线图
  - 专注回归次数：曲线图
- **数据视图切换：** 学习日 / 休假日 / 全部
- **历史每日总结抽屉：** 卡片式排列，点击可展开查看历史总结内容

---

## 五、每日录入流程

1. 点击首页「每日录入」按钮
2. 选择今日类型：学习日 / 休假日
3. 填写 iHour 三板块时长（课内投入 / 课外投入 / 娱乐消费）
4. 填写 iBetter 打卡完成数
5. 填写今日总结文字
6. 提交保存
7. 可选：一键发送今日总结到 flomo

---

## 六、第三方集成

### flomo API
- 用户在设置中配置自己的 flomo 专属 API 链接
- 每日录入完成后，点击「发送到 flomo」将总结文字推送

---

## 七、设计原则

- **不重复造轮子：** 不替代 iBetter、iHour、flomo，只做聚合和可视化
- **沉浸感：** 整个应用氛围围绕个人成长，营造专注和仪式感
- **高度可拓展：** 模块化设计，方便随时增删功能
- **单用户优先，预留多用户扩展能力**
