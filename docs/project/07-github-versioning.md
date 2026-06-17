# 07-GitHub发布与版本管理

## 作用

管理 GitHub 仓库、提交规范、分支策略、版本号、README、发布记录和发布说明。

## 当前仓库

GitHub 仓库：

```text
https://github.com/CR2181/sunset-health-management-system
```

## 已完成

- 本地 Git 仓库已初始化。
- 公开 GitHub 仓库已创建。
- 初始版本已推送。
- 当前项目已形成 MVP 后端骨架和文档体系。

## 当前状态

本地存在未提交改动，主要包括：

- 新增 NestJS 后端。
- 新增项目架构文档。
- 新增 00-08 项目管理文档。
- 修改前端 API 兼容逻辑。
- 修改 README 和 .gitignore。

## 提交规范建议

提交信息使用简短英文或中英结合：

```text
docs: add MVP project structure
backend: add NestJS MVP skeleton
frontend: connect dashboard API response
chore: update local service scripts
```

## 分支策略

MVP 阶段建议：

```text
main       稳定可运行版本
codex/*    Codex 任务分支
```

当前阶段如果继续直接在 `main` 上开发，提交前必须先跑检查。

## 发布记录模板

```text
版本：
日期：
主要变化：
验证方式：
已知问题：
下一步：
```

## 下一步

1. 整理当前未提交改动。
2. 运行构建和接口检查。
3. 创建一次 MVP 骨架提交。
4. 推送到 GitHub。
