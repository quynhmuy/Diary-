// app.js - Main App Initialization
import { StorageManager } from './modules/storage.js';
import { initTheme, setTheme } from './modules/theme.js';
import { DiaryManager } from './modules/diary.js';
import { TimelineManager } from './modules/timeline.js';
import { ReflectionManager } from './modules/reflection.js';
import { Utils } from './modules/utils.js';
import { ChartManager } from './modules/chart.js';
import { ReportManager } from './modules/report.js';

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

// Export functions for HTML onclick handlers
export function saveDailyEntry() { 
    const result = DiaryManager.saveDailyEntry();
    if (result) {
        Utils.updateStreakCounter();
        setTimeout(() => {
            Utils.showNotification('Nhật ký đã được lưu và reset sẵn sàng cho ngày mới! 🎉', 'success');
        }, 500);
    }
    return result;
}

// Thêm hàm mới: Edit entry
export function editEntry(entryId) {
    return DiaryManager.loadEntryForEdit(entryId);
}

// Thêm hàm mới: Delete entry
export function deleteEntry(entryId) {
    if (confirm('Bạn có chắc chắn muốn xóa nhật ký này không?')) {
        return DiaryManager.deleteEntry(entryId);
    }
    return false;
}

export function saveMoment() { 
    const name = document.getElementById('moment-name')?.value.trim();
    const desc = document.getElementById('moment-desc')?.value.trim();
    
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
    
    document.getElementById('moment-name').value = '';
    document.getElementById('moment-desc').value = '';
    document.getElementById('moment-input').classList.add('hidden');
    
    Utils.showNotification('Khoảnh khắc đã được lưu! 🌟', 'success');
    
    if (APP_STATE.currentView === 'timeline') {
        TimelineManager.loadTimelineEntries();
    }
    
    return true;
}

export function saveReflection() { 
    return ReflectionManager.saveReflection(); 
}

export function showNotification(message, type) { 
    return Utils.showNotification(message, type); 
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
    console.log('Switching to view:', viewName);
    
    APP_STATE.currentView = viewName;
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });

    // Show active view
    const activeView = document.getElementById(`${viewName}-page`);
    if (activeView) {
        console.log('Showing view:', activeView.id);
        activeView.classList.remove('hidden');
    }
    
    // Update active nav button
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('bg-accent-light', 'font-bold');
        btn.style.backgroundColor = '';
    });
    
    const activeBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeBtn) {
        const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
        activeBtn.classList.add('bg-accent-light', 'font-bold');
        activeBtn.style.backgroundColor = accentLightColor;
    }
    
    // Execute view-specific actions
    switch (viewName) {
        case 'diary':
            console.log('Loading diary...');
            DiaryManager.loadTodayEntry();
            break;
        case 'report':
            console.log('Loading report...');
            if (ChartManager) {
                ChartManager.drawCharts();
            }
            break;
        case 'timeline':
            console.log('Loading timeline...');
            if (TimelineManager) {
                TimelineManager.loadTimelineEntries();
            }
            break;
        case 'reflection':
            console.log('Loading reflection...');
            if (ReflectionManager) {
                ReflectionManager.loadReflection();
            }
            break;
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    return true;
}

export function toggleThemePanel() {
    const panel = document.getElementById('theme-panel');
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
    const momentInput = document.getElementById('moment-input');
    if (momentInput.classList.contains('hidden')) {
        momentInput.classList.remove('hidden');
        momentInput.classList.add('animate-fadeIn');
        momentInput.classList.remove('animate-fadeOut');
        
        document.getElementById('moment-name').value = '';
        document.getElementById('moment-desc').value = '';
        
        setTimeout(() => {
            document.getElementById('moment-name').focus();
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

export function resizeChart() {
    if (APP_STATE.currentView === 'report' && ChartManager) {
        ChartManager.drawCharts();
    }
}

// Setup event listeners
function setupMoodSelector() {
    document.querySelectorAll('.mood-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
            const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
            
            // Remove active state from all buttons
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.style.backgroundColor = accentLightColor;
                btn.classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            });

            // Set active state for clicked button
            e.currentTarget.style.backgroundColor = buttonColor;
            e.currentTarget.classList.add('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            
            // Click animation
            e.currentTarget.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.currentTarget.style.transform = '';
            }, 150);
        });
    });
}

function setupSelfCareChecklist() {
    document.querySelectorAll('.pastel-checkbox').forEach(label => {
        const input = label.querySelector('input[type="checkbox"]');
        
        label.addEventListener('click', (e) => {
            setTimeout(() => {
                if (input.checked) {
                    const icon = label.querySelector('.checkbox-icon');
                    icon.classList.add('animate-bounce-once');
                    setTimeout(() => {
                        icon.classList.remove('animate-bounce-once');
                    }, 500);
                }
            }, 0);
        });
    });
}

function setupAutoSave() {
    let saveTimeout;
    
    const autoSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const indicator = document.getElementById('save-status');
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
    
    document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
        el.addEventListener('input', autoSave);
    });
}

// Initialize the app
export function initializeApp() {
    console.log('Initializing app...');
    
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
    
    const dateElement = document.getElementById('current-date');
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
    
    // Setup search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (TimelineManager) {
                TimelineManager.loadTimelineEntries();
            }
        });
    }
    
    // Close theme panel when clicking outside
    document.addEventListener('click', (e) => {
        const themePanel = document.getElementById('theme-panel');
        const themeToggle = document.getElementById('theme-toggle');
        
        if (themePanel && !themePanel.contains(e.target) && 
            themeToggle && !themeToggle.contains(e.target) &&
            !themePanel.classList.contains('hidden')) {
            toggleThemePanel();
        }
    });
    
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
window.editEntry = editEntry;  // Thêm hàm edit
window.deleteEntry = deleteEntry;  // Thêm hàm delete

window.TimelineManager = TimelineManager;
window.ChartManager = ChartManager;
window.ReportManager = ReportManager;

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