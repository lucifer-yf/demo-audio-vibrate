/**
 * 音频分析器类
 * 负责音频的实时分析，包括频谱分析和节拍检测
 */

class AudioAnalyzer {
    constructor(audioElement) {
        this.audioElement = audioElement;
        this.audioContext = null;
        this.analyserNode = null;
        this.sourceNode = null;
        this.isInitialized = false;
        
        // 分析配置
        this.config = {
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            minDecibels: -90,
            maxDecibels: -10,
            sampleRate: 44100
        };
        
        // 分析数据缓冲区
        this.buffers = {
            frequencyData: null,
            timeData: null,
            previousFrequencyData: null
        };
        
        // 节拍检测状态
        this.beatDetection = {
            threshold: 1.3,
            minInterval: 300, // 最小节拍间隔（毫秒）
            lastBeatTime: 0,
            energyHistory: [],
            historySize: 43, // 约1秒的历史数据
            variance: 0,
            average: 0
        };
        
        // 频率分析状态
        this.frequencyAnalysis = {
            bassRange: [20, 250],      // 低频范围
            midRange: [250, 4000],     // 中频范围
            trebleRange: [4000, 20000], // 高频范围
            bassLevel: 0,
            midLevel: 0,
            trebleLevel: 0
        };
        
        console.log('AudioAnalyzer created');
    }

