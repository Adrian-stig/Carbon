# 碳迹 · 上海

面向企业员工的每周个人碳足迹记录原型，支持衣、食、住、行、网购和垃圾六类活动记录、个人趋势与减排建议。

## 技术栈

- Next.js 16 App Router
- React 19
- 浏览器 `localStorage` 本地保存
- 暂不提供登录、数据库或真实邮件发送
- Vercel 部署

## 本地启动

当前版本不需要任何环境变量，也不需要配置 `DATABASE_URL`。

```bash
npm install
npm run dev
```

## 当前数据方式

个人资料、家庭基线和每周打卡记录保存在当前浏览器的版本化 `localStorage` 中，不会上传到服务器。企业邮箱为可选字段，仅预留给未来的提醒功能，不作为登录凭据，当前也不会发送邮件。

清除网站数据或改用其他浏览器、设备后，本地记录无法恢复。企业统计页面会明确显示未启用，不展示模拟的团队数字。

## 常用命令

```bash
npm run dev          # 本地开发
npm run lint         # 静态检查
npm run build        # 生产构建
```

## Vercel 项目设置

- Framework Preset: `Next.js`
- Root Directory: `.`
- Build Command: `npm run build`
- Output Directory: 留空
- Node.js: `24.x`
- Environment Variables: 无需配置

## 部署前检查

```bash
npm run lint
npm run build
```

GitHub 的 `main` 分支用于生产部署，其他分支和 Pull Request 用于 Vercel Preview Deployment。未来需要跨设备历史、企业汇总或邮件提醒时，再接入数据库和服务端身份体系。
