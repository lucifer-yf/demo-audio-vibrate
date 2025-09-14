/**
 * 音频可视化器类
 * 负责音频数据的可视化显示
 */

class AudioVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioAnalyzer = null;
        this.animationId = null;
        this.isRunning = false;

        // 可视化配置
        this.config = {
            fftSize: 256,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
            backgroundColor: '#f5f5f5',
            barColor: '#2196F3',
            beatColor: '#FF5722',
            gradientColors: ['#2196F3', '#21CBF3', '#00BCD4']
        };

        // 可视化状态
        this.state = {
            beatDetected: false,
            lastBeatTime: 0,
            averageVolume: 0,
            peakFrequency: 0
        };

        // 延迟初始化canvas，确保DOM完全渲染
        setTimeout(() => {
            this.setupCanvas();
        }, 100);

        console.log('AudioVisualizer initialized');
    }

    // 设置画布
    setupCanvas() {
        // 设置画布分辨率
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // 如果getBoundingClientRect返回0，使用默认尺寸
        let width = rect.width;
        let height = rect.height;

        if (width === 0 || height === 0) {
            // 强制设置默认尺寸
            width = 400;
            height = 150; // 默认高度
            console.log('Canvas rect is 0, using default size:', width, 'x', height);
        }

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx.scale(dpr, dpr);

        // 设置画布样式
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        console.log('Canvas setup:', {
            cssWidth: width,
            cssHeight: height,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            dpr: dpr
        });

        // 初始化背景
        this.clearCanvas();
    }

    // 连接音频分析器
    connect(audioAnalyzer) {
        this.audioAnalyzer = audioAnalyzer;
        console.log('Visualizer connected to audio analyzer');
    }

    // 开始可视化
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.animate();
        console.log('Visualizer started');
    }

    // 停止可视化
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('Visualizer stopped');
    }

    // 更新可视化数据
    update(analysisData) {
        if (!analysisData) return;

        // 更新状态
        this.state.beatDetected = analysisData.beat?.detected || false;
        this.state.averageVolume = analysisData.volume || 0;
        this.state.peakFrequency = analysisData.frequency?.peak || 0;

        if (this.state.beatDetected) {
            this.state.lastBeatTime = Date.now();
        }
    }

    // 动画循环
    animate() {
        if (!this.isRunning) return;

        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 绘制可视化
    draw() {
        if (!this.audioAnalyzer) {
            this.drawPlaceholder();
            return;
        }

        try {
            // 获取频谱数据
            const frequencyData = this.audioAnalyzer.getFrequencyData();
            const timeData = this.audioAnalyzer.getTimeData();

            if (!frequencyData || !timeData) {
                this.drawPlaceholder();
                return;
            }

            // 清空画布
            this.clearCanvas();

            // 绘制频谱条
            this.drawFrequencyBars(frequencyData);

            // 绘制波形
            this.drawWaveform(timeData);

            // 绘制节拍指示器
            // if (this.state.beatDetected) {
            //     this.drawBeatIndicator();
            // }

            // 绘制音量指示器
            this.drawVolumeIndicator();

        } catch (error) {
            console.error('Visualization draw error:', error);
            this.drawError();
        }
    }

    // 绘制频谱条
    drawFrequencyBars(frequencyData) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        const barCount = Math.min(frequencyData.length / 2, 32); // 限制条数
        const barWidth = width / barCount;

        // 创建渐变
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, this.config.gradientColors[0]);
        gradient.addColorStop(0.5, this.config.gradientColors[1]);
        gradient.addColorStop(1, this.config.gradientColors[2]);

        ctx.fillStyle = gradient;

        for (let i = 0; i < barCount; i++) {
            const value = frequencyData[i] / 255;
            const barHeight = value * height * 0.8;

            const x = i * barWidth;
            const y = height - barHeight;

            // 绘制频谱条
            ctx.fillRect(x, y, barWidth - 2, barHeight);

            // 节拍时高亮显示
            if (this.state.beatDetected && Date.now() - this.state.lastBeatTime < 200) {
                ctx.fillStyle = this.config.beatColor;
                ctx.fillRect(x, y - 5, barWidth - 2, 5);
                ctx.fillStyle = gradient;
            }
        }
    }

    // 绘制波形
    drawWaveform(timeData) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.strokeStyle = this.config.barColor;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
            const value = timeData[i] / 128.0;
            const y = value * height / 4 + height / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.stroke();
    }

    // 绘制节拍指示器
    drawBeatIndicator() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        // 计算节拍动画进度
        const timeSinceBeat = Date.now() - this.state.lastBeatTime;
        const animationProgress = Math.max(0, 1 - timeSinceBeat / 300);

        if (animationProgress > 0) {
            const radius = 20 + animationProgress * 10;
            const alpha = animationProgress * 0.8;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.config.beatColor;
            ctx.beginPath();
            ctx.arc(width - 30, 30, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 绘制节拍文字
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('♪', width - 30, 35);
            ctx.restore();
        }
    }

    // 绘制音量指示器
    drawVolumeIndicator() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        // 音量条
        const volumeBarWidth = 4;
        const volumeBarHeight = height * 0.6;
        const volumeLevel = this.state.averageVolume * volumeBarHeight;

        // 背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(width - 15, height * 0.2, volumeBarWidth, volumeBarHeight);

        // 音量级别
        ctx.fillStyle = this.config.barColor;
        ctx.fillRect(width - 15, height * 0.8 - volumeLevel, volumeBarWidth, volumeLevel);
    }

    // 绘制占位符
    drawPlaceholder() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        this.clearCanvas();

        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('等待音频播放...', width / 2, height / 2);
    }

    // 绘制错误信息
    drawError() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        this.clearCanvas();

        ctx.fillStyle = '#f44336';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('可视化错误', width / 2, height / 2);
    }

    // 清空画布
    clearCanvas() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }

    // 调整画布大小
    resize() {
        this.setupCanvas();
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Visualizer config updated');
    }

    // 获取状态
    getState() {
        return {
            isRunning: this.isRunning,
            connected: !!this.audioAnalyzer,
            state: this.state,
            config: this.config
        };
    }

    // 清理资源
    cleanup() {
        this.stop();
        this.audioAnalyzer = null;
        console.log('AudioVisualizer cleaned up');
    }
}