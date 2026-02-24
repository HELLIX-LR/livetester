// Export Service
const db = require('../config/database');

/**
 * Generate CSV from array of objects
 */
function generateCSV(data, columns) {
    if (!data || data.length === 0) {
        return '';
    }

    // Create header row
    const headers = columns.map(col => col.label).join(',');
    
    // Create data rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key];
            
            // Handle null/undefined
            if (value === null || value === undefined) {
                value = '';
            }
            
            // Format dates
            if (value instanceof Date) {
                value = value.toISOString().split('T')[0];
            }
            
            // Escape quotes and wrap in quotes if contains comma or quote
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
        }).join(',');
    }).join('\n');
    
    return `${headers}\n${rows}`;
}

/**
 * Generate testers CSV
 */
async function generateTestersCSV(filters = {}) {
    try {
        // Build query
        let query = `
            SELECT 
                id,
                name,
                email,
                nickname,
                telegram,
                device_type,
                os,
                os_version,
                status,
                registration_date,
                bugs_count,
                rating
            FROM testers
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Apply filters
        if (filters.status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }
        
        if (filters.deviceType) {
            query += ` AND device_type = $${paramIndex++}`;
            params.push(filters.deviceType);
        }
        
        if (filters.os) {
            query += ` AND os = $${paramIndex++}`;
            params.push(filters.os);
        }
        
        if (filters.search) {
            query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }
        
        query += ' ORDER BY registration_date DESC';
        
        // Execute query
        const result = await db.query(query, params);
        
        // Define columns
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'nickname', label: 'Nickname' },
            { key: 'telegram', label: 'Telegram' },
            { key: 'device_type', label: 'Device Type' },
            { key: 'os', label: 'OS' },
            { key: 'os_version', label: 'OS Version' },
            { key: 'status', label: 'Status' },
            { key: 'registration_date', label: 'Registration Date' },
            { key: 'bugs_count', label: 'Bugs Count' },
            { key: 'rating', label: 'Rating' }
        ];
        
        return generateCSV(result.rows, columns);
    } catch (error) {
        console.error('Error generating testers CSV:', error);
        throw error;
    }
}

/**
 * Generate bugs CSV
 */
async function generateBugsCSV(filters = {}) {
    try {
        // Build query
        let query = `
            SELECT 
                b.id,
                b.title,
                b.description,
                t.name as tester_name,
                b.priority,
                b.status,
                b.type,
                b.created_at,
                b.updated_at,
                b.fixed_at
            FROM bugs b
            LEFT JOIN testers t ON b.tester_id = t.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Apply filters
        if (filters.status) {
            query += ` AND b.status = $${paramIndex++}`;
            params.push(filters.status);
        }
        
        if (filters.priority) {
            query += ` AND b.priority = $${paramIndex++}`;
            params.push(filters.priority);
        }
        
        if (filters.type) {
            query += ` AND b.type = $${paramIndex++}`;
            params.push(filters.type);
        }
        
        if (filters.testerId) {
            query += ` AND b.tester_id = $${paramIndex++}`;
            params.push(filters.testerId);
        }
        
        if (filters.search) {
            query += ` AND (b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }
        
        query += ' ORDER BY b.created_at DESC';
        
        // Execute query
        const result = await db.query(query, params);
        
        // Define columns
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description' },
            { key: 'tester_name', label: 'Tester' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status' },
            { key: 'type', label: 'Type' },
            { key: 'created_at', label: 'Created At' },
            { key: 'updated_at', label: 'Updated At' },
            { key: 'fixed_at', label: 'Fixed At' }
        ];
        
        return generateCSV(result.rows, columns);
    } catch (error) {
        console.error('Error generating bugs CSV:', error);
        throw error;
    }
}

/**
 * Generate testers PDF (simplified - returns HTML that can be converted to PDF)
 */
async function generateTestersPDF(filters = {}) {
    try {
        // Build query (same as CSV)
        let query = `
            SELECT 
                id,
                name,
                email,
                nickname,
                telegram,
                device_type,
                os,
                os_version,
                status,
                registration_date,
                bugs_count,
                rating
            FROM testers
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Apply filters (same as CSV)
        if (filters.status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }
        
        if (filters.deviceType) {
            query += ` AND device_type = $${paramIndex++}`;
            params.push(filters.deviceType);
        }
        
        if (filters.os) {
            query += ` AND os = $${paramIndex++}`;
            params.push(filters.os);
        }
        
        if (filters.search) {
            query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }
        
        query += ' ORDER BY registration_date DESC';
        
        // Execute query
        const result = await db.query(query, params);
        
        // Generate HTML for PDF
        const html = generateTestersHTML(result.rows);
        return html;
    } catch (error) {
        console.error('Error generating testers PDF:', error);
        throw error;
    }
}

/**
 * Generate bugs PDF (simplified - returns HTML that can be converted to PDF)
 */
async function generateBugsPDF(filters = {}) {
    try {
        // Build query (same as CSV)
        let query = `
            SELECT 
                b.id,
                b.title,
                b.description,
                t.name as tester_name,
                b.priority,
                b.status,
                b.type,
                b.created_at,
                b.updated_at,
                b.fixed_at
            FROM bugs b
            LEFT JOIN testers t ON b.tester_id = t.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        // Apply filters (same as CSV)
        if (filters.status) {
            query += ` AND b.status = $${paramIndex++}`;
            params.push(filters.status);
        }
        
        if (filters.priority) {
            query += ` AND b.priority = $${paramIndex++}`;
            params.push(filters.priority);
        }
        
        if (filters.type) {
            query += ` AND b.type = $${paramIndex++}`;
            params.push(filters.type);
        }
        
        if (filters.testerId) {
            query += ` AND b.tester_id = $${paramIndex++}`;
            params.push(filters.testerId);
        }
        
        if (filters.search) {
            query += ` AND (b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }
        
        query += ' ORDER BY b.created_at DESC';
        
        // Execute query
        const result = await db.query(query, params);
        
        // Generate HTML for PDF
        const html = generateBugsHTML(result.rows);
        return html;
    } catch (error) {
        console.error('Error generating bugs PDF:', error);
        throw error;
    }
}

/**
 * Generate HTML for testers PDF
 */
function generateTestersHTML(testers) {
    const rows = testers.map(tester => `
        <tr>
            <td>${tester.id}</td>
            <td>${tester.name}</td>
            <td>${tester.email}</td>
            <td>${tester.nickname || '-'}</td>
            <td>${tester.telegram || '-'}</td>
            <td>${tester.device_type}</td>
            <td>${tester.os}</td>
            <td>${tester.os_version || '-'}</td>
            <td>${tester.status}</td>
            <td>${new Date(tester.registration_date).toLocaleDateString()}</td>
            <td>${tester.bugs_count}</td>
            <td>${tester.rating}</td>
        </tr>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Testers Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #3498db; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>LIVE RUSSIA - Testers Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Nickname</th>
                        <th>Telegram</th>
                        <th>Device</th>
                        <th>OS</th>
                        <th>OS Version</th>
                        <th>Status</th>
                        <th>Registration</th>
                        <th>Bugs</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

/**
 * Generate HTML for bugs PDF
 */
function generateBugsHTML(bugs) {
    const rows = bugs.map(bug => `
        <tr>
            <td>${bug.id}</td>
            <td>${bug.title}</td>
            <td>${bug.description.substring(0, 100)}${bug.description.length > 100 ? '...' : ''}</td>
            <td>${bug.tester_name || '-'}</td>
            <td>${bug.priority}</td>
            <td>${bug.status}</td>
            <td>${bug.type}</td>
            <td>${new Date(bug.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Bugs Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #e74c3c; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>LIVE RUSSIA - Bugs Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Tester</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

module.exports = {
    generateTestersCSV,
    generateBugsCSV,
    generateTestersPDF,
    generateBugsPDF
};
