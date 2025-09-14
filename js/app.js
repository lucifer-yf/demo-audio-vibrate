/**
 * 主应用程序入口
 * 负责初始化和协调各个模块
 */

class AudioVibrateApp {
    constructor() {
        this.audioPlayer = null;
        this.audioAnalyzer = null;
        this.vibrationController = null;
        this.visualizer = null;
        this.isInitialized = false;
        
        // DOM元素引用
        this.elements = {};
        
        // 应用状态
        this.state = {
            isPlaying: false,
            currentFile: null,
            vibrationEnabled: false,
            deviceCapabilities: null
        };
    }

    // 初始化应用
    async init() {
        try {
            console.log('Initializing Audio Vibrate App...');
            
            // 初始化工具函数
            initUtils();
            
            // 获取DOM元素引用
            this.initDOMElements();
            
            // 检测设备能力
            this.state.deviceCapabilities = detectDeviceCapabilities();
            
            // 显示设备支持信息
            this.displaySupportInfo();
            
            // 初始化各个模块
            await this.initModules();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 设置拖拽上传
            this.setupDragAndDrop();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
            
            // 移动端性能优化
            this.optimizeForMobile();
            
            showSuccess('应用初始化完成');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            showError('应用初始化失败，请刷新页面重试');
        }
    }

