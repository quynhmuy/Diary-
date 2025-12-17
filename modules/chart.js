// modules/chart.js
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

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('vi-VN', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
            const entry = entries.find(e => e.date === dateStr);

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
        const hasEntriesThisWeek = data.some(d => d.hasEntry);
        
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

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('viewBox', '0 0 500 300');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        const buttonColor = getComputedStyle(document.body).getPropertyValue('--button-bg').trim();
        const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim();
        const softTextColor = getComputedStyle(document.body).getPropertyValue('--text-soft').trim();

        data.forEach((item, index) => {
            const x = 80 + index * 60;
            const barHeight = item.hasEntry ? (item.moodValue / 5) * 180 : 10;
            const y = 240 - barHeight;

            // Bar
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute('x', x - 20);
            rect.setAttribute('y', y);
            rect.setAttribute('width', '40');
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', item.hasEntry ? buttonColor : '#E5E7EB');
            rect.setAttribute('rx', '8');
            rect.setAttribute('opacity', item.hasEntry ? '0.8' : '0.3');
            rect.style.transition = 'all 0.3s ease';
            
            // Add hover effect
            rect.addEventListener('mouseenter', () => {
                rect.setAttribute('opacity', '1');
            });
            rect.addEventListener('mouseleave', () => {
                rect.setAttribute('opacity', item.hasEntry ? '0.8' : '0.3');
            });
            
            svg.appendChild(rect);

            // Day label
            const dayText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            dayText.setAttribute('x', x);
            dayText.setAttribute('y', '270');
            dayText.setAttribute('text-anchor', 'middle');
            dayText.setAttribute('fill', softTextColor);
            dayText.setAttribute('font-weight', 'bold');
            dayText.textContent = item.day;
            svg.appendChild(dayText);

            // Mood emoji (only if has entry)
            if (item.hasEntry && item.mood && item.moodValue > 0) {
                const moodText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                moodText.setAttribute('x', x);
                moodText.setAttribute('y', y - 10);
                moodText.setAttribute('text-anchor', 'middle');
                moodText.setAttribute('fill', buttonColor);
                moodText.setAttribute('font-size', '20');
                moodText.textContent = item.mood;
                svg.appendChild(moodText);
            }
        });

        // Y-axis labels
        for (let i = 1; i <= 5; i++) {
            const y = 240 - (i / 5) * 180;
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute('x', '50');
            label.setAttribute('y', y + 3);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('fill', softTextColor);
            label.setAttribute('font-size', '12');
            label.textContent = i;
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

        container.appendChild(svg);
    }

    static generateMoodFrequencyData(entries) {
        const moodCounts = {
            '😢': 0,
            '😡': 0,
            '😴': 0,
            '😊': 0,
            '✨': 0
        };

        entries.forEach(entry => {
            if (moodCounts.hasOwnProperty(entry.mood)) {
                moodCounts[entry.mood]++;
            }
        });

        return moodCounts;
    }

    static drawPieChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = StorageManager.get('diaryEntries', []);
        const moodCounts = this.generateMoodFrequencyData(entries);
        const total = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);

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

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '200');
        svg.setAttribute('class', 'mx-auto');

        const centerX = 100;
        const centerY = 100;
        const radius = 80;

        let cumulativeAngle = 0;
        const percentages = {};
        
        Object.entries(moodCounts).forEach(([mood, count]) => {
            if (count > 0) {
                percentages[mood] = (count / total) * 100;
            }
        });

        Object.entries(percentages).forEach(([mood, percentage]) => {
            if (percentage > 0) {
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
        });

        // Add center circle
        const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        centerCircle.setAttribute('cx', centerX);
        centerCircle.setAttribute('cy', centerY);
        centerCircle.setAttribute('r', radius * 0.3);
        centerCircle.setAttribute('fill', 'white');
        svg.appendChild(centerCircle);

        // Add total count in center
        const totalText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        totalText.setAttribute('x', centerX);
        totalText.setAttribute('y', centerY);
        totalText.setAttribute('text-anchor', 'middle');
        totalText.setAttribute('dy', '5');
        totalText.setAttribute('font-weight', 'bold');
        totalText.setAttribute('fill', getComputedStyle(document.body).getPropertyValue('--accent').trim());
        totalText.textContent = total;
        svg.appendChild(totalText);

        const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelText.setAttribute('x', centerX);
        labelText.setAttribute('y', centerY + 15);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('font-size', '10');
        labelText.setAttribute('fill', getComputedStyle(document.body).getPropertyValue('--text-soft').trim());
        labelText.textContent = 'mục';
        svg.appendChild(labelText);

        container.appendChild(svg);
        
        // Create legend
        const legend = document.createElement('div');
        legend.className = 'mt-6 flex flex-col gap-2';
        
        Object.entries(percentages).forEach(([mood, percentage]) => {
            if (percentage > 0) {
                const count = moodCounts[mood];
                const legendItem = document.createElement('div');
                legendItem.className = 'flex items-center justify-between';
                legendItem.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <span class="w-4 h-4 rounded-full" style="background-color: ${MOOD_COLORS[mood]}"></span>
                        <span class="text-sm">${mood} ${MOOD_LABELS[mood]}</span>
                    </div>
                    <div class="text-sm font-semibold">${Math.round(percentage)}% (${count})</div>
                `;
                legend.appendChild(legendItem);
            }
        });
        
        container.appendChild(legend);
    }

    static updateReportStats() {
        const entries = StorageManager.get('diaryEntries', []);
        
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        if (entries.length === 0) {
            setText('most-positive-day', '--/--/----');
            setText('stressful-day', '--/--/----');
            setText('days-written', '0');
            setText('positive-rate', '0%');
            setText('checklist-completed', '0%');
            setText('avg-time', '0 phút');
            setText('most-frequent-mood', '😊');
            setText('mood-percentage', '0%');
            setText('most-positive-mood', '✨');
            setText('most-stressful-mood', '😡');
            return;
        }

        // Tính toán các thống kê
        const moodValues = entries.map(e => ({
            date: e.date,
            mood: e.mood,
            moodValue: MOOD_VALUES[e.mood] || 3,
            contentLength: e.content?.length || 0
        }));

        // Ngày tích cực nhất (mood value cao nhất)
        const mostPositive = moodValues.reduce((max, curr) => 
            curr.moodValue > max.moodValue ? curr : max, 
            {moodValue: 0, date: '--/--/----', mood: '✨'}
        );

        // Ngày stress nhất (mood value thấp nhất)
        const mostStressful = moodValues.reduce((min, curr) => 
            curr.moodValue < min.moodValue ? curr : min, 
            {moodValue: 6, date: '--/--/----', mood: '😡'}
        );

        // Cập nhật các thống kê
        setText('most-positive-day', mostPositive.date || '--/--/----');
        setText('most-positive-mood', mostPositive.mood || '✨');
        setText('stressful-day', mostStressful.date || '--/--/----');
        setText('most-stressful-mood', mostStressful.mood || '😡');
        setText('days-written', entries.length);

        // Tỉ lệ tích cực
        const positiveEntries = entries.filter(e => e.mood === '😊' || e.mood === '✨').length;
        setText('positive-rate', `${Math.round((positiveEntries / entries.length) * 100)}%`);

        // Checklist hoàn thành
        let totalChecklistItems = 0;
        let completedChecklistItems = 0;
        
        entries.forEach(e => {
            totalChecklistItems += 6; // 6 items trong checklist
            completedChecklistItems += e.selfCare?.length || 0;
        });
        
        const checklistPercentage = totalChecklistItems > 0 
            ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
            : 0;
        setText('checklist-completed', `${checklistPercentage}%`);

        // Thời gian viết trung bình (ước tính)
        const totalChars = entries.reduce((sum, e) => sum + (e.content?.length || 0), 0);
        const avgCharsPerEntry = entries.length > 0 ? totalChars / entries.length : 0;
        // Ước tính: 50 ký tự = 1 phút viết
        const avgMinutes = Math.max(1, Math.round(avgCharsPerEntry / 50));
        setText('avg-time', `${avgMinutes} phút`);

        // Tần suất mood phổ biến nhất
        const moodCounts = this.generateMoodFrequencyData(entries);
        const totalCount = Object.values(moodCounts).reduce((a, b) => a + b, 0);
        
        if (totalCount > 0) {
            const mostFrequent = Object.entries(moodCounts).reduce((a, b) => 
                a[1] > b[1] ? a : b
            );
            const percentage = Math.round((mostFrequent[1] / totalCount) * 100);
            
            setText('most-frequent-mood', mostFrequent[0]);
            setText('mood-percentage', `${percentage}%`);
        } else {
            setText('most-frequent-mood', '😊');
            setText('mood-percentage', '0%');
        }
    }

    static drawCharts() {
        this.drawWeeklyChart('weekly-chart');
        this.drawPieChart('pie-chart');
        this.updateReportStats();
    }
}