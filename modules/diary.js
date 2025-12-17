// modules/diary.js
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';

export class DiaryManager {
    static saveDailyEntry() {
        const today = new Date();
        const dateString = today.toLocaleDateString('vi-VN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });

        const dateElement = document.getElementById('current-date');
        if (dateElement) dateElement.textContent = dateString;

        const selectedMoodBtn = document.querySelector('.mood-btn.ring-4');
        const mood = selectedMoodBtn ? selectedMoodBtn.dataset.mood : '😊';

        const entry = {
            id: `entry_${today.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
            date: dateString,
            mood: mood,
            achievements: document.getElementById('achievements')?.value.trim() || '',
            stress: document.getElementById('stress')?.value.trim() || '',
            gratitude1: document.getElementById('gratitude1')?.value.trim() || '',
            gratitude2: document.getElementById('gratitude2')?.value.trim() || '',
            gratitude3: document.getElementById('gratitude3')?.value.trim() || '',
            selfCare: Array.from(document.querySelectorAll('.pastel-checkbox input:checked')).map(input => input.value),
            highlight: document.getElementById('highlight')?.value.trim() || '',
            photos: Array.from(document.querySelectorAll('.photo-upload img'))
                .map(img => img.src)
                .filter(src => !src.includes('plus') && !src.includes('data:image/svg+xml')),
            content: document.getElementById('content')?.value.trim() || '',
            timestamp: today.getTime(),
            theme: document.body.className.match(/theme-(\w+)/)?.[1] || 'mint'
        };

        if (!entry.content || entry.content.trim().length < 5) {
            Utils.showNotification('Vui lòng viết nội dung nhật ký (ít nhất 5 ký tự)', 'warning');
            document.getElementById('content')?.focus();
            return false;
        }

        try {
            let entries = StorageManager.get('diaryEntries', []);
            
            const existingIndex = entries.findIndex(e => e.date === dateString);
            
            if (existingIndex >= 0) {
                // Update existing entry
                entries[existingIndex] = entry;
                Utils.showNotification('Đã cập nhật nhật ký hôm nay! ✨', 'success');
            } else {
                // Add new entry
                entries.unshift(entry);
                Utils.showNotification('Nhật ký đã được lưu thành công! ✨', 'success');
            }
            
            StorageManager.set('diaryEntries', entries);
            
            // Save highlight as moment if exists
            if (entry.highlight && entry.highlight.trim().length > 0) {
                this.saveHighlightAsMoment(entry);
            }
            
            // Success animation
            const saveBtn = document.querySelector('#diary-page button');
            if (saveBtn) {
                saveBtn.classList.add('success-pulse');
                setTimeout(() => saveBtn.classList.remove('success-pulse'), 2000);
            }
            
            // Reload timeline if on timeline view
            if (typeof window.APP_STATE !== 'undefined' && window.APP_STATE.currentView === 'timeline') {
                setTimeout(() => {
                    if (typeof window.TimelineManager !== 'undefined') {
                        window.TimelineManager.loadTimelineEntries();
                    }
                }, 500);
            }
            
            // Reset form sau khi lưu thành công
            this.resetForm();
            
            // Update streak counter
            if (typeof window.Utils !== 'undefined') {
                window.Utils.updateStreakCounter();
            }
            
            return true;
        } catch (error) {
            console.error("Lỗi khi lưu entry:", error);
            Utils.showNotification('Lỗi: Không thể lưu nhật ký', 'error');
            return false;
        }
    }

    static saveHighlightAsMoment(entry) {
        const momentData = {
            id: `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: entry.highlight.substring(0, 50),
            description: `Từ nhật ký ngày ${entry.date}: ${entry.content.substring(0, 100)}...`,
            date: entry.date,
            mood: entry.mood,
            type: 'highlight',
            timestamp: entry.timestamp
        };
        
        let moments = StorageManager.get('moments', []);
        moments.unshift(momentData);
        StorageManager.set('moments', moments);
    }

    static resetForm() {
        // Reset tất cả các trường nhập liệu
        const fields = ['achievements', 'stress', 'gratitude1', 'gratitude2', 'gratitude3', 'highlight', 'content'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        // Reset mood selector
        const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.style.backgroundColor = accentLightColor;
            btn.classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
        });
        
        // Set default mood
        const defaultMoodBtn = document.querySelector('.mood-btn[data-mood="😊"]');
        if (defaultMoodBtn) {
            const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
            defaultMoodBtn.style.backgroundColor = buttonColor;
            defaultMoodBtn.classList.add('ring-4', 'ring-offset-2', 'ring-accent-light/50');
        }
        
        // Reset checkboxes
        document.querySelectorAll('.pastel-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset photos
        document.querySelectorAll('.photo-upload').forEach((placeholder, index) => {
            placeholder.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center">
                    <i data-lucide="plus" class="w-8 h-8 mb-1"></i>
                    <span class="text-xs">Ảnh ${index + 1}</span>
                </div>
            `;
            placeholder.classList.remove('image-hover', 'has-image');
        });
        
        // Cập nhật trạng thái auto-save
        const indicator = document.getElementById('save-status');
        if (indicator) {
            indicator.textContent = 'Sẵn sàng cho ngày mới!';
            indicator.classList.add('text-green-500');
            setTimeout(() => {
                indicator.classList.remove('text-green-500');
                indicator.textContent = 'Đã lưu tự động';
            }, 2000);
        }
        
        // Focus vào ô nội dung để dễ viết tiếp
        setTimeout(() => {
            document.getElementById('content')?.focus();
        }, 300);
        
        // Re-init Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Re-init photo upload
        setTimeout(() => {
            Utils.setupPhotoUpload();
        }, 100);
    }

    static loadTodayEntry() {
        const today = new Date();
        const dateString = today.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const dateElement = document.getElementById('current-date');
        if (dateElement) dateElement.textContent = dateString;
        
        const entries = StorageManager.get('diaryEntries', []);
        const todayEntry = entries.find(entry => entry.date === dateString);
        
        if (todayEntry) {
            // Populate fields
            const fields = {
                'achievements': todayEntry.achievements || '',
                'stress': todayEntry.stress || '',
                'gratitude1': todayEntry.gratitude1 || '',
                'gratitude2': todayEntry.gratitude2 || '',
                'gratitude3': todayEntry.gratitude3 || '',
                'highlight': todayEntry.highlight || '',
                'content': todayEntry.content || ''
            };
            
            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });

            // Set mood
            const moodBtn = document.querySelector(`.mood-btn[data-mood="${todayEntry.mood}"]`);
            if (moodBtn) {
                const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
                const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
                
                document.querySelectorAll('.mood-btn').forEach(btn => {
                    btn.style.backgroundColor = accentLightColor;
                    btn.classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
                });
                
                moodBtn.style.backgroundColor = buttonColor;
                moodBtn.classList.add('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            }
            
            // Set self-care checkboxes
            if (todayEntry.selfCare) {
                document.querySelectorAll('.pastel-checkbox input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = todayEntry.selfCare.includes(checkbox.value);
                });
            }
            
            // Load photos
            if (todayEntry.photos && todayEntry.photos.length > 0) {
                const photoPlaceholders = document.querySelectorAll('.photo-upload');
                todayEntry.photos.slice(0, 3).forEach((photo, index) => {
                    if (photoPlaceholders[index]) {
                        photoPlaceholders[index].innerHTML = `
                            <img src="${photo}" 
                                 alt="Uploaded photo ${index + 1}" 
                                 class="w-full h-full object-cover rounded-[16px] shadow-image">
                            <button class="delete-photo absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity">
                                <i data-lucide="x" class="w-3 h-3"></i>
                            </button>
                        `;
                        photoPlaceholders[index].classList.add('image-hover', 'has-image');
                        
                        // Add delete functionality
                        const deleteBtn = photoPlaceholders[index].querySelector('.delete-photo');
                        if (deleteBtn) {
                            deleteBtn.onclick = (e) => {
                                e.stopPropagation();
                                const initialHTML = `
                                    <div class="w-full h-full flex flex-col items-center justify-center">
                                        <i data-lucide="plus" class="w-8 h-8 mb-1"></i>
                                        <span class="text-xs">Ảnh ${index + 1}</span>
                                    </div>
                                `;
                                photoPlaceholders[index].innerHTML = initialHTML;
                                photoPlaceholders[index].classList.remove('image-hover', 'has-image');
                                if (typeof lucide !== 'undefined') {
                                    lucide.createIcons();
                                }
                            };
                        }
                    }
                });
            }
        } else {
            // Nếu không có entry hôm nay, reset form với mood mặc định
            this.resetFormForNewDay();
        }
        
        // Re-init photo upload for empty placeholders
        setTimeout(() => {
            Utils.setupPhotoUpload();
        }, 100);
    }

    static resetFormForNewDay() {
        // Reset các trường
        const fields = ['achievements', 'stress', 'gratitude1', 'gratitude2', 'gratitude3', 'highlight', 'content'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        // Reset checkboxes
        document.querySelectorAll('.pastel-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset photos
        document.querySelectorAll('.photo-upload').forEach((placeholder, index) => {
            placeholder.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center">
                    <i data-lucide="plus" class="w-8 h-8 mb-1"></i>
                    <span class="text-xs">Ảnh ${index + 1}</span>
                </div>
            `;
            placeholder.classList.remove('image-hover', 'has-image');
        });
        
        // Set mood mặc định là vui vẻ (😊)
        const defaultMoodBtn = document.querySelector('.mood-btn[data-mood="😊"]');
        if (defaultMoodBtn) {
            const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
            const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
            
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.style.backgroundColor = accentLightColor;
                btn.classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            });
            
            defaultMoodBtn.style.backgroundColor = buttonColor;
            defaultMoodBtn.classList.add('ring-4', 'ring-offset-2', 'ring-accent-light/50');
        }
        
