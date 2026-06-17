# 04-数据库与运行部署

## 作用

管理数据库设计、运行环境、部署方式、环境变量、迁移方案、Docker、本地运行和服务器部署。

## 当前数据库

MVP 本机使用 MariaDB/MySQL。

相关配置：

```text
backend/.env
backend/.env.example
backend/src/config/database.config.ts
backend/docker-compose.yml
```

## 当前运行方式

本机服务脚本：

```powershell
cd backend
npm run service:start
npm run service:stop
```

数据库脚本：

```powershell
npm run db:start
npm run db:stop
```

## 已完成

- 本机便携 MariaDB 已安装在 `backend/.runtime/`。
- `.runtime` 已被 `.gitignore` 忽略。
- NestJS 可连接数据库。
- TypeORM 实体已创建基础表。
- Docker Compose 已提供 PostgreSQL/MySQL 参考。
- 后端服务可通过 `http://127.0.0.1:3000` 访问。

## 当前表方向

已有或规划的核心表：

```text
users
residents
care_tasks
alerts
camera_streams
devices
device_events
ai_events
integrations
family_feedback
standards
```

## 当前风险

- 开发环境使用 `DB_SYNC=true` 自动同步表结构。
- 生产环境不能继续依赖自动同步。
- 尚未建立迁移脚本。
- 尚未建立数据库备份和恢复流程。

## 生产建议

生产环境应做到：

```text
DB_SYNC=false
使用迁移脚本管理表结构
数据库密码使用环境变量
启用定期备份
重要操作写审计日志
```

## 下一步

1. 输出数据库表结构说明。
2. 规划迁移脚本目录。
3. 补充服务器部署说明。
4. 规划数据备份和恢复演练。
