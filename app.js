// app.js
import { setTheme } from './theme.js';

// Khai báo APP_STATE (Dữ liệu cấu hình và trạng thái ứng dụng)
export const APP_STATE = {
    currentView: 'diary',
    currentTheme: 'mint',
    moods: ['😊', '😢', '😡', '😴', '✨'],
    moodColors: {
        '😊': '#AEE6E6', // Mint
        '😢': '#ADD8E6', // Blue
        '😡': '#FFC0CB', // Pink
        '😴': '#D8BFD8', // Lavender
        '✨': '#7FC7C7', // Darker Mint
    },
    themeConfig: {
        'mint': { bg: '#F7FBFB', card: '#FFFFFF', accent: '#AEE6E6', accent_light: '#DFF7F7', button_bg: '#7FC7C7', text: '#1A202C', text_soft: '#555555', shadow: 'rgba(150,200,200,0.25)' },
        'pink': { bg: '#FFF7F9', card: '#FFFFFF', accent: '#FFC0CB', accent_light: '#FFE0E6', button_bg: '#F08080', text: '#1A202C', text_soft: '#555555', shadow: 'rgba(255,192,203,0.3)' },
        'lavender': { bg: '#FCF7FF', card: '#FFFFFF', accent: '#D8BFD8', accent_light: '#EDE0F7', button_bg: '#B19CD9', text: '#1A202C', text_soft: '#555555', shadow: 'rgba(216,191,216,0.3)' },
        'ocean': { bg: '#F7FBFF', card: '#FFFFFF', accent: '#ADD8E6', accent_light: '#E0F7FF', button_bg: '#87CEEB', text: '#1A202C', text_soft: '#555555', shadow: 'rgba(173,216,230,0.3)' },
        'night': { bg: '#1A202C', card: '#2D3748', accent: '#4A5568', accent_light: '#718096', button_bg: '#A0AEC0', text: '#E2E8F0', text_soft: '#CBD5E0', shadow: 'rgba(0,0,0,0.5)' },
    }
};

// DATA SYNC MANAGEMENT
const DATA_SOURCES = {
    diaryEntries: 'diaryEntries',
    moments: 'moments',
    reflections: 'monthlyReflections',
    settings: 'diarySettings',
    photos: 'diaryPhotos'
};

// --- CORE UI LOGIC ---

/**
 * Chuyển đổi giữa các trang (View).
 */
export function switchView(viewName) {
    APP_STATE.currentView = viewName;
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });

    // Show active view
    const activeView = document.getElementById(`${viewName}-page`);
    if (activeView) {
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
        case 'report':
            if (typeof window.drawCharts === 'function') {
                window.drawCharts();
                updateReportStats();
            }
            break;
        case 'timeline':
            loadTimelineEntries();
            break;
        case 'reflection':
            loadReflection();
            break;
    }
}

/**
 * Mở/Đóng bảng chọn Theme.
 */
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

/**
 * Hiển thị/Ẩn ô nhập Moment
 */
export function showMomentInput() {
    const momentInput = document.getElementById('moment-input');
    if (momentInput.classList.contains('hidden')) {
        momentInput.classList.remove('hidden');
        momentInput.classList.add('animate-fadeIn');
        momentInput.classList.remove('animate-fadeOut');
        
        // Clear previous inputs
        document.getElementById('moment-name').value = '';
        document.getElementById('moment-desc').value = '';
        
        // Focus on name input
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

/**
 * Thiết lập sự kiện cho Mood Selector.
 */
function setupMoodSelector() {
    document.querySelectorAll('.mood-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove all active states
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
                btn.classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            });

            // Set active state for clicked button
            e.currentTarget.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
            e.currentTarget.classList.add('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            
            // Add click animation
            e.currentTarget.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.currentTarget.style.transform = '';
            }, 150);
        });
    });
}

/**
 * Thiết lập sự kiện cho Self-care Checklist
 */
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

// --- DATA STORAGE & RETRIEVAL LOGIC ---

