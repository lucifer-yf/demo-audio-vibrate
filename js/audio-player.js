/**
 * 音频播放器类
 * 负责音频文件的播放控制和状态管理
 */

class AudioPlayer {
    constructor(audioElement) {
        this.audioElement = audioElement;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 0.5;
        this.isMuted = false;
        this.previousVolume = 0.5;
        
        // 事件回调
        this.callbacks = {
            onPlay: [],
            onPause: [],
            onTimeUpdate: [],
            onLoadedMetadata: [],
            onEnded: [],
            onError: [],
            onVolumeChange: []
        };
        
        this.init();
    }

    // 初始化播放器
    init() {
        // 设置初始音量
        this.audioElement.volume = this.volume;
        
        // 绑定音频元素事件
        this.bindAudioEvents();
        
        console.log('AudioPlayer initialized');
    }

    // 绑定音频元素事件
    bindAudioEvents() {
        // 播放事件
        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.triggerCallbacks('onPlay');
        });

        // 暂停事件
        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.triggerCallbacks('onPause');
        });

        // 时间更新事件
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.triggerCallbacks('onTimeUpdate', {
                currentTime: this.currentTime,
                duration: this.duration,
                progress: this.duration > 0 ? this.currentTime / this.duration : 0
            });
        });

        // 元数据加载完成事件
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration;
            this.triggerCallbacks('onLoadedMetadata', {
                duration: this.duration
            });
        });

        // 播放结束事件
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.currentTime = 0;
            this.triggerCallbacks('onEnded');
        });

        // 错误事件
        this.audioElement.addEventListener('error', (event) => {
            this.isPlaying = false;
            this.triggerCallbacks('onError', {
                error: event.target.error,
                code: event.target.error ? event.target.error.code : null
            });
        });

        // 音量变化事件
        this.audioElement.addEventListener('volumechange', () => {
            this.volume = this.audioElement.volume;
            this.isMuted = this.audioElement.muted;
            this.triggerCallbacks('onVolumeChange', {
                volume: this.volume,
                isMuted: this.isMuted
            });
        });

        // 加载进度事件
        this.audioElement.addEventListener('progress', () => {
            const buffered = this.audioElement.buffered;
            if (buffered.length > 0 && this.duration > 0) {
                const bufferedEnd = buffered.end(buffered.length - 1);
                const bufferedProgress = bufferedEnd / this.duration;
                this.triggerCallbacks('onProgress', {
                    buffered: bufferedProgress
                });
            }
        });

        // 可以播放事件
        this.audioElement.addEventListener('canplay', () => {
            this.triggerCallbacks('onCanPlay');
        });

        // 可以完整播放事件
        this.audioElement.addEventListener('canplaythrough', () => {
            this.triggerCallbacks('onCanPlayThrough');
        });
    }

    // 加载音频文件
    async loadFile(file) {
        return new Promise((resolve, reject) => {
            try {
                // 验证文件
                const validation = validateAudioFile(file);
                if (!validation.valid) {
                    reject(new Error(validation.error));
                    return;
                }

                // 创建对象URL
                const url = URL.createObjectURL(file);
                
                // 清理之前的URL
                if (this.audioElement.src && this.audioElement.src.startsWith('blob:')) {
                    URL.revokeObjectURL(this.audioElement.src);
                }

                // 设置新的音频源
                this.audioElement.src = url;
                this.audioElement.load();

                // 监听加载完成
                const onLoadedMetadata = () => {
                    this.audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    this.audioElement.removeEventListener('error', onError);
                    resolve({
                        duration: this.audioElement.duration,
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type
                    });
                };

                const onError = (event) => {
                    this.audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    this.audioElement.removeEventListener('error', onError);
                    reject(new Error('Failed to load audio file'));
                };

                this.audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
                this.audioElement.addEventListener('error', onError);

            } catch (error) {
                reject(error);
            }
        });
    }

    // 播放音频
    async play() {
        try {
            if (!this.audioElement.src) {
                throw new Error('No audio source loaded');
            }

            await this.audioElement.play();
            return true;
        } catch (error) {
            console.error('Failed to play audio:', error);
            
            // 处理不同类型的播放错误
            if (error.name === 'NotAllowedError') {
                throw new Error('播放被阻止，请先与页面交互');
            } else if (error.name === 'NotSupportedError') {
                throw new Error('不支持的音频格式');
            } else {
                throw new Error('播放失败：' + error.message);
            }
        }
    }

    // 暂停音频
    pause() {
        this.audioElement.pause();
    }

    // 停止音频（暂停并重置到开始位置）
    stop() {
        this.pause();
        this.seek(0);
    }

    // 跳转到指定时间
    seek(time) {
        if (this.duration > 0) {
            const clampedTime = Math.max(0, Math.min(time, this.duration));
            this.audioElement.currentTime = clampedTime;
            return clampedTime;
        }
        return 0;
    }

    // 跳转到指定进度（0-1）
    seekToProgress(progress) {
        const time = progress * this.duration;
        return this.seek(time);
    }

    // 设置音量（0-1）
    setVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.audioElement.volume = clampedVolume;
        this.volume = clampedVolume;
        
        if (clampedVolume > 0) {
            this.isMuted = false;
            this.audioElement.muted = false;
        }
        
        return clampedVolume;
    }

    // 静音/取消静音
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.isMuted;
    }

    // 静音
    mute() {
        this.previousVolume = this.volume;
        this.audioElement.muted = true;
        this.isMuted = true;
    }

    // 取消静音
    unmute() {
        this.audioElement.muted = false;
        this.isMuted = false;
        if (this.previousVolume > 0) {
            this.setVolume(this.previousVolume);
        }
    }

    // 快进（秒）
    fastForward(seconds = 10) {
        const newTime = this.currentTime + seconds;
        return this.seek(newTime);
    }

    // 快退（秒）
    rewind(seconds = 10) {
        const newTime = this.currentTime - seconds;
        return this.seek(newTime);
    }

    // 获取播放状态
    getState() {
        return {
            isPlaying: this.isPlaying,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.volume,
            isMuted: this.isMuted,
            progress: this.duration > 0 ? this.currentTime / this.duration : 0,
            buffered: this.getBufferedProgress(),
            readyState: this.audioElement.readyState,
            networkState: this.audioElement.networkState
        };
    }

    // 获取缓冲进度
    getBufferedProgress() {
        const buffered = this.audioElement.buffered;
        if (buffered.length > 0 && this.duration > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            return bufferedEnd / this.duration;
        }
        return 0;
    }

    // 检查是否可以播放
    canPlay() {
        return this.audioElement.readyState >= 3; // HAVE_FUTURE_DATA
    }

    // 添加事件回调
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    // 移除事件回调
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    // 触发回调
    triggerCallbacks(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }

    // 获取音频信息
    getAudioInfo() {
        return {
            src: this.audioElement.src,
            duration: this.duration,
            currentTime: this.currentTime,
            volume: this.volume,
            muted: this.isMuted,
            paused: this.audioElement.paused,
            ended: this.audioElement.ended,
            readyState: this.audioElement.readyState,
            networkState: this.audioElement.networkState,
            buffered: this.getBufferedProgress()
        };
    }

    // 清理资源
    cleanup() {
        // 停止播放
        this.stop();
        
        // 清理对象URL
        if (this.audioElement.src && this.audioElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(this.audioElement.src);
        }
        
        // 清空音频源
        this.audioElement.src = '';
        this.audioElement.load();
        
        // 清空回调
        Object.keys(this.callbacks).forEach(event => {
            this.callbacks[event] = [];
        });
        
        console.log('AudioPlayer cleaned up');
    }

    // 获取支持的音频格式
    static getSupportedFormats() {
        const audio = new Audio();
        return {
            mp3: {
                canPlay: audio.canPlayType('audio/mpeg'),
                mime: 'audio/mpeg'
            },
            aac: {
                canPlay: audio.canPlayType('audio/mp4'),
                mime: 'audio/mp4'
            },
            ogg: {
                canPlay: audio.canPlayType('audio/ogg'),
                mime: 'audio/ogg'
            },
            wav: {
                canPlay: audio.canPlayType('audio/wav'),
                mime: 'audio/wav'
            },
            webm: {
                canPlay: audio.canPlayType('audio/webm'),
                mime: 'audio/webm'
            }
        };
    }

    // 检查特定格式支持
    static canPlayFormat(mimeType) {
        const audio = new Audio();
        return audio.canPlayType(mimeType);
    }
}