# 音乐振动播放器 (Audio Vibration Player)

一个支持音乐律动振动的网页音频播放器，让音乐在你的掌心律动。

## 🎵 功能特性

### 核心功能
- **本地音频播放**: 支持 MP3、AAC、OGG、WAV 等常见音频格式
- **实时音频分析**: 基于 Web Audio API 的频谱分析和节拍检测
- **智能振动同步**: 根据音乐律动实时触发设备振动
- **可视化显示**: 实时音频频谱和波形可视化

### 振动特性
- **节拍检测振动**: 自动检测音乐节拍并同步振动
- **频率分析振动**: 根据低频、中频、高频变化触发不同振动模式
- **多种振动模式**: 包括节拍、强节拍、低频、连续等多种振动模式
- **微信风格振动**: 参考微信铃声的振动效果设计
- **自适应同步**: 智能延迟补偿，确保振动与音乐精准同步

### 移动端优化
- **响应式设计**: 完美适配手机、平板等移动设备
- **触摸优化**: 针对触摸操作优化的用户界面
- **性能优化**: 移动端电量和性能优化
- **兼容性**: 支持 Android 和 iOS 设备

## 🚀 在线体验

访问 [https://your-app-name.vercel.app](https://your-app-name.vercel.app) 立即体验

## 📱 使用说明

### 基本使用
1. 打开应用，选择本地音频文件
2. 点击播放按钮开始播放音乐
3. 在移动设备上启用振动功能
4. 享受音乐与振动的完美同步

### 振动功能
- **Android 设备**: 完全支持振动功能
- **iOS 设备**: 由于系统限制，不支持网页振动
- **桌面浏览器**: 不支持振动功能

### 最佳体验建议
- 使用 Android 手机获得最佳振动体验
- 建议使用 Chrome 或 Firefox 浏览器
- 确保设备音量适中，振动效果更佳
- 选择节拍明显的音乐获得更好的振动同步

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **音频处理**: Web Audio API
- **振动控制**: Vibration API
- **可视化**: Canvas API
- **部署**: Vercel

## 🏗️ 本地开发

### 环境要求
- 现代浏览器 (Chrome 66+, Firefox 60+, Safari 12+)
- 本地 HTTP 服务器

### 快速开始
```bash
# 克隆项目
git clone <repository-url>
cd audio-vibration-player

# 启动本地服务器
npx http-server -p 8080 -c-1

# 或使用 Python
python3 -m http.server 8080

# 访问 http://localhost:8080
```

### 项目结构
```
audio-vibration-player/
├── index.html              # 主页面
├── manifest.json           # PWA 配置
├── vercel.json             # Vercel 部署配置
├── styles/
│   └── main.css            # 主样式文件
├── js/
│   ├── app.js              # 主应用逻辑
│   ├── audio-player.js     # 音频播放器
│   ├── audio-analyzer.js   # 音频分析器
│   ├── vibration-controller.js # 振动控制器
│   ├── visualizer.js       # 可视化器
│   └── utils.js            # 工具函数
└── README.md
```

## 🔧 配置说明

### 振动参数配置
```javascript
const vibrationConfig = {
    minInterval: 50,        // 最小振动间隔（毫秒）
    maxDuration: 400,       // 最大振动持续时间（毫秒）
    intensityMultiplier: 2, // 强度倍数
    frequencyThreshold: 0.3 // 频率阈值
};
```

### 音频分析配置
```javascript
const audioConfig = {
    fftSize: 2048,              // FFT 大小
    smoothingTimeConstant: 0.8, // 平滑时间常数
    minDecibels: -90,           // 最小分贝
    maxDecibels: -10            // 最大分贝
};
```

## 🌟 特色功能

### 智能节拍检测
- 基于频谱通量算法的节拍检测
- 动态阈值调整
- BPM 自动估算

### 多层次振动模式
- **节拍振动**: 跟随音乐节拍
- **频率振动**: 响应不同频段变化
- **强度振动**: 根据音量变化调整
- **风格适配**: 针对不同音乐风格优化

### 实时同步优化
- 延迟补偿算法
- 自适应同步调整
- 预测性振动触发

## 📊 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| 音频播放 | ✅ | ✅ | ✅ | ✅ |
| 音频分析 | ✅ | ✅ | ✅ | ✅ |
| 振动功能 | ✅ (Android) | ✅ (Android) | ❌ | ✅ (Android) |
| 可视化 | ✅ | ✅ | ✅ | ✅ |

## 🚀 部署到 Vercel

### 自动部署
1. Fork 本项目到你的 GitHub
2. 在 Vercel 中导入项目
3. 自动部署完成

### 手动部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- Web Audio API 社区
- Vibration API 规范
- 所有贡献者和用户

---

**享受音乐，感受律动！** 🎵✨