/**
 * Thu thập dữ liệu từ form Nhật Ký và lưu vào Local Storage
 */
export function saveDailyEntry() {
    const today = new Date();
    const dateString = today.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });

    // Get current date for display
    document.getElementById('current-date').textContent = dateString;

    // Collect form data
    const entry = {
        id: `entry_${today.getTime()}`,
        date: dateString,
        mood: document.querySelector('.mood-btn.ring-4')?.dataset.mood || '😊',
        achievements: document.getElementById('achievements').value || '',
        stress: document.getElementById('stress').value || '',
        gratitude1: document.getElementById('gratitude1').value || '',
        gratitude2: document.getElementById('gratitude2').value || '',
        gratitude3: document.getElementById('gratitude3').value || '',
        selfCare: Array.from(document.querySelectorAll('.pastel-checkbox input:checked'))
            .map(input => input.value),
        highlight: document.getElementById('highlight').value || '',
        photos: Array.from(document.querySelectorAll('.photo-upload img'))
            .map(img => img.src)
            .filter(src => !src.includes('plus')),
        content: document.getElementById('content').value || '',
        timestamp: today.getTime(),
        theme: APP_STATE.currentTheme
    };
    
    // Validation
    if (entry.content.length < 5) {
        showNotification('Vui lòng viết ít nhất một vài dòng vào nội dung nhật ký.', 'warning');
        return;
    }

    try {
        // Save to localStorage
        let existingEntries = JSON.parse(localStorage.getItem(DATA_SOURCES.diaryEntries) || '[]');
        
        // Remove existing entry for today if exists
        existingEntries = existingEntries.filter(e => e.date !== dateString);
        
        // Add new entry at the beginning
        existingEntries.unshift(entry);
        
        // Save with error handling
        localStorage.setItem(DATA_SOURCES.diaryEntries, JSON.stringify(existingEntries));
        
        // Update streak counter
        updateStreakCounter();
        
        // Save highlight as moment if exists
        if (entry.highlight) {
            saveMoment({
                id: `moment_${today.getTime()}`,
                name: entry.highlight,
                description: `Từ nhật ký ngày ${dateString}`,
                date: dateString,
                mood: entry.mood,
                type: 'highlight',
                timestamp: today.getTime()
            });
        }
        
        // Show success animation
        const saveBtn = document.querySelector('button[onclick="saveDailyEntry()"]');
        if (saveBtn) {
            saveBtn.classList.add('success-pulse');
            setTimeout(() => saveBtn.classList.remove('success-pulse'), 2000);
        }
        
        // Show notification
        showNotification('Nhật ký đã được lưu thành công! ✨', 'success');
        
        // Clear form after save (optional - comment out if you want to keep data)
        // clearForm();
        
        // Update views
        if (APP_STATE.currentView === 'timeline') {
            loadTimelineEntries();
        }
        
        if (APP_STATE.currentView === 'report') {
            if (typeof window.drawCharts === 'function') {
                window.drawCharts();
                updateReportStats();
            }
        }

    } catch (error) {
        console.error("Lỗi khi lưu nhật ký:", error);
        showNotification('Lỗi: Không thể lưu nhật ký. Vui lòng thử lại.', 'error');
    }
}

/**
 * Lưu khoảnh khắc
 */
