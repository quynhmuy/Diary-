// modules/reflection.js
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';

export class ReflectionManager {
    static saveReflection() {
        try {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            
            const reflectionData = {
                id: `reflection_${year}_${month}_${Math.random().toString(36).substr(2, 9)}`,
                month: month,
                year: year,
                learned: document.getElementById('learned')?.value.trim() || '',
                proudOf: document.getElementById('proud-of')?.value.trim() || '',
                improvement: document.getElementById('improvement')?.value.trim() || '',
                timestamp: today.getTime()
            };
            
            const key = `monthlyReflections_${year}_${month}`;
            StorageManager.set(key, reflectionData);
            
            Utils.showNotification('Reflection đã được lưu! 📝', 'success');
            
            return true;
        } catch (error) {
            console.error("Lỗi khi lưu reflection:", error);
            Utils.showNotification('Lỗi: Không thể lưu reflection', 'error');
            return false;
        }
    }
    
    static loadReflection() {
        try {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            
            const key = `monthlyReflections_${year}_${month}`;
            const data = StorageManager.get(key, {});
            
            const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                              'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
            const titleElement = document.querySelector('#reflection-page h1');
            if (titleElement) {
                titleElement.textContent = `Reflection ${monthNames[month-1]}`;
            }
            
            document.getElementById('learned').value = data.learned || '';
            document.getElementById('proud-of').value = data.proudOf || '';
            document.getElementById('improvement').value = data.improvement || '';
            
            return data;
        } catch (error) {
            console.error("Lỗi khi tải reflection:", error);
            return {};
        }
    }
}