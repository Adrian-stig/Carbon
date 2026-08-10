# 碳迹 · 上海

面向企业员工的每周个人碳足迹记录网站，支持衣、食、住、行、网购和垃圾六类活动记录、个人趋势、减排建议与匿名企业汇总。

## 技术栈

- Next.js 16 App Router
- React 19
- Neon Postgres + Drizzle ORM
- Clerk 企业邮箱登录
- Vercel Functions，首选香港区域 `hkg1`

## 本地准备顺序

本项目依赖 Vercel 托管的数据库和登录服务。请先在 Vercel 中创建并连接项目，再运行数据库或开发命令。

1. 从 GitHub 导入项目，Framework Preset 选择 `Next.js`。
2. 在 Vercel Marketplace 安装 Neon，并连接到该项目。
3. 在 Vercel Marketplace 安装 Clerk，并连接到该项目。
4. 拉取环境变量：

```bash
npx vercel link
npx vercel env pull .env.local --yes
```

5. 确认 `.env.local` 中包含以下变量名：

```text
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```

6. 创建数据库表并启动：

```bash
npm install
npm run db:migrate
npm run dev
```

## 常用命令

```bash
npm run dev          # 本地开发
npm run lint         # 静态检查
npm run build        # 生产构建
npm run db:generate  # 根据 schema 生成迁移
npm run db:migrate   # 应用已生成的迁移
npm run db:studio    # 打开 Drizzle Studio
```

## Vercel 项目设置

- Framework Preset: `Next.js`
- Root Directory: `.`
- Build Command: `npm run build`
- Output Directory: 留空
- Node.js: `24.x`
- Function Region: `hkg1`

环境变量由 Vercel Marketplace 注入，不要把 `.env.local` 或任何密钥提交到 Git。

## 部署前检查

```bash
npm run lint
npm run build
```

GitHub 的 `main` 分支用于生产部署，其他分支和 Pull Request 用于 Vercel Preview Deployment。
