# Level Up — UI 设计草稿

**日期：** 2026-02-28（初稿） → 2026-03-01（更新至第二轮 D–J）
**状态：** 第二轮完成，第三轮设计中

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

---

## 第二轮方案（桌面端，D–J）

> 所有方案均以 1280px+ 桌面端为主设计，输出为独立 HTML 预览文件。

### 方案 D：Atelier 工房（浅色系）⭐ 用户好评

**文件：** `design-previews/D-atelier.html`
**方向：** 瑞士新编辑风（Swiss Neo-Editorial）
**字体：** Bebas Neue（展示） + Manrope（正文） + JetBrains Mono（数据）
**配色：**
- 背景：暖白 `#fafaf8`，卡片 `#ffffff`
- 主色：朱红 vermillion `#e8380d`
- 文字：纯黑 `#111111`，次级 `#666666`，弱 `#999999`
- 辅助：石墨 `#333333`

**设计特征：**
- 零圆角（border-radius: 0），硬朗几何感
- 倒计时数字 140px Bebas Neue，hover 时数字变朱红 + 左侧 3px 红色竖线滑入 ⭐
- 区域标签：`01 —— 倒计时` 编号式，左侧红色竖线装饰
- Hero 日期 200px 超大字号，底部 1px 分割线
- 专注页面：深色反转（#111 底），180px 圆形回归按钮 hover 填充朱红
- 音频播放器：底部全宽条，1px 上边框

**用户评价：** "眼前一亮"，倒计时 hover 动效惊喜感强，配色有高级感

---

### 方案 E：Porcelain 素瓷（浅色系）⭐ 配色好评

**文件：** `design-previews/E-porcelain.html`
**方向：** 侘寂美学 × Kinfolk 杂志风
**字体：** Cormorant Garamond（展示，斜体） + DM Sans（正文） + DM Mono（数据）
**配色：**
- 背景：亚麻 `#f5f1eb`，卡片：奶油 `#faf8f4`
- 主色：赤陶 terracotta `#c06a45`
- 辅助：鼠尾草绿 sage `#7a8f72`，奶油 `#e8dfd4`
- 文字：深棕 `#2c2420`，次级 `#7a7068`，弱 `#b5ada5`

**设计特征：**
- 大圆角 24px，有机柔和感
- 区域标题用 Cormorant Garamond 斜体，如 *倒计时*
- 纸质纹理：SVG filter 生成的微噪点叠加
- 倒计时数字 64px DM Mono，赤陶色
- 专注页面：深棕暖色调，呼吸脉冲环动画
- 音频播放器：胶囊形，赤陶色进度条

**用户评价：** 配色系统有高级感

---

### 方案 F：Void 虚空（深色系）🌑 暂存

**文件：** `design-previews/F-void.html`
**方向：** 赛博朋克新粗野主义（Cyberpunk Neo-Brutalist）
**字体：** Syne（展示） + JetBrains Mono（全局正文，全等宽）
**配色：**
- 背景：纯黑 `#050505`，卡片 `#0a0a0a`，高亮面 `#111111`
- 主色：电光黄绿 lime `#c8ff00`
- 辅助：品红 magenta `#ff2d78`，青 cyan `#00e5ff`
- 边框：`#222222` / `#333333`

**设计特征：**
- 零圆角，2px 间隙网格系统（gap: 2px; background: border-color）
- 扫描线叠加（repeating-linear-gradient 4px 间距）+ 暗角（radial-gradient vignette）
- 终端风区域标题：`>_ countdown.list()`
- 倒计时数字 72px Syne，hover 变 lime 色 + 左侧 3px lime 竖线
- 导航栏：底部 2px 下划线指示器，右侧状态灯 `SYSTEM ACTIVE`
- 专注页面：纯黑 + 矩阵网格背景，200px 方形回归按钮 + 四角括号装饰
- 音频播放器：底部全宽条，2px lime 进度条

**状态：** 暗色模式暂存备用

---

### 方案 G：Nebula 星云（深色系）🌑 暂存

**文件：** `design-previews/G-nebula.html`
**方向：** 深空奢华（Deep Space Luxury）
**字体：** Tenor Sans（展示，衬线） + Lexend（正文） + Fira Code（数据）
**配色：**
- 背景：深靛 `#08091a`，中层 `#0e1028`
- 主色：玫瑰金 `#d4836b`，星云紫 `#7c5bf0`
- 辅助：宇宙青 teal `#2dd4bf`
- 文字：淡紫白 `#eae8f5`，次级 55% 透明，弱 28% 透明

