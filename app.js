// app.js - Main App Initialization (Optimized)
import { StorageManager } from './modules/storage.js';
import { initTheme, setTheme } from './modules/theme.js';
import { DiaryManager } from './modules/diary.js';
import { TimelineManager } from './modules/timeline.js';
import { ReflectionManager } from './modules/reflection.js';
import { Utils } from './modules/utils.js';
import { ChartManager } from './modules/chart.js';

// App State
export const APP_STATE = {
    currentView: 'diary',
    currentTheme: 'mint',
    moods: ['😊', '😢', '😡', '😴', '✨'],
    moodColors: {
        '😊': '#AEE6E6',
        '😢': '#ADD8E6',
        '😡': '#FFC0CB',
        '😴': '#D8BFD8',
        '✨': '#7FC7C7'
    }
};

// Cache DOM elements
let cachedElements = {};
const getElement = (id) => {
    if (!cachedElements[id]) {
        cachedElements[id] = document.getElementById(id);
    }
    return cachedElements[id];
};

// Throttle function for performance
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Export functions for HTML onclick handlers
export function saveDailyEntry() { 
    const result = DiaryManager.saveDailyEntry();
    if (result) {
        Utils.updateStreakCounter();
        setTimeout(() => {
            Utils.showNotification('Nhật ký đã được lưu! 🎉', 'success');
        }, 500);
    }
    return result;
}

export function editEntry(entryId) {
    return DiaryManager.loadEntryForEdit(entryId);
}

export function deleteEntry(entryId) {
    if (confirm('Bạn có chắc chắn muốn xóa nhật ký này không?')) {
        return DiaryManager.deleteEntry(entryId);
    }
    return false;
}

