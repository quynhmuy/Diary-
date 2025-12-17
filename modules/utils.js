// modules/utils.js
import { StorageManager } from './storage.js';

export class Utils {
    static calculateStreak() {
        const entries = StorageManager.get('diaryEntries', []);
        if (entries.length === 0) return 0;
        
        const dateSet = new Set(entries.map(entry => entry.date));
        
        const dates = Array.from(dateSet).map(dateStr => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        }).sort((a, b) => b - a);
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < dates.length; i++) {
            const expected = new Date(today);
            expected.setDate(expected.getDate() - i);
            expected.setHours(0, 0, 0, 0);
            
            if (dates[i].getTime() === expected.getTime()) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    static updateStreakCounter() {
        const streak = this.calculateStreak();
        const streakElement = document.getElementById('streak-counter');
        if (streakElement) {
            streakElement.innerHTML = `🔥 ${streak} ngày liên tiếp`;
            
            if (streak > 0) {
                streakElement.classList.add('animate-pulse');
            }
        }
    }
    
    static setupPhotoUpload() {
        document.querySelectorAll('.photo-upload').forEach((placeholder, index) => {
            placeholder.onclick = null; // Remove old listener
            
            if (placeholder.querySelector('img')) return;
            
            placeholder.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = false;
                
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            placeholder.innerHTML = `
                                <img src="${event.target.result}" 
                                     alt="Uploaded photo ${index + 1}" 
                                     class="w-full h-full object-cover rounded-[16px] shadow-image">
                                <button class="delete-photo absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity">
                                    <i data-lucide="x" class="w-3 h-3"></i>
                                </button>
                            `;
                            placeholder.classList.add('image-hover', 'has-image');
                            
                            const deleteBtn = placeholder.querySelector('.delete-photo');
                            deleteBtn.onclick = (ev) => {
                                ev.stopPropagation();
                                placeholder.innerHTML = `
                                    <div class="w-full h-full flex flex-col items-center justify-center">
                                        <i data-lucide="plus" class="w-8 h-8 mb-1"></i>
                                        <span class="text-xs">Ảnh ${index + 1}</span>
                                    </div>
                                `;
                                placeholder.classList.remove('image-hover', 'has-image');
                                lucide?.createIcons();
                            };
                        };
                        reader.readAsDataURL(file);
                    }
                };
                
                input.click();
            });
        });
    }
    
    static exportData() {
        try {
            const allData = StorageManager.getAllData();
            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diary-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            Utils.showNotification('Dữ liệu đã được xuất thành công! 📥', 'success');
            
            return true;
        } catch (error) {
            console.error("Lỗi khi xuất dữ liệu:", error);
            Utils.showNotification('Lỗi: Không thể xuất dữ liệu', 'error');
            return false;
        }
    }
    
    static showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `p-4 rounded-lg shadow-lg mb-2 animate-slideInUp ${
            type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}