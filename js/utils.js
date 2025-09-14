/**
 * 工具函数库
 * 提供通用的辅助函数
 */

// 格式化时间显示
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 检测音频格式支持
function detectAudioSupport() {
    const audio = new Audio();
    const formats = {
        mp3: {
            supported: !!audio.canPlayType('audio/mpeg'),
            mime: 'audio/mpeg'
        },
        aac: {
            supported: !!audio.canPlayType('audio/mp4'),
            mime: 'audio/mp4'
        },
        ogg: {
            supported: !!audio.canPlayType('audio/ogg'),
            mime: 'audio/ogg'
        },
        wav: {
            supported: !!audio.canPlayType('audio/wav'),
            mime: 'audio/wav'
        }
    };
    
    return formats;
}

// 检测设备功能支持
function detectDeviceCapabilities() {
    const capabilities = {
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        vibration: !!navigator.vibrate,
        fileAPI: !!(window.File && window.FileReader && window.FileList && window.Blob),
        touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
    
    return capabilities;
}

// 验证音频文件
function validateAudioFile(file) {
    const supportedFormats = detectAudioSupport();
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    // 检查文件大小
    if (file.size > maxSize) {
        return {
            valid: false,
            error: '文件大小超过50MB限制'
        };
    }
    
    // 检查文件类型
    const fileType = file.type.toLowerCase();
    const isSupported = Object.values(supportedFormats).some(format => 
        format.supported && fileType.includes(format.mime.split('/')[1])
    );
    
    if (!isSupported) {
        return {
            valid: false,
            error: '不支持的音频格式，请选择MP3、AAC、OGG或WAV文件'
        };
    }
    
    return {
        valid: true,
        error: null
    };
}

// 显示错误模态框
function showError(message) {
    const modal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    modal.style.display = 'flex';
    
    // 添加淡入动画
    modal.classList.add('fade-in');
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('errorModal');
    modal.style.display = 'none';
    modal.classList.remove('fade-in');
}

// 显示成功提示
function showSuccess(message) {
    // 创建临时提示元素
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 获取文件扩展名
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
}

// 生成随机ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// 检查是否为移动设备
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 获取设备信息
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceInfo = {
        platform: 'unknown',
        browser: 'unknown',
        version: 'unknown'
    };
    
    // 检测平台
    if (/Android/i.test(userAgent)) {
        deviceInfo.platform = 'Android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        deviceInfo.platform = 'iOS';
    } else if (/Windows/i.test(userAgent)) {
        deviceInfo.platform = 'Windows';
    } else if (/Mac/i.test(userAgent)) {
        deviceInfo.platform = 'macOS';
    }
    
    // 检测浏览器
    if (/Chrome/i.test(userAgent)) {
        deviceInfo.browser = 'Chrome';
    } else if (/Safari/i.test(userAgent)) {
        deviceInfo.browser = 'Safari';
    } else if (/Firefox/i.test(userAgent)) {
        deviceInfo.browser = 'Firefox';
    } else if (/Edge/i.test(userAgent)) {
        deviceInfo.browser = 'Edge';
    }
    
    return deviceInfo;
}

// 添加CSS动画样式
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .toast {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(style);
}

// 初始化工具函数
function initUtils() {
    addAnimationStyles();
    
    // 添加全局错误处理
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        showError('应用发生错误，请刷新页面重试');
    });
    
    // 添加未处理的Promise错误处理
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showError('操作失败，请重试');
    });
}

// 导出工具函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatTime,
        detectAudioSupport,
        detectDeviceCapabilities,
        validateAudioFile,
        showError,
        closeModal,
        showSuccess,
        debounce,
        throttle,
        getFileExtension,
        generateId,
        isMobileDevice,
        getDeviceInfo,
        initUtils
    };
}