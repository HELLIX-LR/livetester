const express = require('express');
const router = express.Router();
const onlinePlayersService = require('../services/onlinePlayers.service');

// GET /api/online-players - Get online players data
router.get('/', async (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        // Validate period
        const validPeriods = ['1h', '6h', '24h', '7d'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid period. Must be one of: 1h, 6h, 24h, 7d',
                    field: 'period'
                }
            });
        }
        
        const data = onlinePlayersService.getOnlinePlayersData(period);
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching online players data:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch online players data'
            }
        });
    }
});

module.exports = router;
