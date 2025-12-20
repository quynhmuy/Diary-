// modules/chart.js (Optimized)
import { StorageManager } from './storage.js';

const MOOD_VALUES = { '😢': 1, '😡': 2, '😴': 3, '😊': 4, '✨': 5 };
const MOOD_LABELS = { '😢': 'Buồn', '😡': 'Tức giận', '😴': 'Mệt mỏi', '😊': 'Vui vẻ', '✨': 'Tuyệt vời' };

const MOOD_COLORS = {
    '😊': '#AEE6E6',
    '😢': '#ADD8E6',
    '😡': '#FFC0CB',
    '😴': '#D8BFD8',
    '✨': '#7FC7C7'
};

export class ChartManager {
    static generateWeeklyData(entries) {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toLocaleDateString('vi-VN', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
            
            let entry = null;
            // Sử dụng for loop thay vì find để tối ưu
            for (let j = 0; j < entries.length; j++) {
                if (entries[j].date === dateStr) {
                    entry = entries[j];
                    break;
                }
            }

            data.push({
                day: days[date.getDay()],
                moodValue: entry ? MOOD_VALUES[entry.mood] || 3 : 0,
                mood: entry ? entry.mood : '',
                date: dateStr,
                hasEntry: !!entry
            });
        }
        return data;
    }

    static drawWeeklyChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = StorageManager.get('diaryEntries', []);
        const data = this.generateWeeklyData(entries);

        container.innerHTML = '';
        
        // Check if there are any entries this week
        let hasEntriesThisWeek = false;
        for (let i = 0; i < data.length; i++) {
            if (data[i].hasEntry) {
                hasEntriesThisWeek = true;
                break;
            }
        }
        
        if (!hasEntriesThisWeek) {
            container.innerHTML = `
                <div class="text-center text-soft p-8">
                    <i data-lucide="bar-chart" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                    <p>Chưa có dữ liệu tuần này</p>
                </div>`;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        // Tạo SVG với document fragment để tối ưu
        const fragment = document.createDocumentFragment();
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('viewBox', '0 0 500 300');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg').trim();
        const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim();
        const softTextColor = getComputedStyle(document.body).getPropertyValue('--text-soft').trim();

        // Draw bars
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const x = 80 + i * 60;
            const barHeight = item.hasEntry ? (item.moodValue / 5) * 180 : 10;
            const y = 240 - barHeight;

            // Bar
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute('x', (x - 20).toString());
            rect.setAttribute('y', y.toString());
            rect.setAttribute('width', '40');
            rect.setAttribute('height', barHeight.toString());
            rect.setAttribute('fill', item.hasEntry ? buttonColor : '#E5E7EB');
            rect.setAttribute('rx', '8');
            rect.setAttribute('opacity', item.hasEntry ? '0.8' : '0.3');
            
            // Day label
            const dayText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            dayText.setAttribute('x', x.toString());
            dayText.setAttribute('y', '270');
            dayText.setAttribute('text-anchor', 'middle');
            dayText.setAttribute('fill', softTextColor);
            dayText.setAttribute('font-weight', 'bold');
            dayText.textContent = item.day;

            svg.appendChild(rect);
            svg.appendChild(dayText);

            // Mood emoji (only if has entry)
            if (item.hasEntry && item.mood && item.moodValue > 0) {
                const moodText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                moodText.setAttribute('x', x.toString());
                moodText.setAttribute('y', (y - 10).toString());
                moodText.setAttribute('text-anchor', 'middle');
                moodText.setAttribute('fill', buttonColor);
                moodText.setAttribute('font-size', '20');
                moodText.textContent = item.mood;
                svg.appendChild(moodText);
            }
        }

        // Y-axis labels
        for (let i = 1; i <= 5; i++) {
            const y = 240 - (i / 5) * 180;
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute('x', '50');
            label.setAttribute('y', (y + 3).toString());
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('fill', softTextColor);
            label.setAttribute('font-size', '12');
            label.textContent = i.toString();
            svg.appendChild(label);
        }