**设计特征：**
- 20px 圆角玻璃卡片，`backdrop-filter: blur(16px)`
- 星空背景：10+ 个 `radial-gradient` 模拟星点 + twinkle 动画
- 极光环境光：三层 radial-gradient + `auroraShift` 位移动画
- 区域标签：等宽字体 + 红点 + 渐隐分割线
- Hero 日期 80px Tenor Sans，渐变文字（白→半透明）
- 专注页面：极光背景，双轨道环旋转动画（orbRing 6s/10s）
- 折线图：玫瑰金→星云紫渐变描边
- 音频播放器：底部渐隐条，玫瑰金→紫渐变进度

**状态：** 暗色模式暂存备用

---

### 方案 H：Liquid Glass 液态玻璃（特殊）

**文件：** `design-previews/H-liquid-glass.html`
**方向：** iOS 26 液态玻璃效果
**字体：** Outfit（正文） + IBM Plex Mono（数据）
**配色：**
- 背景：明亮风景渐变（蓝+绿+金+粉），贯穿所有页面
- 玻璃层级：glass-1（38% 白，blur 40px），glass-2（22% 白，blur 24px），glass-3（12% 白，blur 12px）
- 方向性边框：顶 65% 白 → 左 40% → 右 18% → 底 12%
- 主色：蓝 `#3b82f6`，成功绿 `#10b981`，玫瑰 `#f43f5e`

**设计特征：**
- 4 个动画液态色块（blur:70px，18-25s 周期）
- 三级玻璃深度系统 + 高光伪元素（`::before` 135deg 渐变）
- 浮动胶囊导航栏
- 专注页面：偏冷色调风景渐变 + 玻璃圆形回归按钮 + 呼吸环
- 胶囊形音频播放器

---

### 方案 I：Spectrum 光谱（浅色系）

**文件：** `design-previews/I-spectrum.html`
**方向：** 色彩编码仪表盘（Color-Coded Dashboard）
**字体：** Plus Jakarta Sans（正文） + Fira Code（数据）
**配色：**
- 背景：冷灰 `#f1f5f9`，卡片 `#ffffff`
- 靛蓝 `#6366f1`（倒计时/图表），翡翠绿 `#10b981`（概览/指标）
- 琥珀 `#f59e0b`（便签/历史），蓝 `#3b82f6`（录入/操作）
- 玫瑰 `#f43f5e`（下降趋势）
- 文字：`#0f172a`（≥15:1 对比度），`#475569`，`#94a3b8`

**设计特征：**
- 点阵背景：`radial-gradient(circle, rgba(148,163,184,0.12) 1px, transparent 1px) 24px`
- 每张卡片左侧 4px 色条（`.card::before`），按区域着色
- 倒计时数字 56px 靛蓝等宽，指标数字 28px 翡翠绿
- 导航栏：全宽顶部条，靛蓝色活跃标签
- 分段控制器式筛选按钮
- 专注页面：靛蓝渐变 `#312e81→#6366f1→#818cf8`，圆角矩形回归按钮

---

### 方案 J：Luma 流明（浅色系）

**文件：** `design-previews/J-luma.html`
**方向：** 纯白画布 + 彩色辉光阴影
**字体：** Rubik（正文） + IBM Plex Mono（数据）
**配色：**
- 背景：纯白 `#ffffff`，次级 `#f8fafc`
- 紫罗兰 `#7c3aed`（主色），粉 `#ec4899`，天蓝 `#0ea5e9`
- 绿 `#22c55e`，橙 `#f97316`，玫瑰 `#f43f5e`
- 文字：`#18181b`，`#52525b`，`#a1a1aa`

**设计特征：**
- 微弱环境色洗（fixed `::before` 三层 radial-gradient，紫 3%/粉 2.5%/蓝 2%）
- 彩色辉光阴影系统：每张卡片按类型投射对应色彩阴影，hover 加深 + translateY(-3px)
- 倒计时数字在彩色高亮药丸背景中（`.cd-highlight.hl-violet`）
- 浮动胶囊导航栏
- 专注页面：柔和粉彩渐变 `#ede9fe→#fce7f3→#e0f2fe→#ecfdf5` + 3 个动画色块
- 玻璃圆形回归按钮 + 胶囊音频播放器

**用户评价：** 清新感不错，但紫色系让人联想到经典老派 AI 审美，需规避

---

## 第三轮设计（进行中）

见 `docs/plans/2026-02-28-ui-feedback.md`
