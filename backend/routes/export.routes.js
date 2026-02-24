const express = require('express');
const router = express.Router();
const exportService = require('../services/export.service');

// GET /api/export/testers/csv - Export testers to CSV
router.get('/testers/csv', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            deviceType: req.query.deviceType,
            os: req.query.os,
            search: req.query.search
        };
        
        const csv = await exportService.generateTestersCSV(filters);
        
        // Generate filename with timestamp
        const filename = generateFilename('testers', 'csv');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting testers to CSV:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to export testers to CSV'
            }
        });
    }
});

// GET /api/export/testers/pdf - Export testers to PDF
router.get('/testers/pdf', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            deviceType: req.query.deviceType,
            os: req.query.os,
            search: req.query.search
        };
        
        const html = await exportService.generateTestersPDF(filters);
        
        // Generate filename with timestamp
        const filename = generateFilename('testers', 'pdf');
        
        // For simplicity, we're returning HTML
        // In production, you would use a library like puppeteer to convert HTML to PDF
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.send(html);
    } catch (error) {
        console.error('Error exporting testers to PDF:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to export testers to PDF'
            }
        });
    }
});

// GET /api/export/bugs/csv - Export bugs to CSV
router.get('/bugs/csv', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            type: req.query.type,
            testerId: req.query.testerId,
            search: req.query.search
        };
        
        const csv = await exportService.generateBugsCSV(filters);
        
        // Generate filename with timestamp
        const filename = generateFilename('bugs', 'csv');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting bugs to CSV:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to export bugs to CSV'
            }
        });
    }
});

// GET /api/export/bugs/pdf - Export bugs to PDF
router.get('/bugs/pdf', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            type: req.query.type,
            testerId: req.query.testerId,
            search: req.query.search
        };
        
        const html = await exportService.generateBugsPDF(filters);
        
        // Generate filename with timestamp
        const filename = generateFilename('bugs', 'pdf');
        
        // For simplicity, we're returning HTML
        // In production, you would use a library like puppeteer to convert HTML to PDF
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.send(html);
    } catch (error) {
        console.error('Error exporting bugs to PDF:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to export bugs to PDF'
            }
        });
    }
});

/**
 * Generate filename with timestamp
 */
function generateFilename(prefix, extension) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `report_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.${extension}`;
}

module.exports = router;