        // Cập nhật trạng thái auto-save
        const indicator = document.getElementById('save-status');
        if (indicator) {
            indicator.textContent = 'Sẵn sàng viết nhật ký!';
            indicator.classList.add('text-blue-500');
            setTimeout(() => {
                indicator.classList.remove('text-blue-500');
                indicator.textContent = 'Đã lưu tự động';
            }, 2000);
        }
        
        // Focus vào ô nội dung
        setTimeout(() => {
            document.getElementById('content')?.focus();
        }, 300);
        
        // Re-init Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Phương thức mới: Xóa nhật ký
    static deleteEntry(entryId) {
        try {
            let entries = StorageManager.get('diaryEntries', []);
            const initialLength = entries.length;
            
            entries = entries.filter(entry => entry.id !== entryId);
            
            if (entries.length < initialLength) {
                StorageManager.set('diaryEntries', entries);
                
                // Nếu đang xem timeline, reload
                if (typeof window.APP_STATE !== 'undefined' && window.APP_STATE.currentView === 'timeline') {
                    setTimeout(() => {
                        if (typeof window.TimelineManager !== 'undefined') {
                            window.TimelineManager.loadTimelineEntries();
                        }
                    }, 100);
                }
                
                // Nếu đang xem báo cáo, refresh
                if (typeof window.APP_STATE !== 'undefined' && window.APP_STATE.currentView === 'report') {
                    setTimeout(() => {
                        if (typeof window.ChartManager !== 'undefined') {
                            window.ChartManager.drawCharts();
                        }
                    }, 100);
                }
                
                Utils.showNotification('Đã xóa nhật ký thành công', 'success');
                return true;
            } else {
                Utils.showNotification('Không tìm thấy nhật ký để xóa', 'error');
                return false;
            }
        } catch (error) {
            console.error("Lỗi khi xóa entry:", error);
            Utils.showNotification('Lỗi: Không thể xóa nhật ký', 'error');
            return false;
        }
    }

