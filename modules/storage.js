// modules/storage.js
export class StorageManager {
    static get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Lỗi khi đọc ${key}:`, error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Lỗi khi lưu ${key}:`, error);
            return false;
        }
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }

    static getAllData() {
        return {
            diaryEntries: this.get('diaryEntries', []),
            moments: this.get('moments', []),
            settings: this.get('diarySettings', {}),
            exportDate: new Date().toISOString()
        };
    }

    static initializeDefaults() {
        if (!this.get('diaryEntries')) this.set('diaryEntries', []);
        if (!this.get('moments')) this.set('moments', []);
        if (!this.get('diarySettings')) this.set('diarySettings', { theme: 'mint' });
    }
}