        // Axes
        const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute('x1', '60');
        xAxis.setAttribute('y1', '240');
        xAxis.setAttribute('x2', '440');
        xAxis.setAttribute('y2', '240');
        xAxis.setAttribute('stroke', accentColor);
        xAxis.setAttribute('stroke-width', '2');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute('x1', '60');
        yAxis.setAttribute('y1', '60');
        yAxis.setAttribute('x2', '60');
        yAxis.setAttribute('y2', '240');
        yAxis.setAttribute('stroke', accentColor);
        yAxis.setAttribute('stroke-width', '2');
        svg.appendChild(yAxis);

        fragment.appendChild(svg);
        container.appendChild(fragment);
    }

    static generateMoodFrequencyData(entries) {
        const moodCounts = {
            '😢': 0,
            '😡': 0,
            '😴': 0,
            '😊': 0,
            '✨': 0
        };

        for (let i = 0; i < entries.length; i++) {
            const mood = entries[i].mood;
            if (moodCounts.hasOwnProperty(mood)) {
                moodCounts[mood]++;
            }
        }

        return moodCounts;
    }

    static drawPieChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = StorageManager.get('diaryEntries', []);
        const moodCounts = this.generateMoodFrequencyData(entries);
        
        let total = 0;
        const counts = Object.values(moodCounts);
        for (let i = 0; i < counts.length; i++) {
            total += counts[i];
        }

        container.innerHTML = '';

        if (total === 0) {
            container.innerHTML = `
                <div class="text-center text-soft p-8">
                    <i data-lucide="pie-chart" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                    <p>Chưa có dữ liệu</p>
                </div>`;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        const fragment = document.createDocumentFragment();
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '200');
        svg.setAttribute('class', 'mx-auto');

        const centerX = 100;
        const centerY = 100;
        const radius = 80;

        let cumulativeAngle = 0;
        const moodEntries = Object.entries(moodCounts);
        
        // Draw pie slices
        for (let i = 0; i < moodEntries.length; i++) {
            const [mood, count] = moodEntries[i];
            if (count > 0) {
                const percentage = (count / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = cumulativeAngle;
                const endAngle = startAngle + angle;
                
                // Convert to radians
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                // Calculate arc points
                const x1 = centerX + radius * Math.cos(startRad);
                const y1 = centerY + radius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(endRad);
                const y2 = centerY + radius * Math.sin(endRad);
                
                // Create path
                const largeArcFlag = angle > 180 ? 1 : 0;
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                
                path.setAttribute('d', `
                    M ${centerX} ${centerY}
                    L ${x1} ${y1}
                    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                    Z
                `);
                
                path.setAttribute('fill', MOOD_COLORS[mood]);
                path.setAttribute('stroke', 'white');
                path.setAttribute('stroke-width', '2');
                
                svg.appendChild(path);
                cumulativeAngle += angle;
            }
        }

        // Add center circle
        const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        centerCircle.setAttribute('cx', centerX.toString());
        centerCircle.setAttribute('cy', centerY.toString());
        centerCircle.setAttribute('r', (radius * 0.3).toString());
        centerCircle.setAttribute('fill', 'white');
        svg.appendChild(centerCircle);

        fragment.appendChild(svg);
        container.appendChild(fragment);
        
        // Create legend
        const legend = document.createElement('div');
        legend.className = 'mt-6 flex flex-col gap-2';
        
        for (let i = 0; i < moodEntries.length; i++) {
            const [mood, count] = moodEntries[i];
            if (count > 0) {
                const percentage = Math.round((count / total) * 100);
                const legendItem = document.createElement('div');
                legendItem.className = 'flex items-center justify-between';
                legendItem.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <span class="w-4 h-4 rounded-full" style="background-color: ${MOOD_COLORS[mood]}"></span>
                        <span class="text-sm">${mood} ${MOOD_LABELS[mood]}</span>
                    </div>
                    <div class="text-sm font-semibold">${percentage}% (${count})</div>
                `;
                legend.appendChild(legendItem);
            }
        }
        
        container.appendChild(legend);
    }

    static updateReportStats() {
        const entries = StorageManager.get('diaryEntries', []);
        
        if (entries.length === 0) {
            this.setEmptyStats();
            return;
        }

        // Pre-calculate values
        let mostPositive = { moodValue: 0, date: '--/--/----', mood: '✨' };
        let mostStressful = { moodValue: 6, date: '--/--/----', mood: '😡' };
        let totalChecklistItems = 0;
        let completedChecklistItems = 0;
        let totalChars = 0;
        let positiveEntries = 0;
        
        const moodCounts = {
            '😢': 0, '😡': 0, '😴': 0, '😊': 0, '✨': 0
        };
        
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const moodValue = MOOD_VALUES[entry.mood] || 3;
            
            // Update most positive/stressful
            if (moodValue > mostPositive.moodValue) {
                mostPositive = { moodValue, date: entry.date, mood: entry.mood };
            }
            if (moodValue < mostStressful.moodValue) {
                mostStressful = { moodValue, date: entry.date, mood: entry.mood };
            }
            
            // Count positive entries
            if (entry.mood === '😊' || entry.mood === '✨') {
                positiveEntries++;
            }
            
            // Checklist items
            totalChecklistItems += 6;
            completedChecklistItems += entry.selfCare?.length || 0;
            
            // Character count
            totalChars += entry.content?.length || 0;
            
            // Mood frequency
            if (moodCounts.hasOwnProperty(entry.mood)) {
                moodCounts[entry.mood]++;
            }
        }

        // Update DOM elements
        this.setText('most-positive-day', mostPositive.date || '--/--/----');
        this.setText('most-positive-mood', mostPositive.mood || '✨');
        this.setText('stressful-day', mostStressful.date || '--/--/----');
        this.setText('most-stressful-mood', mostStressful.mood || '😡');
        this.setText('days-written', entries.length.toString());

        // Positive rate
        const positiveRate = Math.round((positiveEntries / entries.length) * 100);
        this.setText('positive-rate', `${positiveRate}%`);

        // Checklist percentage
        const checklistPercentage = totalChecklistItems > 0 
            ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
            : 0;
        this.setText('checklist-completed', `${checklistPercentage}%`);

        // Average writing time
        const avgCharsPerEntry = entries.length > 0 ? totalChars / entries.length : 0;
        const avgMinutes = Math.max(1, Math.round(avgCharsPerEntry / 50));
        this.setText('avg-time', `${avgMinutes} phút`);

        // Most frequent mood
        let mostFrequentMood = '😊';
        let maxCount = 0;
        let totalCount = 0;
        
        const moodEntries = Object.entries(moodCounts);
        for (let i = 0; i < moodEntries.length; i++) {
            const [mood, count] = moodEntries[i];
            totalCount += count;
            if (count > maxCount) {
                maxCount = count;
                mostFrequentMood = mood;
            }
        }
        
        if (totalCount > 0) {
            const percentage = Math.round((maxCount / totalCount) * 100);
            this.setText('most-frequent-mood', mostFrequentMood);
            this.setText('mood-percentage', `${percentage}%`);
        } else {
            this.setText('most-frequent-mood', '😊');
            this.setText('mood-percentage', '0%');
        }
    }

    static setEmptyStats() {
        const elements = {
            'most-positive-day': '--/--/----',
            'most-positive-mood': '✨',
            'stressful-day': '--/--/----',
            'most-stressful-mood': '😡',
            'days-written': '0',
            'positive-rate': '0%',
            'checklist-completed': '0%',
            'avg-time': '0 phút',
            'most-frequent-mood': '😊',
            'mood-percentage': '0%'
        };
        
        for (const [id, text] of Object.entries(elements)) {
            this.setText(id, text);
        }
    }

    static setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    static drawCharts() {
        this.drawWeeklyChart('weekly-chart');
        this.drawPieChart('pie-chart');
        this.updateReportStats();
    }
}