    // Phương thức mới: Tải entry để chỉnh sửa
    static loadEntryForEdit(entryId) {
        try {
            const entries = StorageManager.get('diaryEntries', []);
            const entry = entries.find(e => e.id === entryId);
            
            if (!entry) {
                Utils.showNotification('Không tìm thấy nhật ký', 'error');
                return false;
            }
            
            // Chuyển sang trang nhật ký
            if (typeof window.switchView !== 'undefined') {
                window.switchView('diary');
            }
            
            // Cập nhật ngày
            const dateElement = document.getElementById('current-date');
            if (dateElement) dateElement.textContent = entry.date;
            
            // Populate fields
            const fields = {
                'achievements': entry.achievements || '',
                'stress': entry.stress || '',
                'gratitude1': entry.gratitude1 || '',
                'gratitude2': entry.gratitude2 || '',
                'gratitude3': entry.gratitude3 || '',
                'highlight': entry.highlight || '',
                'content': entry.content || ''
            };
            
            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });

            // Set mood
            const moodBtn = document.querySelector(`.mood-btn[data-mood="${entry.mood}"]`);
            if (moodBtn) {
                const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg');
                const accentLightColor = getComputedStyle(document.body).getPropertyValue('--accent-light');
                
                document.querySelectorAll('.mood-btn').forEach(btn => {
                    btn.style.backgroundColor = accentLightColor;
                    btn.classList.remove('ring-4', 'ring-offset-2', 'ring-accent-light/50');
                });
                
                moodBtn.style.backgroundColor = buttonColor;
                moodBtn.classList.add('ring-4', 'ring-offset-2', 'ring-accent-light/50');
            }
            