export function saveMoment(momentData = null) {
    try {
        const momentName = document.getElementById('moment-name');
        const momentDesc = document.getElementById('moment-desc');
        
        if (!momentData) {
            if (!momentName.value.trim()) {
                showNotification('Vui lòng nhập tên khoảnh khắc', 'warning');
                return;
            }
            
            const today = new Date();
            const dateString = today.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            momentData = {
                id: `moment_${Date.now()}`,
                name: momentName.value.trim(),
                description: momentDesc.value.trim(),
                date: dateString,
                mood: '⭐',
                type: 'manual',
                timestamp: today.getTime()
            };
        }
        
        let existingMoments = JSON.parse(localStorage.getItem(DATA_SOURCES.moments) || '[]');
        
        // Check if moment already exists
        const existingIndex = existingMoments.findIndex(m => 
            m.date === momentData.date && m.name === momentData.name
        );
        
        if (existingIndex >= 0) {
            existingMoments[existingIndex] = momentData;
        } else {
            existingMoments.unshift(momentData);
        }
        
        localStorage.setItem(DATA_SOURCES.moments, JSON.stringify(existingMoments));
        
        // Clear form and hide
        if (momentName && momentDesc) {
            momentName.value = '';
            momentDesc.value = '';
            document.getElementById('moment-input').classList.add('hidden');
        }
        
        // Show notification
        showNotification('Khoảnh khắc đã được lưu! 🌟', 'success');
        
        // Update timeline
        if (APP_STATE.currentView === 'timeline') {
            loadTimelineEntries();
        }
        
        return true;
    } catch (error) {
        console.error("Lỗi khi lưu khoảnh khắc:", error);
        showNotification('Lỗi: Không thể lưu khoảnh khắc', 'error');
        return false;
    }
}

/**
 * Lưu reflection
 */
export function saveReflection() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1; // 1-12
        const year = today.getFullYear();
        
        const reflectionData = {
            id: `reflection_${year}_${month}`,
            month: month,
            year: year,
            learned: document.getElementById('learned').value || '',
            proudOf: document.getElementById('proud-of').value || '',
            improvement: document.getElementById('improvement').value || '',
            timestamp: today.getTime()
        };
        
        const key = `${DATA_SOURCES.reflections}_${year}_${month}`;
        localStorage.setItem(key, JSON.stringify(reflectionData));
        
        // Show success animation
        const saveBtn = document.querySelector('#reflection-page button');
        if (saveBtn) {
            saveBtn.classList.add('success-pulse');
            setTimeout(() => saveBtn.classList.remove('success-pulse'), 2000);
        }
        
        showNotification('Reflection đã được lưu! 📝', 'success');
        return true;
    } catch (error) {
        console.error("Lỗi khi lưu reflection:", error);
        showNotification('Lỗi: Không thể lưu reflection', 'error');
        return false;
    }
}

/**
 * Tải reflection
 */
export function loadReflection() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const key = `${DATA_SOURCES.reflections}_${year}_${month}`;
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        
        // Update page title
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
        document.querySelector('#reflection-page h1').textContent = 
            `Reflection ${monthNames[month-1]}`;
        
        // Populate form fields
        if (data) {
            document.getElementById('learned').value = data.learned || '';
            document.getElementById('proud-of').value = data.proudOf || '';
            document.getElementById('improvement').value = data.improvement || '';
        }
        
        return data;
    } catch (error) {
        console.error("Lỗi khi tải reflection:", error);
        return {};
    }
}

/**
 * Tính streak
 */
