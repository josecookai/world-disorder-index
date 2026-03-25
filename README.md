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
- `GET /api/internal/ingest/scheduled`（内部定时 ingest 入口，支持 `POST` 手动触发）

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

## Scheduled ingest

仓库现在提供一个内部定时 ingest 入口：

- `GET /api/internal/ingest/scheduled`

调度方式：

- 部署环境：通过根目录 [`vercel.json`](/Users/bowenwang/Documents/Vibe%20Coding%20/世界完蛋了/vercel.json) 的 cron 每小时触发一次
- 本地环境：在 `npm run dev` 运行时，用系统 `cron` 或任意 scheduler 定时 `curl` 这个内部路由

鉴权方式：

- 生产推荐使用 `CRON_SECRET`
- 本地也可继续使用 `INGEST_SCHEDULE_SECRET`
- 请求头支持 `Authorization: Bearer <secret>` 或 `x-ingest-schedule-secret: <secret>`

行为说明：

- 定时任务复用 ingest preview 的 fail-soft 执行模型
- 单个 source 失败不会导致整个 scheduled run 失败
- 每次执行都会把最近一次汇总写到 `data/gdi-ingest-run.json`
- 每次执行都会输出一条结构化日志到 server console

本地示例：

```bash
export CRON_SECRET=replace-with-a-long-random-secret
curl http://localhost:3000/api/internal/ingest/scheduled \
  -H "Authorization: Bearer $CRON_SECRET"
```

macOS / Linux crontab 示例：

```bash
0 * * * * curl -s http://localhost:3000/api/internal/ingest/scheduled -H "Authorization: Bearer $CRON_SECRET"
```

运维假设：

- 这是内部入口，不应暴露到公开客户端
- 生产环境需要配置 `CRON_SECRET`
- 如果某个 adapter 上游故障，响应中的 `diagnostics` 和 server log 会保留错误信息，任务整体仍继续完成
