// Export Module
const exportModule = {
    /**
     * Export testers to CSV
     */
    async exportTestersCSV(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `/api/export/testers/csv${queryParams ? '?' + queryParams : ''}`;
            
            await this.downloadFile(url, this.generateFilename('testers', 'csv'));
            
            if (window.notifications) {
                notifications.success('Export Successful', 'Testers data exported to CSV');
            }
        } catch (error) {
            console.error('Error exporting testers to CSV:', error);
            if (window.notifications) {
                notifications.error('Export Failed', 'Failed to export testers to CSV');
            }
        }
    },

    /**
     * Export testers to PDF
     */
    async exportTestersPDF(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `/api/export/testers/pdf${queryParams ? '?' + queryParams : ''}`;
            
            await this.downloadFile(url, this.generateFilename('testers', 'pdf'));
            
            if (window.notifications) {
                notifications.success('Export Successful', 'Testers data exported to PDF');
            }
        } catch (error) {
            console.error('Error exporting testers to PDF:', error);
            if (window.notifications) {
                notifications.error('Export Failed', 'Failed to export testers to PDF');
            }
        }
    },

    /**
     * Export bugs to CSV
     */
    async exportBugsCSV(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `/api/export/bugs/csv${queryParams ? '?' + queryParams : ''}`;
            
            await this.downloadFile(url, this.generateFilename('bugs', 'csv'));
            
            if (window.notifications) {
                notifications.success('Export Successful', 'Bugs data exported to CSV');
            }
        } catch (error) {
            console.error('Error exporting bugs to CSV:', error);
            if (window.notifications) {
                notifications.error('Export Failed', 'Failed to export bugs to CSV');
            }
        }
    },

    /**
     * Export bugs to PDF
     */
    async exportBugsPDF(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = `/api/export/bugs/pdf${queryParams ? '?' + queryParams : ''}`;
            
            await this.downloadFile(url, this.generateFilename('bugs', 'pdf'));
            
            if (window.notifications) {
                notifications.success('Export Successful', 'Bugs data exported to PDF');
            }
        } catch (error) {
            console.error('Error exporting bugs to PDF:', error);
            if (window.notifications) {
                notifications.error('Export Failed', 'Failed to export bugs to PDF');
            }
        }
    },

    /**
     * Download file from URL
     */
    async downloadFile(url, filename) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    },

    /**
     * Generate filename with timestamp
     */
    generateFilename(prefix, extension) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${prefix}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.${extension}`;
    }
};

// Initialize export buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Testers export buttons
    const exportTestersCSVBtn = document.getElementById('exportTestersCSV');
    if (exportTestersCSVBtn) {
        exportTestersCSVBtn.addEventListener('click', () => {
            // Get current filters if available
            const filters = window.currentTestersFilters || {};
            exportModule.exportTestersCSV(filters);
        });
    }

    const exportTestersPDFBtn = document.getElementById('exportTestersPDF');
    if (exportTestersPDFBtn) {
        exportTestersPDFBtn.addEventListener('click', () => {
            // Get current filters if available
            const filters = window.currentTestersFilters || {};
            exportModule.exportTestersPDF(filters);
        });
    }

    // Bugs export buttons
    const exportBugsCSVBtn = document.getElementById('exportBugsCSV');
    if (exportBugsCSVBtn) {
        exportBugsCSVBtn.addEventListener('click', () => {
            // Get current filters if available
            const filters = window.currentBugsFilters || {};
            exportModule.exportBugsCSV(filters);
        });
    }

    const exportBugsPDFBtn = document.getElementById('exportBugsPDF');
    if (exportBugsPDFBtn) {
        exportBugsPDFBtn.addEventListener('click', () => {
            // Get current filters if available
            const filters = window.currentBugsFilters || {};
            exportModule.exportBugsPDF(filters);
        });
    }
});

// Export for use in other modules
window.exportModule = exportModule;
