const express = require('express');
const router = express.Router();
const serversService = require('../services/servers.service');

// GET /api/servers - Get all server statistics
router.get('/', async (req, res) => {
    try {
        const servers = serversService.getMockServers();
        
        res.json({
            success: true,
            data: servers
        });
    } catch (error) {
        console.error('Error fetching servers:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch server statistics'
            }
        });
    }
});

// GET /api/servers/:id - Get specific server statistics
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const server = serversService.getServerById(id);
        
        if (!server) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Server not found',
                    resource: 'server',
                    id: id
                }
            });
        }
        
        res.json({
            success: true,
            data: server
        });
    } catch (error) {
        console.error('Error fetching server:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch server statistics'
            }
        });
    }
});

module.exports = router;
