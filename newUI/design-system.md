# 名有意新 UI 设计系统说明

## 1. 本次使用的 skill
- 使用了用户指定的 [`$ui-ux-pro-max`](C:\Users\JunWei\.agents\skills\ui-ux-pro-max\SKILL.md)。
- 我额外执行了这个 skill 的设计系统检索与补充检索，核心关键词是：
  - `AI nickname generator youthful poetic premium Chinese English mix`
  - `poetic premium emotional generator`
  - `youthful premium cultural app`
  - `Chinese bilingual poetic premium`

## 2. skill 输出的核心结论

### 设计模式
- `Storytelling + Feature-Rich`
- 建议结构：`Hero > Features > CTA`

### 风格方向
- `Liquid Glass`
- 关键词：`Flowing glass / smooth transitions / translucent / premium / iridescent`

### 配色建议
- `Primary`: `#1C1917`
- `Secondary`: `#44403C`
- `CTA`: `#CA8A04`
- `Background`: `#FAFAF9`
- `Text`: `#0C0A09`

### 字体建议
- skill 推荐：`Noto Sans SC`
- 本原型实际采用：
  - 标题：`Noto Serif SC`
  - 正文：`Noto Sans SC`

说明：
- 这里的标题字体调整，是基于 skill 的 `premium / storytelling / poetic` 方向做的设计推断。
- 正文仍沿用 skill 推荐的高可读中文 sans 体系，标题则增加一层更适合“命名产品”的 editorial 气质。

## 3. 原型里实际落下来的设计策略

### 首页
- 不是“单表单直出”，而是“叙事 Hero + 实时结果预演 + 输入工作台”。
- 目标是让用户在点击生成前就先感受到产品价值。

### 工作台
- 把原产品的 `home / results / favorites` 折叠进一个统一 workspace。
- 优点是回退成本更低，也更适合后面拆成可复用组件。

### 结果卡片
- 每张卡片统一包含：
  - 名字
  - 寓意标题
  - 解释文案
  - 模式 / 场景 / 风格标签
  - 复制 / 收藏 / 分享动作

### 轻交互
- 分享和反馈都改成底部抽屉，不再用打断式大弹窗。
- 生成中保留骨架屏和短文案，避免“页面像卡住”。

## 4. 可直接继续迁移到 React 的部分
- `topbar`
- `hero`
- `workspace`
- `control-panel`
- `result-card`
- `favorite-list`
- `share-sheet`
- `feedback-sheet`
- `mobile-dock`

## 5. 当前文件结构
- `newUI/index.html`: 原型入口
- `newUI/styles.css`: 视觉样式
- `newUI/script.js`: 交互脚本
- `newUI/design-system.md`: 设计系统与落地说明

## 6. 预览方式
- 直接打开 `newUI/index.html` 即可查看原型。
- 这份稿子目前不改动现有 React 代码，只作为新的 UI 方向稿输出。