function calculateStreak() {
    const entries = JSON.parse(localStorage.getItem(DATA_SOURCES.diaryEntries) || '[]');
    if (entries.length === 0) return 0;
    
    // Sort entries by date (newest first)
    const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = new Date(sortedEntries[i].timestamp);
        entryDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (entryDate.getTime() === expectedDate.getTime()) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

/**
 * Cập nhật streak counter
 */
function updateStreakCounter() {
    const streak = calculateStreak();
    const streakElement = document.getElementById('streak-counter');
    if (streakElement) {
        streakElement.innerHTML = `🔥 ${streak} ngày liên tiếp`;
        
        // Add special effects for milestones
        if (streak > 0) {
            streakElement.classList.add('animate-pulse');
            if (streak % 7 === 0) {
                streakElement.classList.add('animate-float');
                setTimeout(() => streakElement.classList.remove('animate-float'), 3000);
            }
        }
    }
}

/**
 * Tải timeline entries
 */
export function loadTimelineEntries() {
    // Show loading animation
    const timelineContainer = document.querySelector('.timeline-container');
    const loadingElement = document.getElementById('timeline-loading');
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
    
    if (timelineContainer) {
        timelineContainer.classList.add('opacity-50');
    }
    
    setTimeout(() => {
        const existingEntries = JSON.parse(localStorage.getItem(DATA_SOURCES.diaryEntries) || '[]');
        const moments = JSON.parse(localStorage.getItem(DATA_SOURCES.moments) || '[]');
        
        // Apply filters
        const moodFilterElement = document.getElementById('mood-filter');
        const selectedMood = moodFilterElement ? moodFilterElement.value : '';
        
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        let filteredEntries = existingEntries;
        
        // Filter by mood
        if (selectedMood && selectedMood !== '') {
            filteredEntries = filteredEntries.filter(entry => entry.mood === selectedMood);
        }
        
        // Filter by search term
        if (searchTerm) {
            filteredEntries = filteredEntries.filter(entry => 
                entry.content.toLowerCase().includes(searchTerm) ||
                entry.achievements.toLowerCase().includes(searchTerm) ||
                entry.highlight.toLowerCase().includes(searchTerm) ||
                entry.gratitude1.toLowerCase().includes(searchTerm) ||
                entry.gratitude2.toLowerCase().includes(searchTerm) ||
                entry.gratitude3.toLowerCase().includes(searchTerm)
            );
        }
        
        // Combine and sort entries and moments
        const allItems = [
            ...filteredEntries.map(entry => ({ type: 'entry', data: entry })),
            ...moments.map(moment => ({ type: 'moment', data: moment }))
        ].sort((a, b) => b.data.timestamp - a.data.timestamp);
        
        displayTimelineEntries(allItems);
        
        // Hide loading animation
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
        
        if (timelineContainer) {
            timelineContainer.classList.remove('opacity-50');
        }
        
        // Add animations to new items
        setTimeout(() => {
            document.querySelectorAll('.timeline-item').forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
            });
        }, 100);
        
    }, 600); // Simulate loading delay
}

/**
 * Hiển thị timeline entries
 */
function displayTimelineEntries(items) {
    const timelineContainer = document.querySelector('.timeline-container');
    if (!timelineContainer) return;
    
    // Keep static elements (add button and input form)
    const staticElements = Array.from(timelineContainer.children).filter(el => 
        el.classList.contains('justify-center') || 
        el.id === 'moment-input'
    );
    
    // Clear other elements
    timelineContainer.innerHTML = '';
    staticElements.forEach(el => timelineContainer.appendChild(el));
    
    // Display message if no items
    if (items.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = "timeline-item text-center text-soft p-8";
        emptyMessage.innerHTML = `
            <i data-lucide="book-open" class="w-16 h-16 mx-auto mb-4 opacity-20"></i>
            <p class="text-lg font-semibold mb-2">Chưa có nhật ký nào được viết</p>
            <p class="text-sm">Hãy bắt đầu viết nhật ký đầu tiên của bạn!</p>
        `;
        timelineContainer.appendChild(emptyMessage);
        lucide.createIcons();
        return;
    }
    
    // Display each item
    items.forEach((item, index) => {
        const element = document.createElement('div');
        element.className = `timeline-item ${index < 3 ? 'animate-slideInUp' : ''}`;
        element.style.animationDelay = `${index * 0.1}s`;
        
        if (item.type === 'moment') {
            element.innerHTML = createMomentCard(item.data);
        } else {
            element.innerHTML = createEntryCard(item.data);
        }
        
        const insertAfterElement = timelineContainer.querySelector('.timeline-item.justify-center');
        if (insertAfterElement) {
            insertAfterElement.insertAdjacentElement('afterend', element);
        } else {
            timelineContainer.appendChild(element);
        }
    });
    
    // Recreate icons
    lucide.createIcons();
    
    // Add hover effects
    document.querySelectorAll('.timeline-item > div').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.01)';
            card.style.boxShadow = '0 15px 35px -10px var(--shadow)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });
}

/**
 * Tạo card cho moment
 */