    // 获取DOM元素引用
    initDOMElements() {
        this.elements = {
            // 文件上传相关
            uploadArea: document.getElementById('uploadArea'),
            audioFile: document.getElementById('audioFile'),
            
            // 播放器相关
            playerSection: document.getElementById('playerSection'),
            trackName: document.getElementById('trackName'),
            trackDuration: document.getElementById('trackDuration'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            progressHandle: document.getElementById('progressHandle'),
            volumeSlider: document.getElementById('volumeSlider'),
            
            // 振动控制相关
            vibrationSection: document.getElementById('vibrationSection'),
            vibrationToggle: document.getElementById('vibrationToggle'),
            vibrationStatus: document.getElementById('vibrationStatus'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            beatInfo: document.getElementById('beatInfo'),
            intensityInfo: document.getElementById('intensityInfo'),
            
            // 可视化相关
            visualizationSection: document.getElementById('visualizationSection'),
            audioCanvas: document.getElementById('audioCanvas'),
            
            // 其他
            supportInfo: document.getElementById('supportInfo'),
            audioElement: document.getElementById('audioElement')
        };
    }

    // 初始化各个模块
    async initModules() {
        try {
            // 初始化音频播放器
            this.audioPlayer = new AudioPlayer(this.elements.audioElement);
            
            // 初始化振动控制器
            this.vibrationController = new VibrationController();
            
            // 初始化可视化器
            this.visualizer = new AudioVisualizer(this.elements.audioCanvas);
            
            console.log('All modules initialized');
            
        } catch (error) {
            console.error('Failed to initialize modules:', error);
            throw error;
        }
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 文件选择事件
        this.elements.audioFile.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // 播放/暂停按钮
        this.elements.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // 音量控制
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // 进度条控制
        this.elements.progressBar.addEventListener('click', (e) => {
            this.seekTo(e);
        });

        // 振动开关
        this.elements.vibrationToggle.addEventListener('change', (e) => {
            this.toggleVibration(e.target.checked);
        });

        // 音频播放器事件
        this.elements.audioElement.addEventListener('loadedmetadata', () => {
            this.onAudioLoaded();
        });

        this.elements.audioElement.addEventListener('timeupdate', () => {
            this.onTimeUpdate();
        });

        this.elements.audioElement.addEventListener('ended', () => {
            this.onAudioEnded();
        });

        this.elements.audioElement.addEventListener('error', (e) => {
            this.onAudioError(e);
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // 移动端特定事件
        this.setupMobileOptimizations();
    }

    // 设置拖拽上传
    setupDragAndDrop() {
        const uploadArea = this.elements.uploadArea;

        // 只在非触摸设备上启用拖拽
        if (!isMobileDevice()) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.add('dragover');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.remove('dragover');
                });
            });

            uploadArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });
        }

        // 移动端优化：添加触摸反馈
        if (isMobileDevice()) {
            uploadArea.addEventListener('touchstart', () => {
                uploadArea.style.transform = 'scale(0.98)';
            });

            uploadArea.addEventListener('touchend', () => {
                uploadArea.style.transform = 'scale(1)';
            });
        }
    }

    // 处理文件选择
    async handleFileSelect(file) {
        if (!file) return;

        try {
            // 验证文件
            const validation = validateAudioFile(file);
            if (!validation.valid) {
                showError(validation.error);
                return;
            }

            // 更新状态
            this.state.currentFile = file;
            
            // 显示文件信息
            this.elements.trackName.textContent = file.name;
            
            // 加载音频文件
            await this.loadAudioFile(file);
            
            showSuccess('音频文件加载成功');
            
        } catch (error) {
            console.error('Failed to handle file:', error);
            showError('文件加载失败，请重试');
        }
    }

    // 加载音频文件
    async loadAudioFile(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            
            this.elements.audioElement.src = url;
            this.elements.audioElement.load();
            
            this.elements.audioElement.onloadedmetadata = () => {
                resolve();
            };
            
            this.elements.audioElement.onerror = () => {
                reject(new Error('Failed to load audio file'));
            };
        });
    }

    // 音频加载完成事件
    async onAudioLoaded() {
        try {
            // 显示播放器界面
            this.elements.playerSection.style.display = 'block';
            this.elements.playerSection.classList.add('fade-in');
            
            // 显示振动控制界面
            if (this.state.deviceCapabilities.vibration) {
                this.elements.vibrationSection.style.display = 'block';
                this.elements.vibrationSection.classList.add('fade-in');
            }
            
            // 显示可视化界面
            this.elements.visualizationSection.style.display = 'block';
            this.elements.visualizationSection.classList.add('fade-in');
            
            // 更新时长显示
            const duration = this.elements.audioElement.duration;
            this.elements.trackDuration.textContent = `00:00 / ${formatTime(duration)}`;
            
            // 初始化音频分析器（延迟到用户交互时）
            if (this.state.deviceCapabilities.webAudio) {
                console.log('Web Audio API available, analyzer will be initialized on first play');
            }
            
        } catch (error) {
            console.error('Failed to setup audio:', error);
            showError('音频设置失败');
        }
    }

    // 时间更新事件
    onTimeUpdate() {
        const currentTime = this.elements.audioElement.currentTime;
        const duration = this.elements.audioElement.duration;
        
        if (duration > 0) {
            // 更新进度条
            const progress = (currentTime / duration) * 100;
            this.elements.progressFill.style.width = `${progress}%`;
            this.elements.progressHandle.style.left = `${progress}%`;
            
            // 更新时间显示
            this.elements.trackDuration.textContent = 
                `${formatTime(currentTime)} / ${formatTime(duration)}`;
            
            // 更新音频分析和振动
            this.updateAudioAnalysis();
        }
    }

    // 更新音频分析
    updateAudioAnalysis() {
        if (!this.audioAnalyzer || !this.state.isPlaying) return;
        
        try {
            // 获取音频分析数据
            const analysisData = this.audioAnalyzer.getAnalysisData();
            
            if (!analysisData) return;
            
            // 更新振动信息显示
            if (analysisData.beat && analysisData.beat.detected) {
                this.elements.beatInfo.textContent = `检测到节拍 (${analysisData.beat.bpm} BPM)`;
            } else {
                this.elements.beatInfo.textContent = '未检测到节拍';
            }
            
            // 更新音量显示
            const volumeLevel = analysisData.volume ? analysisData.volume.level || 0 : 0;
            this.elements.intensityInfo.textContent = `${Math.round(volumeLevel * 100)}%`;
            
            // 触发振动
            if (this.state.vibrationEnabled && this.vibrationController) {
                this.vibrationController.processAudioData(analysisData);
            }
            
            // 更新可视化
            if (this.visualizer) {
                this.visualizer.update(analysisData);
            }
            
        } catch (error) {
            console.error('Audio analysis error:', error);
        }
    }

    // 播放/暂停切换
    togglePlayPause() {
        if (!this.elements.audioElement.src) return;
        
        if (this.state.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    // 播放音频
    async play() {
        try {
            // 初始化音频分析器（如果还未初始化）
            if (this.state.deviceCapabilities.webAudio && !this.audioAnalyzer) {
                try {
                    this.audioAnalyzer = new AudioAnalyzer(this.elements.audioElement);
                    await this.audioAnalyzer.init();
                    
                    // 连接可视化器
                    this.visualizer.connect(this.audioAnalyzer);
                    
                    console.log('Audio analyzer initialized successfully');
                } catch (analyzerError) {
                    console.warn('Failed to initialize audio analyzer:', analyzerError);
                    // 继续播放，但没有分析功能
                }
            }
            
            // 恢复音频上下文（处理自动播放策略）
            if (this.audioAnalyzer) {
                await this.audioAnalyzer.resumeContext();
            }
            
            await this.elements.audioElement.play();
            this.state.isPlaying = true;
            this.elements.playPauseBtn.innerHTML = '<span class="play-icon">⏸️</span>';
            
            // 开始音频分析循环
            this.startAnalysisLoop();
            
            // 启动可视化
            if (this.visualizer) {
                this.visualizer.start();
            }
            
        } catch (error) {
            console.error('Failed to play audio:', error);
            
            // 处理不同类型的播放错误
            if (error.name === 'NotAllowedError') {
                showError('播放被阻止，请先与页面交互后再试');
            } else if (error.name === 'NotSupportedError') {
                showError('不支持的音频格式');
            } else {
                showError('播放失败，请检查音频文件');
            }
        }
    }

    // 暂停音频
    pause() {
        this.elements.audioElement.pause();
        this.state.isPlaying = false;
        this.elements.playPauseBtn.innerHTML = '<span class="play-icon">▶️</span>';
        
        // 停止音频分析循环
        this.stopAnalysisLoop();
        
        // 停止可视化
        if (this.visualizer) {
            this.visualizer.stop();
        }
    }

    // 设置音量
    setVolume(volume) {
        this.elements.audioElement.volume = Math.max(0, Math.min(1, volume));
    }

    // 跳转到指定位置
    seekTo(event) {
        const rect = this.elements.progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progress = clickX / rect.width;
        const duration = this.elements.audioElement.duration;
        
        if (duration > 0) {
            this.elements.audioElement.currentTime = progress * duration;
        }
    }

    // 切换振动功能
    toggleVibration(enabled) {
        this.state.vibrationEnabled = enabled;
        
        if (enabled) {
            this.elements.statusIndicator.textContent = '🟢';
            this.elements.statusText.textContent = '振动已启用';
        } else {
            this.elements.statusIndicator.textContent = '⚪';
            this.elements.statusText.textContent = '振动已关闭';
        }
    }

    // 开始音频分析循环
    startAnalysisLoop() {
        if (this.analysisLoopId) return;
        
        const loop = () => {
            if (this.state.isPlaying) {
                this.updateAudioAnalysis();
                this.analysisLoopId = requestAnimationFrame(loop);
            }
        };
        
        this.analysisLoopId = requestAnimationFrame(loop);
    }

    // 停止音频分析循环
    stopAnalysisLoop() {
        if (this.analysisLoopId) {
            cancelAnimationFrame(this.analysisLoopId);
            this.analysisLoopId = null;
        }
    }

    // 音频播放结束事件
    onAudioEnded() {
        this.state.isPlaying = false;
        this.elements.playPauseBtn.innerHTML = '<span class="play-icon">▶️</span>';
        this.stopAnalysisLoop();
        
        // 重置进度条
        this.elements.progressFill.style.width = '0%';
        this.elements.progressHandle.style.left = '0%';
    }

    // 音频错误事件
    onAudioError(event) {
        console.error('Audio error:', event);
        showError('音频播放出错，请检查文件格式');
        this.pause();
    }

    // 键盘快捷键处理
    handleKeyboard(event) {
        if (event.target.tagName === 'INPUT') return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.elements.audioElement.currentTime -= 10;
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.elements.audioElement.currentTime += 10;
                break;
        }
    }

    // 显示设备支持信息
    displaySupportInfo() {
        const capabilities = this.state.deviceCapabilities;
        const deviceInfo = getDeviceInfo();
        
        let supportText = `设备: ${deviceInfo.platform} ${deviceInfo.browser} | `;
        
        if (capabilities.webAudio) {
            supportText += '✅ 音频分析 ';
        } else {
            supportText += '❌ 音频分析 ';
        }
        
        if (capabilities.vibration) {
            supportText += '✅ 振动功能 ';
        } else {
            supportText += '❌ 振动功能 ';
        }
        
        if (capabilities.fileAPI) {
            supportText += '✅ 文件上传';
        } else {
            supportText += '❌ 文件上传';
        }
        
        this.elements.supportInfo.textContent = supportText;
    }

    // 移动端优化设置
    setupMobileOptimizations() {
        if (!isMobileDevice()) return;

        // 防止双击缩放
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // 处理屏幕方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // 处理页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // 移动端进度条触摸优化
        this.setupMobileProgressBar();

        // 移动端音量控制优化
        this.setupMobileVolumeControl();

        // 添加触摸反馈
        this.addTouchFeedback();
    }

    // 处理屏幕方向变化
    handleOrientationChange() {
        // 重新调整可视化画布大小
        if (this.visualizer) {
            this.visualizer.resize();
        }

        // 重新计算布局
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 200);
    }

    // 处理页面隐藏
    handlePageHidden() {
        // 暂停音频播放以节省电量
        if (this.state.isPlaying) {
            this.pause();
            this.wasPlayingBeforeHidden = true;
        }
    }

    // 处理页面显示
    handlePageVisible() {
        // 恢复音频播放
        if (this.wasPlayingBeforeHidden) {
            // 延迟恢复播放，给用户时间准备
            setTimeout(() => {
                if (this.wasPlayingBeforeHidden) {
                    this.play();
                    this.wasPlayingBeforeHidden = false;
                }
            }, 500);
        }
    }

    // 移动端进度条优化
    setupMobileProgressBar() {
        const progressBar = this.elements.progressBar;
        let isDragging = false;

        // 触摸开始
        progressBar.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
            this.handleProgressTouch(e);
        });

        // 触摸移动
        progressBar.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                this.handleProgressTouch(e);
            }
        });

        // 触摸结束
        progressBar.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    // 处理进度条触摸
    handleProgressTouch(event) {
        const rect = this.elements.progressBar.getBoundingClientRect();
        const touch = event.touches[0];
        const clickX = touch.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, clickX / rect.width));
        const duration = this.elements.audioElement.duration;
        
        if (duration > 0) {
            this.elements.audioElement.currentTime = progress * duration;
        }
    }

    // 移动端音量控制优化
    setupMobileVolumeControl() {
        const volumeSlider = this.elements.volumeSlider;
        
        // 增加触摸区域
        volumeSlider.style.padding = '10px 0';
        
        // 触摸反馈
        volumeSlider.addEventListener('touchstart', () => {
            volumeSlider.style.transform = 'scaleY(1.2)';
        });

        volumeSlider.addEventListener('touchend', () => {
            volumeSlider.style.transform = 'scaleY(1)';
        });
    }

    // 添加触摸反馈
    addTouchFeedback() {
        const touchElements = [
            this.elements.playPauseBtn,
            this.elements.vibrationToggle.parentElement,
            this.elements.uploadArea
        ];

        touchElements.forEach(element => {
            if (element) {
                element.addEventListener('touchstart', () => {
                    element.style.opacity = '0.7';
                });

                element.addEventListener('touchend', () => {
                    element.style.opacity = '1';
                });

                element.addEventListener('touchcancel', () => {
                    element.style.opacity = '1';
                });
            }
        });
    }

    // 移动端性能优化
    optimizeForMobile() {
        if (!isMobileDevice()) return;

        // 降低分析频率以节省电量
        if (this.audioAnalyzer) {
            this.audioAnalyzer.updateConfig({
                fftSize: 1024, // 降低FFT大小
                smoothingTimeConstant: 0.9 // 增加平滑度
            });
        }

        // 降低可视化帧率
        if (this.visualizer) {
            this.visualizer.updateConfig({
                targetFPS: 30 // 降低到30FPS
            });
        }

        // 优化振动参数
        if (this.vibrationController) {
            this.vibrationController.updateConfig({
                minInterval: 100, // 增加最小间隔
                maxDuration: 300  // 减少最大持续时间
            });
        }
    }
}

// 应用实例
let app;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    app = new AudioVibrateApp();
    await app.init();
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (app && app.audioAnalyzer) {
        app.audioAnalyzer.cleanup();
    }
});