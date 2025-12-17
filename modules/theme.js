// modules/theme.js
import { StorageManager } from './storage.js';

export function initTheme() {
    const savedTheme = StorageManager.get('diarySettings', { theme: 'mint' }).theme;
    setTheme(savedTheme);
}

export function setTheme(themeName) {
    console.log('Setting theme to:', themeName);
    
    // Remove all theme classes
    document.body.classList.remove('theme-mint', 'theme-pink', 'theme-lavender', 'theme-ocean', 'theme-night');
    
    // Add new theme class
    document.body.classList.add(`theme-${themeName}`);
    
    // Update app state if exists
    if (window.APP_STATE) {
        window.APP_STATE.currentTheme = themeName;
    }
    
    // Save to storage
    const settings = StorageManager.get('diarySettings', {});
    settings.theme = themeName;
    StorageManager.set('diarySettings', settings);
    
    // Close theme panel
    const themePanel = document.getElementById('theme-panel');
    if (themePanel) {
        themePanel.classList.add('hidden');
    }
    
    // Update charts if on report page
    if (window.ChartManager && window.APP_STATE?.currentView === 'report') {
        setTimeout(() => {
            window.ChartManager.drawCharts();
        }, 100);
    }
    
    // Update mood buttons color
    updateMoodButtonsColor();
}

function updateMoodButtonsColor() {
    const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
    const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
    
    document.querySelectorAll('.mood-btn').forEach(btn => {
        if (btn.classList.contains('ring-4')) {
            btn.style.backgroundColor = buttonColor;
        } else {
            btn.style.backgroundColor = accentLightColor;
        }
    });
}