    // 初始化音频分析器
    async init() {
        try {
            // 创建音频上下文
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                throw new Error('Web Audio API not supported');
            }
            
            this.audioContext = new AudioContext();
            
            // 创建分析节点
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = this.config.fftSize;
            this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant;
            this.analyserNode.minDecibels = this.config.minDecibels;
            this.analyserNode.maxDecibels = this.config.maxDecibels;
            
            // 创建音频源节点
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            
            // 连接音频节点
            this.sourceNode.connect(this.analyserNode);
            this.analyserNode.connect(this.audioContext.destination);
            
            // 初始化数据缓冲区
            this.initBuffers();
            
            this.isInitialized = true;
            console.log('AudioAnalyzer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize AudioAnalyzer:', error);
            throw error;
        }
    }

    // 初始化数据缓冲区
    initBuffers() {
        const bufferLength = this.analyserNode.frequencyBinCount;
        this.buffers.frequencyData = new Uint8Array(bufferLength);
        this.buffers.timeData = new Uint8Array(bufferLength);
        this.buffers.previousFrequencyData = new Uint8Array(bufferLength);
    }

    // 获取实时分析数据
    getAnalysisData() {
        if (!this.isInitialized || !this.analyserNode) {
            return null;
        }

        try {
            // 获取频谱和时域数据
            this.analyserNode.getByteFrequencyData(this.buffers.frequencyData);
            this.analyserNode.getByteTimeDomainData(this.buffers.timeData);
            
            // 分析音频特征
            const volume = this.calculateVolume();
            const frequency = this.analyzeFrequency();
            const beat = this.detectBeat();
            
        // 更新历史数据
        this.updateHistory();
        
        // 添加频谱通量分析
        const spectralFlux = this.calculateSpectralFlux();
            
            return {
                volume,
                frequency,
                beat,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Error getting analysis data:', error);
            return null;
        }
    }

    // 计算音量
    calculateVolume() {
        const data = this.buffers.timeData;
        let sum = 0;
        let max = 0;
        
        for (let i = 0; i < data.length; i++) {
            const value = Math.abs(data[i] - 128) / 128;
            sum += value;
            max = Math.max(max, value);
        }
        
        const average = sum / data.length;
        const rms = Math.sqrt(sum / data.length);
        
        return {
            average,
            max,
            rms,
            level: Math.min(rms * 2, 1) // 标准化到0-1
        };
    }

    // 分析频率
    analyzeFrequency() {
        const data = this.buffers.frequencyData;
        const sampleRate = this.audioContext.sampleRate;
        const binCount = data.length;
        const binSize = sampleRate / (2 * binCount);
        
        let bassSum = 0, bassCount = 0;
        let midSum = 0, midCount = 0;
        let trebleSum = 0, trebleCount = 0;
        let peakFrequency = 0;
        let peakValue = 0;
        let totalEnergy = 0;
        
        // 重点分析音乐频率范围 (20Hz - 5000Hz)
        const maxFreq = Math.min(5000, sampleRate / 2);
        const maxBin = Math.floor(maxFreq * binCount / (sampleRate / 2));
        
        for (let i = 1; i < maxBin; i++) { // 跳过DC分量
            const frequency = i * binSize;
            const value = data[i] / 255;
            
            totalEnergy += value * value;
            
            // 分频段统计
            if (frequency >= this.frequencyAnalysis.bassRange[0] && 
                frequency <= this.frequencyAnalysis.bassRange[1]) {
                bassSum += value;
                bassCount++;
            } else if (frequency >= this.frequencyAnalysis.midRange[0] && 
                       frequency <= this.frequencyAnalysis.midRange[1]) {
                midSum += value;
                midCount++;
            } else if (frequency >= this.frequencyAnalysis.trebleRange[0] && 
                       frequency <= this.frequencyAnalysis.trebleRange[1]) {
                trebleSum += value;
                trebleCount++;
            }
            
            // 寻找峰值频率
            if (value > peakValue) {
                peakValue = value;
                peakFrequency = frequency;
            }
        }
        
        // 计算各频段平均值
        this.frequencyAnalysis.bassLevel = bassCount > 0 ? bassSum / bassCount : 0;
        this.frequencyAnalysis.midLevel = midCount > 0 ? midSum / midCount : 0;
        this.frequencyAnalysis.trebleLevel = trebleCount > 0 ? trebleSum / trebleCount : 0;
        
        // 计算频谱重心（音色特征）
        let spectralCentroid = 0;
        let weightSum = 0;
        for (let i = 1; i < maxBin; i++) {
            const frequency = i * binSize;
            const magnitude = data[i] / 255;
            spectralCentroid += frequency * magnitude;
            weightSum += magnitude;
        }
        spectralCentroid = weightSum > 0 ? spectralCentroid / weightSum : 0;
        
        return {
            bass: this.frequencyAnalysis.bassLevel,
            mid: this.frequencyAnalysis.midLevel,
            treble: this.frequencyAnalysis.trebleLevel,
            peak: peakFrequency,
            peakValue: peakValue,
            totalEnergy: totalEnergy / maxBin,
            spectralCentroid: spectralCentroid,
            brightness: this.frequencyAnalysis.trebleLevel / (this.frequencyAnalysis.bassLevel + 0.001) // 避免除零
        };
    }

    // 节拍检测
    detectBeat() {
        const currentTime = Date.now();
        
        // 检查最小间隔
        if (currentTime - this.beatDetection.lastBeatTime < this.beatDetection.minInterval) {
            return {
                detected: false,
                strength: 0,
                bpm: 0,
                confidence: 0
            };
        }
        
        // 计算当前能量
        const energyData = this.calculateEnergy();
        const currentEnergy = energyData.total;
        const kickEnergy = energyData.kick;
        
        // 更新能量历史
        this.beatDetection.energyHistory.push(currentEnergy);
        if (this.beatDetection.energyHistory.length > this.beatDetection.historySize) {
            this.beatDetection.energyHistory.shift();
        }
        
        // 计算平均值和方差
        if (this.beatDetection.energyHistory.length >= this.beatDetection.historySize) {
            const sum = this.beatDetection.energyHistory.reduce((a, b) => a + b, 0);
            this.beatDetection.average = sum / this.beatDetection.energyHistory.length;
            
            const variance = this.beatDetection.energyHistory.reduce((sum, value) => {
                return sum + Math.pow(value - this.beatDetection.average, 2);
            }, 0) / this.beatDetection.energyHistory.length;
            
            this.beatDetection.variance = variance;
        }
        
        // 改进的节拍检测算法
        const threshold = this.beatDetection.average * this.beatDetection.threshold;
        const kickThreshold = this.beatDetection.average * 0.8; // 踢鼓阈值稍低
        
        // 综合考虑总能量和踢鼓能量
        const energyBeat = currentEnergy > threshold && this.beatDetection.variance > 0.01;
        const kickBeat = kickEnergy > kickThreshold;
        const beatDetected = energyBeat || kickBeat;
        
        if (beatDetected) {
            this.beatDetection.lastBeatTime = currentTime;
            
            // 计算BPM
            const bpm = this.estimateBPM();
            
            // 计算节拍强度
            const energyStrength = energyBeat ? (currentEnergy - threshold) / threshold : 0;
            const kickStrength = kickBeat ? (kickEnergy - kickThreshold) / kickThreshold : 0;
            const strength = Math.min(Math.max(energyStrength, kickStrength), 1);
            
            return {
                detected: true,
                strength: strength,
                bpm: bpm,
                confidence: Math.min(this.beatDetection.variance * 10, 1),
                energy: currentEnergy,
                kickEnergy: kickEnergy,
                type: kickBeat ? 'kick' : 'energy'
            };
        }
        
        return {
            detected: false,
            strength: 0,
            bpm: 0,
            confidence: 0,
            energy: currentEnergy,
            kickEnergy: kickEnergy
        };
    }

    // 计算音频能量
    calculateEnergy() {
        const data = this.buffers.frequencyData;
        let totalEnergy = 0;
        let bassEnergy = 0;
        let kickEnergy = 0;
        
        const sampleRate = this.audioContext.sampleRate;
        const binCount = data.length;
        
        // 重点关注低频和中频范围（节拍通常在这些频段）
        const startBin = Math.floor(20 * binCount / (sampleRate / 2));
        const endBin = Math.floor(4000 * binCount / (sampleRate / 2));
        
        // 特别关注踢鼓频段 (60-120Hz)
        const kickStartBin = Math.floor(60 * binCount / (sampleRate / 2));
        const kickEndBin = Math.floor(120 * binCount / (sampleRate / 2));
        
        // 低频段 (20-250Hz)
        const bassStartBin = Math.floor(20 * binCount / (sampleRate / 2));
        const bassEndBin = Math.floor(250 * binCount / (sampleRate / 2));
        
        for (let i = startBin; i < endBin && i < data.length; i++) {
            const value = data[i] / 255;
            const energyValue = value * value;
            totalEnergy += energyValue;
            
            // 踢鼓能量
            if (i >= kickStartBin && i <= kickEndBin) {
                kickEnergy += energyValue;
            }
            
            // 低频能量
            if (i >= bassStartBin && i <= bassEndBin) {
                bassEnergy += energyValue;
            }
        }
        
        return {
            total: totalEnergy / (endBin - startBin),
            bass: bassEnergy / (bassEndBin - bassStartBin),
            kick: kickEnergy / (kickEndBin - kickStartBin)
        };
    }

    // 估算BPM
    estimateBPM() {
        // 基于节拍间隔历史计算BPM
        if (!this.beatIntervals) {
            this.beatIntervals = [];
        }
        
        const currentTime = Date.now();
        
        // 记录节拍间隔
        if (this.lastBeatTimestamp) {
            const interval = currentTime - this.lastBeatTimestamp;
            if (interval >= this.beatDetection.minInterval && interval <= 2000) { // 合理的节拍间隔范围
                this.beatIntervals.push(interval);
                
                // 保持最近20个间隔
                if (this.beatIntervals.length > 20) {
                    this.beatIntervals.shift();
                }
            }
        }
        
        this.lastBeatTimestamp = currentTime;
        
        // 计算BPM
        if (this.beatIntervals.length >= 4) {
            // 使用中位数来减少异常值影响
            const sortedIntervals = [...this.beatIntervals].sort((a, b) => a - b);
            const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
            
            // 也计算平均值作为参考
            const avgInterval = this.beatIntervals.reduce((sum, interval) => sum + interval, 0) / this.beatIntervals.length;
            
            // 使用中位数和平均值的加权平均
            const finalInterval = medianInterval * 0.7 + avgInterval * 0.3;
            
            const bpm = Math.round(60000 / finalInterval);
            
            // 确保BPM在合理范围内
            return Math.max(60, Math.min(200, bpm));
        }
        
        return 0;
    }

    // 更新历史数据
    updateHistory() {
        // 保存当前频谱数据作为历史数据
        this.buffers.previousFrequencyData.set(this.buffers.frequencyData);
    }

    // 计算频谱通量（用于更精确的节拍检测）
    calculateSpectralFlux() {
        if (!this.buffers.previousFrequencyData) {
            return 0;
        }
        
        let flux = 0;
        const current = this.buffers.frequencyData;
        const previous = this.buffers.previousFrequencyData;
        
        // 重点关注低频和中频范围
        const startBin = Math.floor(20 * current.length / (this.audioContext.sampleRate / 2));
        const endBin = Math.floor(4000 * current.length / (this.audioContext.sampleRate / 2));
        
        for (let i = startBin; i < endBin && i < current.length; i++) {
            const currentMagnitude = current[i] / 255;
            const previousMagnitude = previous[i] / 255;
            
            // 只考虑增加的能量（正向通量）
            const diff = currentMagnitude - previousMagnitude;
            if (diff > 0) {
                flux += diff;
            }
        }
        
        return flux / (endBin - startBin);
    }

    // 基于频谱通量的节拍检测
    detectBeatWithSpectralFlux() {
        const flux = this.calculateSpectralFlux();
        
        // 维护频谱通量历史
        if (!this.spectralFluxHistory) {
            this.spectralFluxHistory = [];
        }
        
        this.spectralFluxHistory.push(flux);
        if (this.spectralFluxHistory.length > 43) { // 约1秒的历史
            this.spectralFluxHistory.shift();
        }
        
        if (this.spectralFluxHistory.length < 10) {
            return false;
        }
        
        // 计算动态阈值
        const recentFlux = this.spectralFluxHistory.slice(-10);
        const avgFlux = recentFlux.reduce((sum, val) => sum + val, 0) / recentFlux.length;
        const threshold = avgFlux * 1.5;
        
        // 检测峰值
        const currentTime = Date.now();
        if (flux > threshold && 
            currentTime - this.beatDetection.lastBeatTime > this.beatDetection.minInterval) {
            
            this.beatDetection.lastBeatTime = currentTime;
            return {
                detected: true,
                strength: Math.min(flux / threshold, 2),
                flux: flux,
                threshold: threshold
            };
        }
        
        return {
            detected: false,
            strength: 0,
            flux: flux,
            threshold: threshold
        };
    }

    // 获取频谱数据
    getFrequencyData() {
        if (!this.isInitialized) return null;
        
        this.analyserNode.getByteFrequencyData(this.buffers.frequencyData);
        return this.buffers.frequencyData;
    }

    // 获取时域数据
    getTimeData() {
        if (!this.isInitialized) return null;
        
        this.analyserNode.getByteTimeDomainData(this.buffers.timeData);
        return this.buffers.timeData;
    }

    // 获取分析器状态
    getState() {
        return {
            initialized: this.isInitialized,
            contextState: this.audioContext ? this.audioContext.state : 'closed',
            sampleRate: this.audioContext ? this.audioContext.sampleRate : 0,
            fftSize: this.config.fftSize,
            bufferLength: this.analyserNode ? this.analyserNode.frequencyBinCount : 0,
            beatDetection: this.beatDetection,
            frequencyAnalysis: this.frequencyAnalysis
        };
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.analyserNode) {
            this.analyserNode.fftSize = this.config.fftSize;
            this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant;
            this.analyserNode.minDecibels = this.config.minDecibels;
            this.analyserNode.maxDecibels = this.config.maxDecibels;
            
            // 重新初始化缓冲区
            this.initBuffers();
        }
        
        console.log('AudioAnalyzer config updated');
    }

    // 恢复音频上下文（处理自动播放策略）
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            } catch (error) {
                console.error('Failed to resume audio context:', error);
            }
        }
    }

    // 清理资源
    cleanup() {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        if (this.analyserNode) {
            this.analyserNode.disconnect();
            this.analyserNode = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.isInitialized = false;
        console.log('AudioAnalyzer cleaned up');
    }
}