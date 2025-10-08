// Crime Analysis Dashboard JavaScript

class CrimeDashboard {
    constructor() {
        this.map = null;
        this.heatmapLayer = null;
        this.temporalChart = null;
        this.crimeTypesChart = null;
        this.monthlyChart = null;
        this.currentFilters = {};

        this.init();
    }

    init() {
        this.initializeMap();
        this.setupEventListeners();
        this.loadInitialData();
    }

    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([40.7128, -74.0060], 10);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Initialize heatmap layer
        this.heatmapLayer = L.heatLayer([], {
            radius: 25,
            blur: 15,
            gradient: {
                0.0: 'blue',
                0.4: 'lime',
                0.6: 'orange',
                1.0: 'red'
            }
        }).addTo(this.map);
    }

    setupEventListeners() {
        // Filter buttons
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());

        // Upload form
        document.getElementById('uploadForm').addEventListener('submit', (e) => this.handleFileUpload(e));

        // Export buttons
        document.getElementById('exportJson').addEventListener('click', () => this.exportData('json'));
        document.getElementById('exportCsv').addEventListener('click', () => this.exportData('csv'));
        document.getElementById('exportExcel').addEventListener('click', () => this.exportData('excel'));
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadHeatmapData(),
                this.loadStatistics(),
                this.loadCrimeTypes()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadHeatmapData() {
        try {
            const params = new URLSearchParams(this.currentFilters);
            params.append('_', new Date().getTime());
            const response = await fetch(`/api/heatmap?${params}`);
            const heatData = await response.json();

            // Update heatmap
            this.heatmapLayer.setLatLngs(heatData);

            // Clear existing markers
            this.map.eachLayer((layer) => {
                if (layer instanceof L.CircleMarker) {
                    this.map.removeLayer(layer);
                }
            });

            // Add markers for visibility (limit to 100 for performance)
            if (heatData.length > 0 && heatData.length <= 100) {
                heatData.forEach(point => {
                    L.circleMarker([point[0], point[1]], {
                        color: 'red',
                        fillColor: 'red',
                        fillOpacity: 0.6,
                        radius: 5
                    }).addTo(this.map);
                });
            }

            // Adjust map bounds if we have data
            if (heatData.length > 0) {
                const bounds = L.latLngBounds(heatData.map(point => [point[0], point[1]]));
                this.map.fitBounds(bounds);
            }
        } catch (error) {
            console.error('Error loading heatmap data:', error);
        }
    }

    async loadStatistics() {
        try {
            const params = new URLSearchParams(this.currentFilters);
            params.append('_', new Date().getTime());
            const response = await fetch(`/api/statistics?${params}`);
            const data = await response.json();

            this.updateStatisticsDisplay(data);
            this.updateCharts(data);
        } catch (error) {
            console.error('Error loading statistics:', error);
            document.getElementById('statsContent').innerHTML = '<p>Error loading statistics</p>';
        }
    }

    async loadCrimeTypes() {
        try {
            const params = new URLSearchParams();
            params.append('limit', 10000);
            params.append('_', new Date().getTime());
            const response = await fetch(`/api/crimes?${params}`);
            const crimes = await response.json();

            const crimeTypes = [...new Set(crimes.map(crime => crime.crime_type))].sort();
            const select = document.getElementById('crimeTypeFilter');

            // Clear existing options except "All"
            select.innerHTML = '<option value="">All Crime Types</option>';

            crimeTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading crime types:', error);
        }
    }

    updateStatisticsDisplay(data) {
        const stats = data.statistics;
        const content = document.getElementById('statsContent');

        content.innerHTML = `
            <div class="stat-item">
                <strong>Total Crimes:</strong> ${stats.total_crimes}
            </div>
            <div class="stat-item">
                <strong>Date Range:</strong> ${new Date(stats.date_range.start).toLocaleDateString()} - ${new Date(stats.date_range.end).toLocaleDateString()}
            </div>
            <div class="stat-item">
                <strong>Top Crime Types:</strong>
                <ul>
                    ${stats.crime_types.slice(0, 5).map(type =>
                        `<li>${type.crime_type}: ${type.count}</li>`
                    ).join('')}
                </ul>
            </div>
            <div class="stat-item">
                <strong>Top Locations:</strong>
                <ul>
                    ${stats.top_locations.slice(0, 5).map(loc =>
                        `<li>${loc.address || 'Unknown'}: ${loc.count}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }

    updateCharts(data) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Temporal analysis chart
        if (this.temporalChart) {
            this.temporalChart.destroy();
        }

        const ctxTemporal = document.getElementById('temporalChart').getContext('2d');
        this.temporalChart = new Chart(ctxTemporal, {
            type: 'line',
            data: {
                labels: data.temporal_analysis.hourly.map(h => `${h.hour}:00`),
                datasets: [{
                    label: 'Crimes by Hour',
                    data: data.temporal_analysis.hourly.map(h => h.count),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Monthly analysis chart
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }

        const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');
        this.monthlyChart = new Chart(ctxMonthly, {
            type: 'bar',
            data: {
                labels: data.temporal_analysis.monthly.map(m => monthNames[m.month - 1]),
                datasets: [{
                    label: 'Crimes by Month',
                    data: data.temporal_analysis.monthly.map(m => m.count),
                    backgroundColor: 'rgb(153, 102, 255)',
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Crime types chart
        if (this.crimeTypesChart) {
            this.crimeTypesChart.destroy();
        }

        const ctxTypes = document.getElementById('crimeTypesChart').getContext('2d');
        this.crimeTypesChart = new Chart(ctxTypes, {
            type: 'doughnut',
            data: {
                labels: data.statistics.crime_types.map(t => t.crime_type),
                datasets: [{
                    data: data.statistics.crime_types.map(t => t.count),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    applyFilters() {
        const crimeType = document.getElementById('crimeTypeFilter').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        this.currentFilters = {};
        if (crimeType) this.currentFilters.crime_type = crimeType;
        if (startDate) this.currentFilters.start_date = startDate;
        if (endDate) this.currentFilters.end_date = endDate;

        this.loadInitialData();
    }

    resetFilters() {
        document.getElementById('crimeTypeFilter').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';

        this.currentFilters = {};
        this.loadInitialData();
    }

    async handleFileUpload(event) {
        event.preventDefault();

        const formData = new FormData();
        const fileInput = document.getElementById('fileInput');
        const statusDiv = document.getElementById('uploadStatus');

        if (!fileInput.files[0]) {
            this.showUploadStatus('Please select a file', 'error');
            return;
        }

        formData.append('file', fileInput.files[0]);

        // Show loading
        statusDiv.style.display = 'block';
        statusDiv.className = '';
        statusDiv.innerHTML = '<div class="loading"></div> Uploading and processing...';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showUploadStatus(result.message, 'success');
                // Reload data after successful upload
                setTimeout(() => this.loadInitialData(), 1000);
            } else {
                this.showUploadStatus(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            this.showUploadStatus('Network error occurred', 'error');
        }
    }

    showUploadStatus(message, type) {
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.style.display = 'block';
        statusDiv.className = type;
        statusDiv.textContent = message;
    }

    async exportData(format) {
        const params = new URLSearchParams(this.currentFilters);
        params.set('format', format);

        try {
            const response = await fetch(`/api/export?${params}`);

            if (format === 'json') {
                const data = await response.json();
                this.downloadJSON(data, 'crime_data.json');
            } else {
                const blob = await response.blob();
                const filename = `crime_data.${format}`;
                this.downloadBlob(blob, filename);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed');
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CrimeDashboard();
});