            // Set self-care checkboxes
            document.querySelectorAll('.pastel-checkbox input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = entry.selfCare?.includes(checkbox.value) || false;
            });
            
            // Load photos
            document.querySelectorAll('.photo-upload').forEach((placeholder, index) => {
                placeholder.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center">
                        <i data-lucide="plus" class="w-8 h-8 mb-1"></i>
                        <span class="text-xs">Ảnh ${index + 1}</span>
                    </div>
                `;
                placeholder.classList.remove('image-hover', 'has-image');
            });
            
            if (entry.photos && entry.photos.length > 0) {
                const photoPlaceholders = document.querySelectorAll('.photo-upload');
                entry.photos.slice(0, 3).forEach((photo, index) => {
                    if (photoPlaceholders[index]) {
                        photoPlaceholders[index].innerHTML = `
                            <img src="${photo}" 
                                 alt="Uploaded photo ${index + 1}" 
                                 class="w-full h-full object-cover rounded-[16px] shadow-image">
                            <button class="delete-photo absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity">
                                <i data-lucide="x" class="w-3 h-3"></i>
                            </button>
                        `;
                        photoPlaceholders[index].classList.add('image-hover', 'has-image');
                        
                        // Add delete functionality
                        const deleteBtn = photoPlaceholders[index].querySelector('.delete-photo');
                        if (deleteBtn) {
                            deleteBtn.onclick = (e) => {
                                e.stopPropagation();
                                const initialHTML = `
                                    <div class="w-full h-full flex flex-col items-center justify-center">
                                        <i data-lucide="plus" class="w-8 h-8 mb-1"></i>
                                        <span class="text-xs">Ảnh ${index + 1}</span>
                                    </div>
                                `;
                                photoPlaceholders[index].innerHTML = initialHTML;
                                photoPlaceholders[index].classList.remove('image-hover', 'has-image');
                                if (typeof lucide !== 'undefined') {
                                    lucide.createIcons();
                                }
                            };
                        }
                    }
                });
            }
            
            // Cập nhật trạng thái auto-save
            const indicator = document.getElementById('save-status');
            if (indicator) {
                indicator.textContent = 'Đang chỉnh sửa nhật ký cũ';
                indicator.classList.add('text-yellow-500');
            }
            
            // Focus vào ô nội dung
            setTimeout(() => {
                document.getElementById('content')?.focus();
            }, 300);
            
            // Re-init photo upload for empty placeholders
            setTimeout(() => {
                Utils.setupPhotoUpload();
            }, 100);
            
            return true;
            
        } catch (error) {
            console.error("Lỗi khi tải entry để chỉnh sửa:", error);
            Utils.showNotification('Lỗi: Không thể tải nhật ký', 'error');
            return false;
        }
    }
}