export function saveMoment() { 
    const name = getElement('moment-name')?.value.trim();
    const desc = getElement('moment-desc')?.value.trim();
    
    if (!name) {
        Utils.showNotification('Vui lòng nhập tên khoảnh khắc', 'warning');
        return false;
    }
    
    const today = new Date();
    const dateString = today.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const momentData = {
        id: `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        description: desc,
        date: dateString,
        mood: '⭐',
        type: 'manual',
        timestamp: today.getTime()
    };
    
    let moments = StorageManager.get('moments', []);
    moments.unshift(momentData);
    StorageManager.set('moments', moments);
    
    getElement('moment-name').value = '';
    getElement('moment-desc').value = '';
    getElement('moment-input').classList.add('hidden');
    
    Utils.showNotification('Khoảnh khắc đã được lưu! 🌟', 'success');
    
    if (APP_STATE.currentView === 'timeline') {
        TimelineManager.loadTimelineEntries();
    }
    
    return true;
}

export function saveReflection() { 
    return ReflectionManager.saveReflection(); 
}

export function updateStreakCounter() { 
    return Utils.updateStreakCounter(); 
}

export function exportData() { 
    return Utils.exportData(); 
}

export function clearFilters() { 
    return TimelineManager.clearFilters(); 
}

export function switchView(viewName) {
    // Prevent unnecessary view switches
    if (APP_STATE.currentView === viewName) return;
    
    APP_STATE.currentView = viewName;
    
    // Hide all views
    const views = document.querySelectorAll('.view');
    for (let i = 0; i < views.length; i++) {
        views[i].classList.add('hidden');
    }

    // Show active view
    const activeView = getElement(`${viewName}-page`);
    if (activeView) {
        activeView.classList.remove('hidden');
    }
    
    // Update active nav button
    const navItems = document.querySelectorAll('.nav-item');
    for (let i = 0; i < navItems.length; i++) {
        navItems[i].classList.remove('bg-accent-light', 'font-bold');
        navItems[i].style.backgroundColor = '';
    }
    
    const activeBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeBtn) {
        const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
        activeBtn.classList.add('bg-accent-light', 'font-bold');
        activeBtn.style.backgroundColor = accentLightColor;
    }
    
    // Execute view-specific actions
    switch (viewName) {
        case 'diary':
            DiaryManager.loadTodayEntry();
            break;
        case 'report':
            if (ChartManager) {
                ChartManager.drawCharts();
            }
            break;
        case 'timeline':
            if (TimelineManager) {
                TimelineManager.loadTimelineEntries();
            }
            break;
        case 'reflection':
            if (ReflectionManager) {
                ReflectionManager.loadReflection();
            }
            break;
    }
    
    return true;
}

export function toggleThemePanel() {
    const panel = getElement('theme-panel');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        panel.classList.add('animate-fadeIn');
        panel.classList.remove('animate-fadeOut');
    } else {
        panel.classList.add('animate-fadeOut');
        setTimeout(() => {
            panel.classList.add('hidden');
            panel.classList.remove('animate-fadeOut');
        }, 300);
    }
}

export function showMomentInput() {
    const momentInput = getElement('moment-input');
    if (momentInput.classList.contains('hidden')) {
        momentInput.classList.remove('hidden');
        momentInput.classList.add('animate-fadeIn');
        momentInput.classList.remove('animate-fadeOut');
        
        getElement('moment-name').value = '';
        getElement('moment-desc').value = '';
        
        setTimeout(() => {
            getElement('moment-name').focus();
        }, 100);
    } else {
        momentInput.classList.add('animate-fadeOut');
        setTimeout(() => {
            momentInput.classList.add('hidden');
            momentInput.classList.remove('animate-fadeOut');
        }, 300);
    }
}

export function filterTimelineEntries() {
    if (TimelineManager) {
        TimelineManager.loadTimelineEntries();
    }
}

export const resizeChart = throttle(() => {
    if (APP_STATE.currentView === 'report' && ChartManager) {
        ChartManager.drawCharts();
    }
}, 250);

// Setup event listeners
function setupMoodSelector() {
    const moodButtons = document.querySelectorAll('.mood-btn');
    for (let i = 0; i < moodButtons.length; i++) {
        moodButtons[i].addEventListener('click', function(e) {
            const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
            const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
            
            // Remove active state from all buttons
            for (let j = 0; j < moodButtons.length; j++) {
                moodButtons[j].style.backgroundColor = accentLightColor;
                moodButtons[j].classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            }

            // Set active state for clicked button
            this.style.backgroundColor = buttonColor;
            this.classList.add('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            
            // Click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    }
}

function setupSelfCareChecklist() {
    const checkboxes = document.querySelectorAll('.pastel-checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('click', function(e) {
            const input = this.querySelector('input[type="checkbox"]');
            setTimeout(() => {
                if (input.checked) {
                    const icon = this.querySelector('.checkbox-icon');
                    icon.classList.add('animate-bounce-once');
                    setTimeout(() => {
                        icon.classList.remove('animate-bounce-once');
                    }, 500);
                }
            }, 0);
        });
    }
}

function setupAutoSave() {
    let saveTimeout;
    
    const autoSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const indicator = getElement('save-status');
            if (indicator) {
                indicator.textContent = 'Đang lưu...';
                indicator.classList.add('text-blue-500');
                
                setTimeout(() => {
                    indicator.textContent = 'Đã lưu tự động';
                    indicator.classList.remove('text-blue-500');
                }, 500);
            }
        }, 2000);
    };
    
    const inputs = document.querySelectorAll('textarea, input[type="text"]');
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', autoSave);
    }
}

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Initialize the app
export function initializeApp() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Initialize storage
    StorageManager.initializeDefaults();
    
    // Initialize theme
    initTheme();
    
    // Set current date
    const today = new Date();
    const dateString = today.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const dateElement = getElement('current-date');
    if (dateElement) {
        dateElement.textContent = dateString;
    }
    
    // Setup event listeners
    setupMoodSelector();
    setupSelfCareChecklist();
    Utils.setupPhotoUpload();
    setupAutoSave();
    
    // Initialize streak counter
    Utils.updateStreakCounter();
    
    // Load today's entry if exists
    DiaryManager.loadTodayEntry();
    
    // Set initial view
    switchView(APP_STATE.currentView);
    
    // Setup search functionality with debounce
    const searchInput = getElement('search-input');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            if (TimelineManager) {
                TimelineManager.loadTimelineEntries();
            }
        }, 300);
        
        searchInput.addEventListener('input', debouncedSearch);
    }
    
    // Close theme panel when clicking outside
    document.addEventListener('click', (e) => {
        const themePanel = getElement('theme-panel');
        const themeToggle = getElement('theme-toggle');
        
        if (themePanel && !themePanel.contains(e.target) && 
            themeToggle && !themeToggle.contains(e.target) &&
            !themePanel.classList.contains('hidden')) {
            toggleThemePanel();
        }
    });
    
    // Add resize listener with throttling
    window.addEventListener('resize', resizeChart);
    
    console.log('App initialized successfully!');
}

// Make functions available globally for HTML onclick handlers
window.switchView = switchView;
window.toggleThemePanel = toggleThemePanel;
window.setTheme = setTheme;
window.showMomentInput = showMomentInput;
window.filterTimelineEntries = filterTimelineEntries;
window.saveDailyEntry = saveDailyEntry;
window.saveMoment = saveMoment;
window.saveReflection = saveReflection;
window.clearFilters = clearFilters;
window.exportData = exportData;
window.resizeChart = resizeChart;
window.editEntry = editEntry;
window.deleteEntry = deleteEntry;

// Thêm hàm refreshReport cho button trong HTML
window.refreshReport = function() {
    if (ChartManager) {
        ChartManager.drawCharts();
    }
    Utils.showNotification('Báo cáo đã được làm mới!', 'success');
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}