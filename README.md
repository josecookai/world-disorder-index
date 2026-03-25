# 世界完蛋了指数 (Global Disorder Index)

Global Disorder Index (GDI) 是一个将复杂地缘风险压缩为 0-100 分的仪表盘产品。当前仓库已实现 v1.1 MVP：总分仪表盘、状态标签、WoW 变化、五维拆解、驱动因素、区间说明与趋势图，以及审核/发布后台骨架。

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres/Auth/RLS) ready
- Zod for API schema validation

## 快速开始

```bash
git clone https://github.com/josecookai/world-disorder-index.git
cd world-disorder-index
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 页面与接口

- `/` 公开 Dashboard
- `/admin/review` 候选事件审核页面（MVP 骨架）
- `/admin/publish` 发布页面（MVP 骨架）
- `GET /api/gdi/latest`
- `GET /api/gdi/history?range=3M`
- `GET /api/gdi/drivers`
- `POST /api/gdi/publish`（当前为占位实现）

## 当前实现范围 (v1.1 MVP)

- Hero: 总分、标签、更新时间、WoW
- 五维分项条
- 本周驱动因素与一句话摘要
- 历史趋势图
- 风险区间说明
- 方法论提示（非概率预测器）

## 下一步

- 接 Supabase 持久化审核流：`pending -> accepted/rejected -> published`
- 完成管理员认证与 RLS
- 增加事件注释层与市场映射模块
