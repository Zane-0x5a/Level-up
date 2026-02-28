# Level Up — UI 设计草稿（第一轮）

**日期：** 2026-02-28
**状态：** 草稿，待用户确认后进入第二轮迭代

---

## 设计背景

Level Up 个人成长管理系统，三大核心板块：
- 🏠 **首页** — 倒计时 + 便签 + 今日数据概览 + 每日录入
- 🎯 **专注模式** — 全屏背景图 + 回归按钮 + 音频播放器
- 📊 **反思与分析** — 数据图表 + 历史总结

---

## 第一轮方案（移动端预览）

> 注意：第一轮方案均以移动端布局呈现，第二轮将以桌面端为主。

### 方案 A：墨岩 Inkstone（已排除）

**方向：** 深沉内敛，东方书房质感
**基调：** 纯黑底 + 暖铜色点缀
**字体：** Noto Serif SC（衬线） + DM Mono
**问题：** 字体对比度不足，可读性差，已排除

---

### 方案 B：晨光 Aurora（浅色系，参考）

**方向：** 温暖清新，手写质感
**基调：** 暖白底 + 橙色主色调
**字体：** LXGW WenKai TC + Outfit
**评价：** 舒服，但偏平淡，缺乏前卫感和设计张力

---

### 方案 C：星图 Cosmos（深色系，参考）

**方向：** 科技未来，数据驱动
**基调：** 深空底(#10121a) + 青绿色(#00d4aa)发光线条 + 微型网格背景
**字体：** Noto Sans SC + JetBrains Mono
**评价：** 深色系中表现最好，有科技感，但仍不够前卫

#### 配色 Token
```css
:root {
  --bg: #10121a;
  --bg-card: rgba(255,255,255,0.04);
  --bg-card-hover: rgba(255,255,255,0.07);
  --border: rgba(255,255,255,0.08);
  --text-primary: #f0f0f5;
  --text-secondary: rgba(255,255,255,0.55);
  --text-muted: rgba(255,255,255,0.3);
  --cyan: #00d4aa;
  --cyan-dim: rgba(0,212,170,0.15);
  --purple: #a855f7;
  --pink: #f472b6;
  --blue: #60a5fa;
  --amber: #fbbf24;
  --font-main: 'Noto Sans SC', sans-serif;
  --font-code: 'JetBrains Mono', monospace;
}
```

#### 背景处理
```css
/* 渐变光晕 */
body::before {
  background:
    radial-gradient(ellipse 600px 400px at 20% 10%, rgba(0,212,170,0.06) 0%, transparent 100%),
    radial-gradient(ellipse 500px 500px at 80% 90%, rgba(168,85,247,0.05) 0%, transparent 100%);
}
/* 网格线 */
body::after {
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

#### 组件规范（方案C）

**卡片：**
```css
.card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14-16px;
  backdrop-filter: blur(10px);
}
.card:hover {
  background: rgba(255,255,255,0.07);
  border-color: #00d4aa;
  box-shadow: 0 0 20px rgba(0,212,170,0.1);
}
```

**倒计时卡片：**
- 数字：JetBrains Mono, 40px, gradient text（白→灰）
- 底部装饰线：linear-gradient(90deg, cyan, purple)
- hover 发光效果

**回归按钮（专注模式核心）：**
```css
.return-btn {
  width: 140px; height: 140px;
  border-radius: 50%;
  background: rgba(0,212,170,0.06);
  border: 2px solid rgba(0,212,170,0.25);
  /* 双环旋转动画 */
}
.return-btn::before { inset: -12px; animation: orbit 3s linear infinite; }
.return-btn::after  { inset: -24px; animation: orbit 5s linear infinite reverse; }
```

**主操作按钮：**
```css
.primary-btn {
  background: linear-gradient(135deg, #00d4aa, #00b896);
  border-radius: 12px;
  color: #10121a;
  font-weight: 700;
}
```

**图表容器：**
- 圆环饼图（SVG stroke-dasharray）
- 折线图（SVG path bezier curves + gradient fill）
- 数据标签 JetBrains Mono

**底部导航：**
```css
.bottom-nav {
  background: linear-gradient(to top, rgba(16,18,26,0.95) 60%, transparent);
  backdrop-filter: blur(20px);
}
```

#### 方案C完整HTML预览代码

预览文件路径：`design-previews/C-cosmos.html`

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Level Up — 方案 C: 星图 Cosmos</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #10121a;
    --bg-card: rgba(255,255,255,0.04);
    --bg-card-hover: rgba(255,255,255,0.07);
    --border: rgba(255,255,255,0.08);
    --text-primary: #f0f0f5;
    --text-secondary: rgba(255,255,255,0.55);
    --text-muted: rgba(255,255,255,0.3);
    --cyan: #00d4aa;
    --cyan-dim: rgba(0,212,170,0.15);
    --purple: #a855f7;
    --purple-dim: rgba(168,85,247,0.15);
    --pink: #f472b6;
    --pink-dim: rgba(244,114,182,0.15);
    --blue: #60a5fa;
    --amber: #fbbf24;
    --font-main: 'Noto Sans SC', sans-serif;
    --font-code: 'JetBrains Mono', monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--font-main);
    background: var(--bg);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 600px 400px at 20% 10%, rgba(0,212,170,0.06) 0%, transparent 100%),
      radial-gradient(ellipse 500px 500px at 80% 90%, rgba(168,85,247,0.05) 0%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }
  /* ... 完整代码见 design-previews/C-cosmos.html ... */
</style>
</head>
<body>
  <!-- 完整代码见 design-previews/C-cosmos.html -->
</body>
</html>
```

> 完整可运行代码见：`design-previews/C-cosmos.html`

---

## 动画规范（方案C）

```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes orbit {
  0%   { transform: rotate(0deg);   border-color: rgba(0,212,170,0.15) transparent transparent transparent; }
  100% { transform: rotate(360deg); border-color: rgba(0,212,170,0.15) transparent transparent transparent; }
}
@keyframes twinkle {
  0%   { opacity: 0.6; }
  100% { opacity: 1; }
}
```

---

## 第二轮迭代方向（待执行）

见 `docs/plans/2026-02-28-ui-feedback.md`
