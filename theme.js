// theme.js
import { APP_STATE } from './app.js'; 

export function setTheme(themeName) {
    const body = document.body;
    
    // Xóa các class theme hiện có
    Object.keys(APP_STATE.themeConfig).forEach(t => body.classList.remove(`theme-${t}`));
    
    // Áp dụng class theme mới và cập nhật state
    body.classList.add(`theme-${themeName}`);
    APP_STATE.currentTheme = themeName;
    
    // Áp dụng biến CSS
    const config = APP_STATE.themeConfig[themeName];
    for (const key in config) {
        document.documentElement.style.setProperty(`--${key.replace('_', '-')}`, config[key]);
    }
    
    // Lưu theme vào settings
    const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
    settings.theme = themeName;
    localStorage.setItem('diarySettings', JSON.stringify(settings));
    
    // Cập nhật màu sắc cho mood buttons
    updateMoodButtonsColor();
    
    // Vẽ lại biểu đồ để cập nhật màu sắc
    if (typeof window.drawCharts === 'function') {
        window.drawCharts();
    }
    
    // Show notification
    showNotification(`Đã chuyển sang chủ đề ${themeName}`, 'info');
}

/**
 * Cập nhật màu sắc cho mood buttons
 */
function updateMoodButtonsColor() {
    const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
    document.querySelectorAll('.mood-btn').forEach(btn => {
        if (!btn.classList.contains('ring-4')) {
            btn.style.backgroundColor = accentLightColor;
        }
    });
    
    // Update active nav button color
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.classList.contains('bg-accent-light')) {
            btn.style.backgroundColor = accentLightColor;
        }
    });
}