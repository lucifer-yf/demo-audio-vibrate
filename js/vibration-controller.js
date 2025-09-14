/**
 * 振动控制器类
 * 负责设备振动功能的控制和管理
 */

class VibrationController {
    constructor() {
        this.isSupported = 'vibrate' in navigator;
        this.isEnabled = false;
        this.lastVibrationTime = 0;
        this.vibrationQueue = [];
        this.isVibrating = false;
        
        // 振动参数配置 - 进一步增强振动强度
        this.config = {
            minInterval: 20,        // 最小振动间隔（毫秒）- 进一步减少间隔
            maxDuration: 800,       // 最大振动持续时间（毫秒）- 进一步增加
            beatVibrationDuration: 200,  // 节拍振动持续时间 - 进一步增加
            intensityMultiplier: 4,      // 强度倍数 - 进一步增加
            frequencyThreshold: 0.15,    // 频率阈值 - 更敏感
            syncDelay: 0,           // 同步延迟补偿（毫秒）
            adaptiveSync: true,     // 自适应同步
            latencyCompensation: 20 // 延迟补偿（毫秒）
        };
        
        // 同步状态
        this.syncState = {
            lastSyncTime: 0,
            avgLatency: 0,
            latencyHistory: [],
            syncAccuracy: 0
        };
        
        // 振动模式 - 进一步增强所有振动强度
        this.patterns = {
            beat: [200, 50],           // 节拍振动：振动200ms，停止50ms
            strongBeat: [350, 50],     // 强节拍振动 - 进一步增强
            bass: [400, 80],           // 低频振动 - 进一步增强低频感受
            continuous: [100, 30],     // 连续振动 - 增强持续感
            pulse: [150, 80, 150, 120]  // 脉冲振动 - 增强脉冲感
        };
        
        console.log('VibrationController initialized, supported:', this.isSupported);
    }

