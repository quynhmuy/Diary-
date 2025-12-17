// modules/report.js
import { ChartManager } from './chart.js';

export class ReportManager {
    static initialize() {
        console.log('Initializing report...');
        if (ChartManager) {
            ChartManager.drawCharts();
        }
    }
    
    static refresh() {
        this.initialize();
    }
}