# EasyChat

EasyChat 是一个基于 Expo + React Native + Gifted Chat 的移动聊天应用模板，后端通过 Vercel 云函数转发到 DeepSeek OpenAI 兼容接口。

## 目录结构

```text
easychat/
├── .gitignore
├── app.json
├── App.js
├── package.json
├── eas.json
├── vercel.json
├── api/
│   └── chat.js
├── src/
│   ├── api.js
│   └── ChatScreen.js
└── .github/
    └── workflows/
        └── build-apk.yml
```

## 本地运行

```bash
npm install
npm run start
```

## Vercel 云函数环境变量

在 Vercel 项目中配置：

```bash
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

云函数地址通常是：

```text
https://你的-vercel-项目名.vercel.app/api/chat
```

## 前端 API 地址

部署 Vercel 后，需要把 `src/api.js` 中的默认地址替换成真实地址，或在 Expo/EAS 构建环境中配置：

```bash
EXPO_PUBLIC_CLOUD_FUNCTION_URL=https://你的-vercel-项目名.vercel.app/api/chat
```

## APK 构建

仓库包含 GitHub Actions 工作流 `.github/workflows/build-apk.yml`，以及 Expo EAS 构建配置 `eas.json`。

需要先在 GitHub Secrets 中配置：

```bash
EXPO_TOKEN=你的 Expo Token
```

然后推送到 `main` 分支或手动触发工作流即可开始构建 APK。
