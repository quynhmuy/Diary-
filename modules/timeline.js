// modules/timeline.js (Optimized)
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';

export class TimelineManager {
    static loadTimelineEntries() {
        try {
            const timelineContainer = document.querySelector('.timeline-container');
            if (!timelineContainer) return;
            
            // Hiển thị loading
            const loadingElement = document.getElementById('timeline-loading');
            if (loadingElement) {
                loadingElement.classList.remove('hidden');
            }
            
            // Get all entries and moments
            const diaryEntries = StorageManager.get('diaryEntries', []);
            const moments = StorageManager.get('moments', []);
            
            // Combine entries - sử dụng concat thay vì spread operator cho hiệu suất
            let allEntries = diaryEntries.map(entry => ({ ...entry, type: 'entry' }))
                .concat(moments.map(moment => ({ ...moment, type: 'moment' })));
            
            // Sort by timestamp (newest first)
            allEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            // Apply filters
            allEntries = this.applyFilters(allEntries);
            
            // Clear existing items (except static items)
            const existingItems = timelineContainer.querySelectorAll('.timeline-item');
            const dynamicItems = Array.from(existingItems).slice(2); // Bỏ qua 2 phần tử đầu
            
            for (let i = 0; i < dynamicItems.length; i++) {
                dynamicItems[i].remove();
            }
            
            // Hiển thị timeline items container
            let timelineItemsContainer = document.getElementById('timeline-items-container');
            if (!timelineItemsContainer) {
                timelineItemsContainer = document.createElement('div');
                timelineItemsContainer.id = 'timeline-items-container';
                timelineContainer.appendChild(timelineItemsContainer);
            } else {
                timelineItemsContainer.innerHTML = '';
            }
            
            // Show loading if no entries
            if (allEntries.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'timeline-item text-center p-8 text-soft';
                emptyState.innerHTML = `
                    <i data-lucide="calendar" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                    <p>Chưa có dữ liệu để hiển thị</p>
                `;
                timelineItemsContainer.appendChild(emptyState);
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                
                // Ẩn loading
                if (loadingElement) {
                    loadingElement.classList.add('hidden');
                }
                return;
            }
            
            // Add entries to timeline với animation delay
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < allEntries.length; i++) {
                const entry = allEntries[i];
                const timelineItem = this.createTimelineItem(entry, i);
                timelineItem.style.animationDelay = `${i * 0.1}s`;
                fragment.appendChild(timelineItem);
            }
            
            timelineItemsContainer.appendChild(fragment);
            
            // Ẩn loading
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
            
            // Re-init icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
        } catch (error) {
            console.error("Lỗi khi tải timeline:", error);
            const loadingElement = document.getElementById('timeline-loading');
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        }
    }
    
    static applyFilters(entries) {
        // Get filter values
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        const moodFilter = document.getElementById('mood-filter');
        const moodValue = moodFilter ? moodFilter.value : '';
        
        const typeFilter = document.getElementById('type-filter');
        const typeValue = typeFilter ? typeFilter.value : '';
        
        // Nếu không có filter, trả về tất cả
        if (!searchTerm && !moodValue && !typeValue) {
            return entries;
        }
        
        const filtered = [];
        
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            let passed = true;
            
            // Search filter
            if (searchTerm) {
                let searchableText = '';
                if (entry.type === 'entry') {
                    searchableText = [
                        entry.content || '',
                        entry.achievements || '',
                        entry.stress || '',
                        entry.highlight || '',
                        entry.gratitude1 || '',
                        entry.gratitude2 || '',
                        entry.gratitude3 || ''
                    ].join(' ').toLowerCase();
                } else {
                    searchableText = [
                        entry.name || '',
                        entry.description || ''
                    ].join(' ').toLowerCase();
                }
                
                if (!searchableText.includes(searchTerm)) {
                    passed = false;
                }
            }
            
            // Mood filter
            if (passed && moodValue && entry.mood !== moodValue) {
                passed = false;
            }
            
            // Type filter
            if (passed && typeValue) {
                if (typeValue === 'entry' && entry.type !== 'entry') {
                    passed = false;
                }
                if (typeValue === 'moment' && entry.type !== 'moment') {
                    passed = false;
                }
            }
            
            if (passed) {
                filtered.push(entry);
            }
        }
        
        return filtered;
    }
    
    static createTimelineItem(entry, index) {
        const isDiaryEntry = entry.type === 'entry';
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        if (isDiaryEntry) {
            // Diary entry template
            const hasPhotos = entry.photos && entry.photos.length > 0;
            const hasSelfCare = entry.selfCare && entry.selfCare.length > 0;
            const hasGratitude = entry.gratitude1 || entry.gratitude2 || entry.gratitude3;
            
            let content = `
                <div class="bg-card p-6 rounded-card shadow-soft card-glow hover:transform hover:scale-[1.02] transition-all duration-300">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent-light text-accent mb-2">
                                <i data-lucide="book-open" class="w-3 h-3 inline mr-1"></i> Nhật ký
                            </span>
                            <h3 class="font-bold text-lg">${entry.date || 'Không có ngày'}</h3>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-3xl">${entry.mood || '😊'}</span>
                            <div class="flex space-x-2 mt-2">
                                <button onclick="editEntry('${entry.id}')" class="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition">
                                    <i data-lucide="edit" class="w-3 h-3 inline mr-1"></i>Sửa
                                </button>
                                <button onclick="deleteEntry('${entry.id}')" class="text-xs px-3 py-1 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition">
                                    <i data-lucide="trash-2" class="w-3 h-3 inline mr-1"></i>Xóa
                                </button>
                            </div>
                        </div>
                    </div>`;
            
            if (entry.highlight) {
                content += `
                    <div class="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                        <div class="flex items-center text-yellow-800 mb-1">
                            <i data-lucide="star" class="w-4 h-4 mr-2"></i>
                            <span class="font-semibold">Khoảnh khắc đẹp:</span>
                        </div>
                        <p class="text-sm">${entry.highlight}</p>
                    </div>`;
            }
            
            if (entry.achievements) {
                content += `
                    <div class="mb-3">
                        <span class="font-semibold text-accent">🎯 Thành tựu:</span>
                        <p class="text-sm mt-1">${entry.achievements}</p>
                    </div>`;
            }
            
            if (entry.stress) {
                content += `
                    <div class="mb-3">
                        <span class="font-semibold text-accent">⚠️ Căng thẳng:</span>
                        <p class="text-sm mt-1">${entry.stress}</p>
                    </div>`;
            }
            
            if (entry.content) {
                content += `
                    <div class="mb-3">
                        <span class="font-semibold text-accent">📝 Nội dung:</span>
                        <p class="text-sm mt-1 line-clamp-3">${entry.content}</p>
                    </div>`;
            }
            
            if (hasGratitude) {
                content += `
                    <div class="mb-3">
                        <span class="font-semibold text-accent">🙏 Biết ơn:</span>
                        <ul class="text-sm mt-1 space-y-1">`;
                
                if (entry.gratitude1) content += `<li>• ${entry.gratitude1}</li>`;
                if (entry.gratitude2) content += `<li>• ${entry.gratitude2}</li>`;
                if (entry.gratitude3) content += `<li>• ${entry.gratitude3}</li>`;
                
                content += `</ul></div>`;
            }
            
            if (hasSelfCare) {
                content += `
                    <div class="mt-4 pt-3 border-t border-gray-100">
                        <span class="font-semibold text-accent">💆‍♀️ Self-care:</span>
                        <div class="flex flex-wrap gap-1 mt-2">`;
                
                for (let i = 0; i < entry.selfCare.length; i++) {
                    content += `<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">${entry.selfCare[i]}</span>`;
                }
                
                content += `</div></div>`;
            }
            
            if (hasPhotos) {
                const photoCount = Math.min(entry.photos.length, 3);
                content += `
                    <div class="mt-4 pt-3 border-t border-gray-100">
                        <span class="font-semibold text-accent">📸 Ảnh:</span>
                        <div class="flex space-x-2 mt-2 overflow-x-auto">`;
                
                for (let i = 0; i < photoCount; i++) {
                    content += `<img src="${entry.photos[i]}" alt="Photo" class="w-20 h-20 object-cover rounded-lg flex-shrink-0">`;
                }
                
                content += `</div></div>`;
            }
            
            const timeString = entry.timestamp ? 
                new Date(entry.timestamp).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }) : 'Không có thời gian';
            
            content += `
                    <div class="mt-4 pt-3 border-t border-gray-100 text-xs text-soft">
                        <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                        ${timeString}
                    </div>
                </div>`;
            
            item.innerHTML = content;
        } else {
            // Moment template
            const timeString = entry.timestamp ? 
                new Date(entry.timestamp).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }) : 'Không có thời gian';
            
            const isHighlight = entry.type === 'highlight' ? ' • <span class="text-yellow-600">Từ highlight nhật ký</span>' : '';
            
            item.innerHTML = `
                <div class="bg-card p-6 rounded-card shadow-soft card-glow hover:transform hover:scale-[1.02] transition-all duration-300">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mb-2">
                                <i data-lucide="sparkles" class="w-3 h-3 inline mr-1"></i> Khoảnh khắc
                            </span>
                            <h3 class="font-bold text-lg">${entry.name || 'Không có tên'}</h3>
                            <p class="text-sm text-soft">${entry.date || 'Không có ngày'}</p>
                        </div>
                        <span class="text-3xl">${entry.mood || '⭐'}</span>
                    </div>
                    
                    ${entry.description ? `
                        <div class="mb-4">
                            <p class="text-sm">${entry.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="mt-4 pt-3 border-t border-gray-100 text-xs text-soft">
                        <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
                        ${timeString}${isHighlight}
                    </div>
                </div>
            `;
        }
        
        return item;
    }
    
    static clearFilters() {
        const searchInput = document.getElementById('search-input');
        const moodFilter = document.getElementById('mood-filter');
        const typeFilter = document.getElementById('type-filter');
        
        if (searchInput) searchInput.value = '';
        if (moodFilter) moodFilter.value = '';
        if (typeFilter) typeFilter.value = '';
        
        this.loadTimelineEntries();
        Utils.showNotification('Đã xóa tất cả bộ lọc', 'info');
    }
}