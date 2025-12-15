// reportChart.js
import { APP_STATE } from './app.js'; 

// Hàm vẽ biểu đồ
export function drawCharts() {
    const weeklyCtx = document.getElementById('weekly-chart');
    const pieCtx = document.getElementById('pie-chart');

    if (!weeklyCtx || !pieCtx) return;

    // Clear previous content
    weeklyCtx.innerHTML = '';
    pieCtx.innerHTML = '';

    // Lấy màu từ biến CSS
    const rootStyle = getComputedStyle(document.documentElement);
    const accentColor = rootStyle.getPropertyValue('--accent').trim();
    const buttonColor = rootStyle.getPropertyValue('--button-bg').trim();
    const softTextColor = rootStyle.getPropertyValue('--text-soft').trim();
    const cardColor = rootStyle.getPropertyValue('--card').trim();

    // Get actual data from localStorage
    const entries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    
    // Generate weekly data (last 7 days)
    const weeklyData = generateWeeklyData(entries);
    
    // Generate mood frequency data
    const moodFrequencyData = generateMoodFrequencyData(entries);

    // --- Draw Weekly Mood Bar Chart (Simple SVG) ---
    const weeklyChartSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    weeklyChartSVG.setAttribute('viewBox', '0 0 400 250');
    weeklyChartSVG.setAttribute('width', '100%');
    weeklyChartSVG.setAttribute('height', '100%');

    const maxMood = 5;
    const barWidth = 30;
    const gap = 20;
    const startX = 20;
    const chartHeight = 200;
    
    weeklyData.forEach((item, index) => {
        const height = (item.mood / maxMood) * chartHeight;
        const x = startX + index * (barWidth + gap);
        const y = chartHeight - height;

        // Bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', buttonColor);
        rect.setAttribute('rx', '5'); // rounded corners for bars
        rect.style.opacity = item.mood / maxMood;

        // Label (Day)
        const textDay = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textDay.setAttribute('x', x + barWidth / 2);
        textDay.setAttribute('y', chartHeight + 15);
        textDay.setAttribute('text-anchor', 'middle');
        textDay.setAttribute('fill', softTextColor);
        textDay.style.fontSize = '12px';
        textDay.textContent = item.day;

        weeklyChartSVG.appendChild(rect);
        weeklyChartSVG.appendChild(textDay);
    });
    
    // Y-Axis Line
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute('x1', startX - gap/2);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', startX - gap/2);
    yAxis.setAttribute('y2', chartHeight);
    yAxis.setAttribute('stroke', accentColor);
    yAxis.setAttribute('stroke-width', '2');
    weeklyChartSVG.appendChild(yAxis);
    
    // X-Axis Line
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute('x1', startX - gap/2);
    xAxis.setAttribute('y1', chartHeight);
    xAxis.setAttribute('x2', startX + 7 * (barWidth + gap) - gap/2);
    xAxis.setAttribute('y2', chartHeight);
    xAxis.setAttribute('stroke', accentColor);
    xAxis.setAttribute('stroke-width', '2');
    weeklyChartSVG.appendChild(xAxis);

    weeklyCtx.appendChild(weeklyChartSVG);

    // --- Draw Mood Frequency Pie Chart ---
    const total = Object.values(moodFrequencyData).reduce((a, b) => a + b, 0);
    
    if (total > 0) {
        pieCtx.style.position = 'relative';
        pieCtx.style.display = 'flex';
        pieCtx.style.alignItems = 'center';
        pieCtx.style.justifyContent = 'center';
        pieCtx.style.flexWrap = 'wrap';
        
        // Calculate percentages
        const percentages = {};
        let currentAngle = 0;
        
        for (const [mood, count] of Object.entries(moodFrequencyData)) {
            percentages[mood] = Math.round((count / total) * 100);
        }
        
        // Create pie chart with SVG
        const pieSize = 150;
        const pieSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        pieSVG.setAttribute('width', pieSize);
        pieSVG.setAttribute('height', pieSize);
        pieSVG.setAttribute('viewBox', `0 0 ${pieSize} ${pieSize}`);
        
        // Draw pie slices
        for (const [mood, percentage] of Object.entries(percentages)) {
            if (percentage > 0) {
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = startAngle + angle;
                
                // Convert angles to radians
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                // Calculate points for arc
                const centerX = pieSize / 2;
                const centerY = pieSize / 2;
                const radius = pieSize / 2 - 10;
                
                const x1 = centerX + radius * Math.cos(startRad);
                const y1 = centerY + radius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(endRad);
                const y2 = centerY + radius * Math.sin(endRad);
                
                // Create path for slice
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                path.setAttribute('d', `
                    M ${centerX} ${centerY}
                    L ${x1} ${y1}
                    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                    Z
                `);
                
                path.setAttribute('fill', APP_STATE.moodColors[mood] || buttonColor);
                path.setAttribute('stroke', cardColor);
                path.setAttribute('stroke-width', '2');
                
                pieSVG.appendChild(path);
                
                currentAngle = endAngle;
            }
        }
        
        // Add center circle
        const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        centerCircle.setAttribute('cx', pieSize / 2);
        centerCircle.setAttribute('cy', pieSize / 2);
        centerCircle.setAttribute('r', pieSize / 4);
        centerCircle.setAttribute('fill', cardColor);
        pieSVG.appendChild(centerCircle);
        
        pieCtx.appendChild(pieSVG);
        
        // Create legend
        const legend = document.createElement('div');
        legend.className = 'ml-8 space-y-2 text-sm';
        
        for (const [mood, percentage] of Object.entries(percentages)) {
            if (percentage > 0) {
                const legendItem = document.createElement('div');
                legendItem.className = 'flex items-center space-x-2';
                legendItem.innerHTML = `
                    <span class="w-3 h-3 rounded-full" style="background-color: ${APP_STATE.moodColors[mood] || buttonColor};"></span>
                    <span class="font-semibold">${mood} ${percentage}%</span>
                `;
                legend.appendChild(legendItem);
            }
        }
        
        pieCtx.appendChild(legend);
        
    } else {
        // No data message
        pieCtx.innerHTML = `
            <div class="text-center text-soft p-8">
                <i data-lucide="pie-chart" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                <p>Chưa có đủ dữ liệu để hiển thị biểu đồ</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Animate charts
    animateCharts();
}

/**
 * Generate weekly data from entries
 */
function generateWeeklyData(entries) {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weeklyData = [];
    
    // Create last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        // Find entry for this date
        const entry = entries.find(e => e.date === dateString);
        
        // Map mood to number (1-5)
        let moodValue = 3; // Default neutral
        if (entry) {
            switch(entry.mood) {
                case '😢': moodValue = 1; break;
                case '😡': moodValue = 2; break;
                case '😴': moodValue = 3; break;
                case '😊': moodValue = 4; break;
                case '✨': moodValue = 5; break;
                default: moodValue = 3;
            }
        }
        
        weeklyData.push({
            day: days[date.getDay()],
            mood: moodValue,
            date: dateString
        });
    }
    
    return weeklyData;
}

/**
 * Generate mood frequency data
 */
function generateMoodFrequencyData(entries) {
    const moodCounts = {
        '😊': 0,
        '😢': 0,
        '😡': 0,
        '😴': 0,
        '✨': 0
    };
    
    entries.forEach(entry => {
        if (moodCounts.hasOwnProperty(entry.mood)) {
            moodCounts[entry.mood]++;
        }
    });
    
    return moodCounts;
}

/**
 * Animate charts
 */
export function animateCharts() {
    const bars = document.querySelectorAll('#weekly-chart rect');
    bars.forEach((bar, index) => {
        bar.style.transform = 'scaleY(0)';
        bar.style.transformOrigin = 'bottom';
        
        setTimeout(() => {
            bar.style.transition = 'transform 0.5s ease';
            bar.style.transform = 'scaleY(1)';
        }, index * 100);
    });
    
    const piePaths = document.querySelectorAll('#pie-chart path');
    piePaths.forEach((path, index) => {
        path.style.opacity = '0';
        path.style.transform = 'scale(0)';
        
        setTimeout(() => {
            path.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            path.style.opacity = '1';
            path.style.transform = 'scale(1)';
        }, 300 + index * 100);
    });
}

/**
 * Hàm vẽ lại biểu đồ khi resize
 */
export function resizeChart() {
    if (APP_STATE.currentView === 'report') {
        drawCharts();
    }
}

// Gán hàm vào window để có thể gọi từ HTML (onresize="resizeChart()") và các file JS khác
window.drawCharts = drawCharts;
window.resizeChart = resizeChart;