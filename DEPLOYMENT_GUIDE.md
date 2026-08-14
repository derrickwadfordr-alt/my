# 🚀 AI Virtual Phone 部署指南

## 快速部署到 Vercel / Netlify

### 📋 前提条件

- 已经 Fork 或 Clone 了这个仓库到你的 GitHub 账户
- 有 Vercel 或 Netlify 账户（都支持用 GitHub 直接登录）

---

## ✨ 方案 A：部署到 Vercel（推荐 - 自动识别 Next.js）

### 步骤 1：连接仓库

1. 打开 [vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 **Add New** → **Project**
4. 选择你的 `ai-virtual-phone` 或 `my` 仓库
5. 选择 **main** 分支

### 步骤 2：配置环境变量

在部署设置中找到 **Environment Variables** 部分，添加：

```
Key: NEXT_PUBLIC_SELF_HOSTED_MODE
Value: true
```

### 步骤 3：部署

点击 **Deploy** 按钮，等待 2-5 分钟构建完成。

✅ 完成！你会获得一个 `*.vercel.app` 的链接

---

## 🌐 方案 B：部署到 Netlify

### 步骤 1：连接仓库

1. 打开 [netlify.com](https://netlify.com)
2. 用 GitHub 账号登录
3. 点击 **Add new site** → **Import an existing project**
4. 授权 GitHub 并选择仓库
5. 选择 **main** 分支

### 步骤 2：构建设置（自动检测）

应该自动显示：

```
Build command: npm run build
Publish directory: .next
```

✅ 保持默认即可（我们已经配置了 `netlify.toml`）

### 步骤 3：环境变量配置

在 **Site settings** → **Build & deploy** → **Environment** 中添加：

```
Key: NEXT_PUBLIC_SELF_HOSTED_MODE
Value: true
```

### 步骤 4：部署

点击 **Deploy** 按钮，等待构建完成。

✅ 完成！你会获得一个 `*.netlify.app` 的链接

---

## 🎮 首次使用

部署完成后，打开你的部署链接：

1. 点击「首次使用」按钮
2. 按照提示进行初始配置
3. 添加你的 LLM API（OpenAI / DeepSeek / 等）
4. 创建或导入 AI 角色
5. 开始玩小手机！

---

## 📝 关键配置文件

- **`.env.example`** - 环境变量示例（Vercel/Netlify 会忽略这个，需要在平台后台添加）
- **`netlify.toml`** - Netlify 专用配置
- **`vercel.json`** - Vercel 专用配置
- **`package.json`** - Next.js 项目配置（两个平台都会自动读取）

---

## 🔧 本地开发运行

如果想在本地运行：

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local

# 本地开发（端口 3001）
npm run dev

# 打开浏览器
# http://localhost:3001
```

---

## ⚙️ 自托管模式说明

当设置 `NEXT_PUBLIC_SELF_HOSTED_MODE=true` 时：

✅ **启用功能：**
- 跳过官方账号和激活码系统
- 使用本地单机账号（数据保存在浏览器）
- 所有功能本地可用

❌ **禁用功能：**
- 云端数据备份
- 账号同步
- 便签墙等需要 Supabase 的功能

---

## 🚨 常见问题

### Q: 部署后出现 "NEXT_PUBLIC_SELF_HOSTED_MODE is not defined" 错误

**A:** 你在平台后台添加环境变量了吗？
- Vercel：Project Settings → Environment Variables
- Netlify：Site settings → Build & deploy → Environment

### Q: 构建失败

**A:** 检查：
1. Node.js 版本 ≥ 18.18（通常平台会自动使用最新版本）
2. 是否添加了 `NEXT_PUBLIC_SELF_HOSTED_MODE=true` 环境变量
3. 仓库中是否有所有必需的文件（`.env.example`, `netlify.toml` 等）

### Q: 部署后无法聊天

**A:** 需要在应用内设置 LLM API：
1. 打开设置
2. 找到 API 设置
3. 添加你的 OpenAI、DeepSeek 等 API Key
4. 创建或导入 AI 角色
5. 开始聊天

---

## 📚 更多资源

- 原始项目：https://github.com/xiaolongbao0709/ai-virtual-phone
- Vercel 文档：https://vercel.com/docs
- Netlify 文档：https://docs.netlify.com/

---

## 🎯 后续优化

如果想启用更多功能，可以选择性配置：

- **自己的 Supabase** - 启用云端功能（账号同步、便签墙等）
- **生图 API** - 支持 AI 生成图片
- **Minimax 语音** - 支持 AI 语音合成
- **网易云音乐 API** - 支持在线音乐

详见 `.env.example` 的注释和原项目文档。

---

祝你玩得开心！🎉