    // 检查振动支持
    checkSupport() {
        return {
            supported: this.isSupported,
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }

    // 启用振动功能
    enable() {
        if (!this.isSupported) {
            console.warn('Vibration API not supported');
            return false;
        }
        
        this.isEnabled = true;
        console.log('Vibration enabled');
        return true;
    }

    // 禁用振动功能
    disable() {
        this.isEnabled = false;
        this.stopVibration();
        console.log('Vibration disabled');
    }

    // 基础振动方法（带同步优化）
    vibrate(pattern) {
        if (!this.isSupported || !this.isEnabled) {
            return false;
        }

        try {
            // 检查振动间隔
            const now = Date.now();
            if (now - this.lastVibrationTime < this.config.minInterval) {
                return false;
            }

            // 应用延迟补偿
            const compensatedPattern = this.applyLatencyCompensation(pattern);
            
            // 记录振动开始时间（用于同步分析）
            const vibrationStartTime = performance.now();

            // 执行振动
            const result = navigator.vibrate(compensatedPattern);
            if (result) {
                this.lastVibrationTime = now;
                this.isVibrating = true;
                
                // 计算振动总时长
                const totalDuration = Array.isArray(compensatedPattern) 
                    ? compensatedPattern.reduce((sum, val, index) => index % 2 === 0 ? sum + val : sum, 0)
                    : compensatedPattern;
                
                // 更新同步统计
                this.updateSyncStats(vibrationStartTime);
                
                // 设置振动结束标记
                setTimeout(() => {
                    this.isVibrating = false;
                }, totalDuration);
            }
            
            return result;
        } catch (error) {
            console.error('Vibration error:', error);
            return false;
        }
    }

    // 应用延迟补偿
    applyLatencyCompensation(pattern) {
        if (!this.config.adaptiveSync || this.config.latencyCompensation === 0) {
            return pattern;
        }

        // 对于数组模式，调整第一个振动的持续时间
        if (Array.isArray(pattern)) {
            const compensated = [...pattern];
            if (compensated.length > 0) {
                // 减少延迟补偿时间（但不能为负）
                compensated[0] = Math.max(10, compensated[0] - this.config.latencyCompensation);
            }
            return compensated;
        }

        // 对于单一数值，直接调整
        return Math.max(10, pattern - this.config.latencyCompensation);
    }

    // 更新同步统计
    updateSyncStats(vibrationStartTime) {
        const now = performance.now();
        const latency = now - vibrationStartTime;
        
        // 记录延迟历史
        this.syncState.latencyHistory.push(latency);
        if (this.syncState.latencyHistory.length > 20) {
            this.syncState.latencyHistory.shift();
        }
        
        // 计算平均延迟
        this.syncState.avgLatency = this.syncState.latencyHistory.reduce((sum, val) => sum + val, 0) / this.syncState.latencyHistory.length;
        
        // 自适应调整延迟补偿
        if (this.config.adaptiveSync && this.syncState.latencyHistory.length >= 10) {
            this.config.latencyCompensation = Math.min(50, Math.max(0, this.syncState.avgLatency));
        }
    }

    // 预测性振动（提前触发以补偿延迟）
    predictiveVibrate(pattern, audioTimestamp) {
        const now = performance.now();
        const predictedDelay = this.syncState.avgLatency || 20;
        
        // 如果音频事件时间戳比当前时间早，说明需要立即振动
        if (audioTimestamp <= now) {
            return this.vibrate(pattern);
        }
        
        // 否则延迟执行
        const delay = Math.max(0, audioTimestamp - now - predictedDelay);
        setTimeout(() => {
            this.vibrate(pattern);
        }, delay);
        
        return true;
    }

    // 停止振动
    stopVibration() {
        if (this.isSupported) {
            navigator.vibrate(0);
            this.isVibrating = false;
        }
    }

    // 处理音频数据并触发相应振动
    processAudioData(audioData) {
        if (!this.isEnabled || !audioData) {
            return;
        }

        try {
            // 实时同步处理
            this.syncVibrationWithAudio(audioData);

        } catch (error) {
            console.error('Error processing audio data for vibration:', error);
        }
    }

    // 音频振动实时同步核心方法
    syncVibrationWithAudio(audioData) {
        const now = Date.now();
        
        // 优先级处理：节拍 > 频率突变 > 音量变化
        
        // 1. 节拍检测振动（最高优先级）
        if (audioData.beat && audioData.beat.detected) {
            this.handleBeatVibration(audioData.beat);
            this.lastSyncTime = now;
            return;
        }

        // 2. 频率突变检测（中等优先级）
        if (this.detectFrequencyChange(audioData.frequency)) {
            this.handleFrequencyVibration(audioData.frequency);
            this.lastSyncTime = now;
            return;
        }

        // 3. 音量变化检测（低优先级）
        if (this.detectVolumeChange(audioData.volume)) {
            this.handleVolumeVibration(audioData.volume.level);
            this.lastSyncTime = now;
        }
    }

    // 检测频率变化
    detectFrequencyChange(frequencyData) {
        if (!frequencyData || !this.lastFrequencyData) {
            this.lastFrequencyData = frequencyData;
            return false;
        }

        const now = Date.now();
        if (now - this.lastVibrationTime < 150) {
            return false; // 避免过于频繁的振动
        }

        // 检测低频突变
        const bassChange = Math.abs(frequencyData.bass - this.lastFrequencyData.bass);
        const trebleChange = Math.abs(frequencyData.treble - this.lastFrequencyData.treble);
        
        this.lastFrequencyData = frequencyData;

        // 低频突变阈值
        if (bassChange > 0.3 && frequencyData.bass > 0.5) {
            return true;
        }

        // 高频突变阈值
        if (trebleChange > 0.4 && frequencyData.treble > 0.6) {
            return true;
        }

        return false;
    }

    // 检测音量变化
    detectVolumeChange(volumeData) {
        if (!volumeData || !this.lastVolumeData) {
            this.lastVolumeData = volumeData;
            return false;
        }

        const now = Date.now();
        if (now - this.lastVibrationTime < 200) {
            return false; // 音量变化振动间隔更长
        }

        const volumeChange = Math.abs(volumeData.level - this.lastVolumeData.level);
        this.lastVolumeData = volumeData;

        // 音量突然增大
        return volumeChange > 0.3 && volumeData.level > 0.7;
    }

    // 处理节拍振动
    handleBeatVibration(beatData) {
        if (!beatData.detected) return;

        const intensity = beatData.strength || 0.5;
        const beatType = beatData.type || 'energy';
        
        // 根据节拍类型和强度选择振动模式
        let pattern;
        
        if (beatType === 'kick') {
            // 踢鼓节拍：更强烈的振动
            pattern = intensity > 0.8 ? [300, 50] : [200, 50];
        } else if (intensity > 0.8) {
            // 强节拍
            pattern = this.patterns.strongBeat;
        } else if (intensity > 0.5) {
            // 中等节拍
            pattern = this.patterns.beat;
        } else {
            // 轻微节拍
            pattern = [120, 30];  // 增强轻微节拍
        }

        // 根据BPM调整振动间隔
        if (beatData.bpm && beatData.bpm > 0) {
            const beatInterval = 60000 / beatData.bpm;
            if (beatInterval < 400) { // 快节奏音乐
                pattern = [Math.min(pattern[0], 80), pattern[1]]; // 缩短振动时间
            }
        }

        this.vibrate(pattern);
    }

    // 处理频率振动
    handleFrequencyVibration(frequencyData) {
        // 检测低频（贝斯）
        if (frequencyData.bass > this.config.frequencyThreshold) {
            const intensity = Math.min(frequencyData.bass * this.config.intensityMultiplier, 1);
            const duration = Math.floor(intensity * this.config.maxDuration);
            
            if (duration > 50) {
                this.vibrate([duration, 100]);
            }
        }
    }

    // 处理音量振动
    handleVolumeVibration(volume) {
        // 只在音量突然增大时触发
        if (volume > 0.8 && !this.isVibrating) {
            const duration = Math.floor(volume * 150);
            this.vibrate([duration, 50]);
        }
    }

    // 预定义振动模式

    // 节拍振动
    beatVibration(strength = 0.5) {
        const duration = Math.floor(strength * this.config.beatVibrationDuration);
        return this.vibrate([duration, 50]);
    }

    // 强节拍振动
    strongBeatVibration() {
        return this.vibrate(this.patterns.strongBeat);
    }

    // 低频振动
    bassVibration(intensity = 0.5) {
        const duration = Math.floor(intensity * 200);
        return this.vibrate([duration, 100]);
    }

    // 连续振动
    continuousVibration(duration = 1000) {
        const pattern = [];
        const pulseLength = 50;
        const pauseLength = 50;
        const cycles = Math.floor(duration / (pulseLength + pauseLength));
        
        for (let i = 0; i < cycles; i++) {
            pattern.push(pulseLength, pauseLength);
        }
        
        return this.vibrate(pattern);
    }

    // 脉冲振动
    pulseVibration() {
        return this.vibrate(this.patterns.pulse);
    }

    // 自定义振动模式
    customVibration(pattern) {
        if (!Array.isArray(pattern)) {
            pattern = [pattern];
        }
        
        // 限制最大振动时长
        const limitedPattern = pattern.map(duration => 
            Math.min(duration, this.config.maxDuration)
        );
        
        return this.vibrate(limitedPattern);
    }

    // 根据音乐特征生成振动模式
    generateMusicVibration(musicFeatures) {
        const { tempo, energy, valence, danceability } = musicFeatures;
        
        // 基于音乐特征计算振动参数
        const baseIntensity = energy * 0.8 + danceability * 0.2;
        const rhythmFactor = Math.min(tempo / 120, 2); // 标准化到120 BPM
        
        // 生成动态振动模式
        const vibrationDuration = Math.floor(baseIntensity * 150);
        const pauseDuration = Math.floor(60000 / tempo / 4); // 四分音符间隔
        
        return [vibrationDuration, pauseDuration];
    }

    // 测试振动功能
    testVibration() {
        if (!this.isSupported) {
            return {
                success: false,
                message: '设备不支持振动功能'
            };
        }

        try {
            // 执行测试振动
            const result = this.vibrate([200, 100, 200]);
            
            return {
                success: result,
                message: result ? '振动测试成功' : '振动测试失败'
            };
        } catch (error) {
            return {
                success: false,
                message: '振动测试出错：' + error.message
            };
        }
    }

    // 获取振动状态
    getStatus() {
        return {
            supported: this.isSupported,
            enabled: this.isEnabled,
            isVibrating: this.isVibrating,
            lastVibrationTime: this.lastVibrationTime,
            config: this.config
        };
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('Vibration config updated:', this.config);
    }

    // 获取设备振动能力信息
    getDeviceInfo() {
        const userAgent = navigator.userAgent;
        const isAndroid = /Android/i.test(userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
        const isChrome = /Chrome/i.test(userAgent);
        const isFirefox = /Firefox/i.test(userAgent);
        
        return {
            platform: isAndroid ? 'Android' : isIOS ? 'iOS' : 'Other',
            browser: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : 'Other',
            vibrationSupported: this.isSupported,
            expectedSupport: isAndroid && (isChrome || isFirefox),
            userAgent: userAgent
        };
    }

    // 清理资源
    cleanup() {
        this.disable();
        this.vibrationQueue = [];
        console.log('VibrationController cleaned up');
    }
}