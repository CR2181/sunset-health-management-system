# 04A-本地数据库先行与云数据库预留

## 当前决定

第一代 MVP 试点阶段，数据库暂时建立在本地电脑或本地试点服务器上。

```text
当前默认：MariaDB/MySQL 本地数据库
后续可接：云 MySQL、云 PostgreSQL
当前不做：云数据库购买、云账号绑定、生产级迁移
```

## 为什么这样做

- 成本低：不需要先购买云数据库。
- 落地快：养老院试点可以先在本机或局域网服务器跑通。
- 风险小：先验证业务流程，再决定云资源规格。
- 可迁移：后端数据库连接全部走环境变量，后续换云库主要改 `.env`。

## 当前配置文件

```text
backend/.env
backend/.env.example
backend/src/config/database.config.ts
```

## 当前本地运行命令

```powershell
cd backend
npm run service:start
npm run service:stop
npm run smoke
```

## 以后接云数据库时要改什么

购买云数据库后，只需要更新：

```text
DB_TYPE=mysql 或 postgres
DB_HOST=云数据库地址
DB_PORT=云数据库端口
DB_USERNAME=云数据库账号
DB_PASSWORD=云数据库密码
DB_DATABASE=云数据库名称
DB_SYNC=false
```

正式云环境必须关闭 `DB_SYNC`，并改用数据库迁移脚本管理表结构。

## 当前风险

- 本地数据库适合试点，不适合多院区正式生产。
- `DB_SYNC=true` 方便开发，但正式上线前必须关闭。
- 需要定期备份本地数据库，避免电脑故障导致数据丢失。