function createMomentCard(moment) {
    const moodEmoji = moment.mood || '⭐';
    const moodColors = APP_STATE.moodColors;
    const moodColor = moodColors[moodEmoji] || moodColors['✨'];
    
    return `
        <div class="bg-card p-4 rounded-[18px] shadow-card border-l-4 card-glow" 
             style="border-color: ${moodColor};">
            <div class="flex items-center space-x-2 mb-2">
                <span class="text-2xl animate-float">${moodEmoji}</span>
                <h3 class="font-bold text-accent">${moment.name}</h3>
                <span class="text-xs bg-accent-light px-2 py-1 rounded-full">Khoảnh Khắc</span>
            </div>
            <p class="text-soft text-sm">${moment.description}</p>
            <p class="text-xs text-soft mt-2">
                <i data-lucide="calendar" class="inline w-3 h-3 mr-1"></i>
                ${moment.date}
            </p>
        </div>
    `;
}

/**
 * Tạo card cho entry
 */
function createEntryCard(entry) {
    const selfCareList = entry.selfCare?.length > 0 ? 
        `<div class="mt-3 pt-3 border-t border-accent-light">
            <p class="text-sm font-semibold mb-1">Self-care Checklist:</p>
            <div class="flex flex-wrap gap-2">
                ${entry.selfCare.map(item => `
                    <span class="text-xs bg-accent-light px-2 py-1 rounded-full flex items-center space-x-1">
                        <i data-lucide="check" class="w-3 h-3"></i>
                        <span>${item}</span>
                    </span>
                `).join('')}
            </div>
        </div>` : '';
    
    const gratitudes = [entry.gratitude1, entry.gratitude2, entry.gratitude3]
        .filter(g => g && g.trim() !== '')
        .map(g => `<li class="flex items-center space-x-2"><i data-lucide="heart" class="w-3 h-3 text-red-300"></i><span>${g}</span></li>`)
        .join('');
    
    const photosHTML = entry.photos && entry.photos.length > 0 ? `
        <div class="mt-4 grid grid-cols-3 gap-2">
            ${entry.photos.slice(0, 3).map((photo, index) => `
                <div class="rounded-[16px] overflow-hidden shadow-image image-hover">
                    <img src="${photo}" alt="Photo ${index + 1}" class="w-full h-20 object-cover">
                </div>
            `).join('')}
        </div>
    ` : '';
    
    return `
        <div class="bg-card p-6 rounded-card shadow-card hover:shadow-deep transition-all duration-300">
            <div class="flex justify-between items-start mb-3">
                <p class="text-soft text-sm flex items-center">
                    <i data-lucide="calendar" class="w-3 h-3 mr-1"></i>
                    ${entry.date}
                </p>
                <span class="text-3xl">${entry.mood}</span>
            </div>
            
            <h2 class="text-2xl font-bold text-accent mb-4">Nhật Ký Ngày ${entry.date}</h2>
            
            ${entry.achievements ? `
                <div class="mb-3 p-3 bg-green-50 rounded-lg">
                    <p class="text-sm font-semibold flex items-center space-x-2">
                        <i data-lucide="trophy" class="w-4 h-4"></i>
                        <span>Thành tựu:</span>
                    </p>
                    <p class="text-sm text-soft mt-1">${entry.achievements}</p>
                </div>
            ` : ''}
            
            ${entry.stress ? `
                <div class="mb-3 p-3 bg-red-50 rounded-lg">
                    <p class="text-sm font-semibold flex items-center space-x-2">
                        <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                        <span>Điều căng thẳng:</span>
                    </p>
                    <p class="text-sm text-soft mt-1">${entry.stress}</p>
                </div>
            ` : ''}
            
            ${gratitudes ? `
                <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm font-semibold mb-2 flex items-center space-x-2">
                        <i data-lucide="sparkles" class="w-4 h-4"></i>
                        <span>3 điều biết ơn:</span>
                    </p>
                    <ul class="space-y-1 ml-2 text-sm">${gratitudes}</ul>
                </div>
            ` : ''}
            
            ${photosHTML}
            
            ${entry.highlight ? `
                <div class="mt-4 p-3 rounded-lg" style="background: linear-gradient(135deg, var(--accent-light), #FFE0E6);">
                    <span class="text-lg font-bold">🌟 Highlight of the Day:</span>
                    <p class="text-soft mt-1">${entry.highlight}</p>
                </div>
            ` : ''}
            
            ${selfCareList}
            
            ${entry.content ? `
                <div class="mt-4 pt-4 border-t border-accent-light">
                    <p class="text-sm font-semibold mb-2">Nội dung nhật ký:</p>
                    <p class="text-sm text-soft leading-relaxed">${entry.content}</p>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Lọc timeline entries
 */
export function filterTimelineEntries() {
    loadTimelineEntries();
}

/**
 * Xóa bộ lọc
 */
export function clearFilters() {
    const moodFilter = document.getElementById('mood-filter');
    const searchInput = document.getElementById('search-input');
    
    if (moodFilter) moodFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    loadTimelineEntries();
    showNotification('Đã xóa bộ lọc', 'info');
}

/**
 * Export data
 */
export function exportData() {
    try {
        const exportBtn = document.getElementById('export-btn');
        const originalHTML = exportBtn.innerHTML;
        
        // Show loading state
        exportBtn.classList.add('exporting');
        exportBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span class="hidden md:inline ml-1">Đang xuất...</span>';
        
        setTimeout(() => {
            const allData = {
                diaryEntries: JSON.parse(localStorage.getItem(DATA_SOURCES.diaryEntries) || '[]'),
                moments: JSON.parse(localStorage.getItem(DATA_SOURCES.moments) || '[]'),
                settings: JSON.parse(localStorage.getItem(DATA_SOURCES.settings) || '{}'),
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(allData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `diary-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            // Restore button
            exportBtn.classList.remove('exporting');
            exportBtn.innerHTML = originalHTML;
            lucide.createIcons();
            
            showNotification('Dữ liệu đã được xuất thành công! 📥', 'success');
        }, 1000);
        
    } catch (error) {
        console.error("Lỗi khi xuất dữ liệu:", error);
        showNotification('Lỗi: Không thể xuất dữ liệu', 'error');
    }
}

/**
 * Cập nhật thống kê báo cáo
 */
function updateReportStats() {
    try {
        const entries = JSON.parse(localStorage.getItem(DATA_SOURCES.diaryEntries) || '[]');
        
        if (entries.length === 0) return;
        
        // Calculate mood frequencies
        const moodCounts = {};
        entries.forEach(entry => {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        });
        
        // Find most frequent mood
        let mostFrequentMood = '😊';
        let maxCount = 0;
        for (const [mood, count] of Object.entries(moodCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequentMood = mood;
            }
        }
        
        // Update DOM elements
        const mostFrequentElement = document.getElementById('most-frequent-mood');
        const moodPercentageElement = document.getElementById('mood-percentage');
        
        if (mostFrequentElement && moodPercentageElement) {
            mostFrequentElement.textContent = mostFrequentMood;
            const percentage = Math.round((maxCount / entries.length) * 100);
            moodPercentageElement.textContent = `${percentage}%`;
        }
        
        // Update other stats
        const daysWrittenElement = document.getElementById('days-written');
        const positiveRateElement = document.getElementById('positive-rate');
        const checklistCompletedElement = document.getElementById('checklist-completed');
        
        if (daysWrittenElement) {
            daysWrittenElement.textContent = entries.length;
        }
        
        if (positiveRateElement) {
            const positiveEntries = entries.filter(e => e.mood === '😊' || e.mood === '✨').length;
            const positiveRate = Math.round((positiveEntries / entries.length) * 100);
            positiveRateElement.textContent = `${positiveRate}%`;
        }
        
        if (checklistCompletedElement) {
            const totalChecklists = entries.reduce((sum, entry) => sum + (entry.selfCare?.length || 0), 0);
            const avgChecklist = Math.round((totalChecklists / entries.length) * 100 / 6); // 6 items max
            checklistCompletedElement.textContent = `${avgChecklist}%`;
        }
        
    } catch (error) {
        console.error("Lỗi khi cập nhật thống kê:", error);
    }
}

/**
 * Hiển thị notification
 */
export function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type} p-4 rounded-card shadow-deep max-w-sm`;
    
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    lucide.createIcons();
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Thiết lập photo upload
 */
function setupPhotoUpload() {
    document.querySelectorAll('.photo-upload').forEach((placeholder, index) => {
        placeholder.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        showNotification('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.', 'warning');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        placeholder.innerHTML = `
                            <img src="${event.target.result}" 
                                 alt="Uploaded photo ${index + 1}" 
                                 class="w-full h-full object-cover rounded-[16px] shadow-image">
                        `;
                        placeholder.classList.add('image-hover');
                        
                        // Add delete button
                        const deleteBtn = document.createElement('button');
                        deleteBtn.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i>';
                        deleteBtn.className = 'absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity';
                        deleteBtn.onclick = (e) => {
                            e.stopPropagation();
                            placeholder.innerHTML = `
                                <i data-lucide="plus" class="w-5 h-5 mr-1"></i>
                                Ảnh ${index + 1}
                            `;
                            placeholder.classList.remove('image-hover');
                            lucide.createIcons();
                        };
                        
                        placeholder.style.position = 'relative';
                        placeholder.appendChild(deleteBtn);
                        lucide.createIcons();
                        
                        showNotification('Đã tải ảnh lên thành công! 📸', 'success');
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
    });
}

/**
 * Thiết lập auto-save
 */
function setupAutoSave() {
    const textareas = document.querySelectorAll('textarea');
    const inputs = document.querySelectorAll('input[type="text"]');
    
    let saveTimeout;
    let isSaving = false;
    
    const autoSave = () => {
        if (isSaving) return;
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            const indicator = document.getElementById('save-status');
            if (indicator) {
                indicator.textContent = 'Đang lưu...';
                indicator.classList.add('text-blue-500');
                isSaving = true;
            }
            
            // Simulate save delay
            setTimeout(() => {
                if (indicator) {
                    indicator.textContent = 'Đã lưu tự động';
                    indicator.classList.remove('text-blue-500');
                    isSaving = false;
                }
            }, 500);
        }, 2000);
    };
    
    textareas.forEach(textarea => {
        textarea.addEventListener('input', autoSave);
    });
    
    inputs.forEach(input => {
        input.addEventListener('input', autoSave);
    });
}

/**
 * Load today's entry
 */
function loadTodayEntry() {
    const today = new Date();
    const dateString = today.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    document.getElementById('current-date').textContent = dateString;
    
    const entries = JSON.parse(localStorage.getItem(DATA_SOURCES.diaryEntries) || '[]');
    const todayEntry = entries.find(entry => entry.date === dateString);
    
    if (todayEntry) {
        // Auto-fill form with today's entry
        document.getElementById('achievements').value = todayEntry.achievements || '';
        document.getElementById('stress').value = todayEntry.stress || '';
        document.getElementById('gratitude1').value = todayEntry.gratitude1 || '';
        document.getElementById('gratitude2').value = todayEntry.gratitude2 || '';
        document.getElementById('gratitude3').value = todayEntry.gratitude3 || '';
        document.getElementById('highlight').value = todayEntry.highlight || '';
        document.getElementById('content').value = todayEntry.content || '';
        
        // Set mood
        const moodBtn = document.querySelector(`.mood-btn[data-mood="${todayEntry.mood}"]`);
        if (moodBtn) {
            moodBtn.click();
        }
        
        // Set self-care checkboxes
        todayEntry.selfCare?.forEach(item => {
            const checkbox = Array.from(document.querySelectorAll('.pastel-checkbox input'))
                .find(input => input.value === item);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        // Load photos
        if (todayEntry.photos && todayEntry.photos.length > 0) {
            const photoPlaceholders = document.querySelectorAll('.photo-upload');
            todayEntry.photos.slice(0, 3).forEach((photo, index) => {
                if (photoPlaceholders[index]) {
                    photoPlaceholders[index].innerHTML = `
                        <img src="${photo}" 
                             alt="Uploaded photo ${index + 1}" 
                             class="w-full h-full object-cover rounded-[16px] shadow-image">
                    `;
                    photoPlaceholders[index].classList.add('image-hover');
                }
            });
        }
        
        showNotification('Đã tải nhật ký hôm nay từ bộ nhớ', 'info');
    }
}

/**
 * Clear form
 */
function clearForm() {
    document.getElementById('achievements').value = '';
    document.getElementById('stress').value = '';
    document.getElementById('gratitude1').value = '';
    document.getElementById('gratitude2').value = '';
    document.getElementById('gratitude3').value = '';
    document.getElementById('highlight').value = '';
    document.getElementById('content').value = '';
    
    // Clear mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
        btn.classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
    });
    
    // Clear checkboxes
    document.querySelectorAll('.pastel-checkbox input').forEach(input => {
        input.checked = false;
    });
    
    // Clear photos
    document.querySelectorAll('.photo-upload').forEach(placeholder => {
        placeholder.innerHTML = `
            <i data-lucide="plus" class="w-5 h-5 mr-1"></i>
            Ảnh ${Array.from(document.querySelectorAll('.photo-upload')).indexOf(placeholder) + 1}
        `;
        placeholder.classList.remove('image-hover');
    });
    lucide.createIcons();
}

/**
 * Initialize app data
 */
export function initializeAppData() {
    // Initialize localStorage keys if they don't exist
    if (!localStorage.getItem(DATA_SOURCES.diaryEntries)) {
        localStorage.setItem(DATA_SOURCES.diaryEntries, JSON.stringify([]));
    }
    if (!localStorage.getItem(DATA_SOURCES.moments)) {
        localStorage.setItem(DATA_SOURCES.moments, JSON.stringify([]));
    }
    if (!localStorage.getItem(DATA_SOURCES.settings)) {
        localStorage.setItem(DATA_SOURCES.settings, JSON.stringify({
            theme: 'mint',
            notifications: true,
            autoSave: true,
            streak: 0
        }));
    }
    
    // Load current theme from settings
    const settings = JSON.parse(localStorage.getItem(DATA_SOURCES.settings));
    if (settings && settings.theme) {
        setTheme(settings.theme);
    }
    
    // Set current date
    const today = new Date();
    const dateString = today.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    document.getElementById('current-date').textContent = dateString;
    
    // Update streak counter
    updateStreakCounter();
    
    // Load today's entry if exists
    loadTodayEntry();
    
    // Initialize report stats
    updateReportStats();
}

// --- APP INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Initialize app data
    initializeAppData();
    
    // Set up theme
    const body = document.body;
    body.classList.forEach(cls => {
        if (cls.startsWith('theme-')) {
            APP_STATE.currentTheme = cls.substring(6);
        }
    });
    
    // Set initial view
    switchView(APP_STATE.currentView);
    
    // Set up event listeners
    setupMoodSelector();
    setupSelfCareChecklist();
    
    // Add photo upload functionality
    setupPhotoUpload();
    
    // Set up auto-save for textareas
    setupAutoSave();
    
    // Set up search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadTimelineEntries();
        });
    }
    
    // Add click outside to close theme panel
    document.addEventListener('click', (e) => {
        const themePanel = document.getElementById('theme-panel');
        const themeToggle = document.getElementById('theme-toggle');
        
        if (themePanel && !themePanel.contains(e.target) && 
            themeToggle && !themeToggle.contains(e.target) &&
            !themePanel.classList.contains('hidden')) {
            toggleThemePanel();
        }
    });
});