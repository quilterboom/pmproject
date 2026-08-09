# 项目长期记忆 (pmproject)

## 设计 / 前端约定
- 前端视觉参考腾讯 TAPD：主品牌色 **#0052D9**（oklch ≈ 0.52 0.21 258）。品牌色板 `brand-50`~`brand-900` 已注入 `src/app/globals.css` 的 `@theme inline`，可直接用 `bg-brand-*` / `text-brand-*` / `from-brand-*` 等工具类。
- 语义色：`success=#16a34a`、`warning=#f59e0b`、`danger=#ef4444`、`info`=品牌蓝。
- 圆角统一 8px（`--radius: 0.5rem`）。
- 配色规则：品牌蓝用于主操作按钮 / 导航选中态 / 标题强调；任务状态语义色保持——完成=绿、进行中=黄、即将到期=橙、超期=红。

## 已知技术债（详见每日记忆 2026-08-09）
- `next.config.js` 与 `next.config.ts` 并存，且 .js 里 `ignoreBuildErrors`+`ignoreDuringBuilds` 全开。
- `src/lib/constants.ts` 的 `API_BASE` 硬编码远程地址 `http://129.226.220.194:5000/api`，本地跑会打到远程。
- `src/lib/db.ts` 无连接池；`init-db.ts` 只建 10 张旧表，代码实际用 19 张。
- 12/32 个 API 无鉴权（含 db-init / notifications-init / model-configs-init / ai/* 等敏感接口）。
- 依赖冗余：dmdb/mysql2/pg/drizzle-orm/@supabase 同装，实际只用 dmdb。
