// Online Players Service - Mock Data Generation

// Generate mock online players data for different time periods
function generateMockData(period) {
    const now = new Date();
    const data = [];
    let intervalMinutes, dataPoints;
    
    // Determine interval and number of data points based on period
    switch (period) {
        case '1h':
            intervalMinutes = 5;  // Every 5 minutes
            dataPoints = 12;      // 12 points for 1 hour
            break;
        case '6h':
            intervalMinutes = 15; // Every 15 minutes
            dataPoints = 24;      // 24 points for 6 hours
            break;
        case '24h':
            intervalMinutes = 60; // Every hour
            dataPoints = 24;      // 24 points for 24 hours
            break;
        case '7d':
            intervalMinutes = 360; // Every 6 hours
            dataPoints = 28;       // 28 points for 7 days
            break;
        default:
            intervalMinutes = 60;
            dataPoints = 24;
    }
    
    // Generate data points
    for (let i = dataPoints - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
        const count = generatePlayerCount(timestamp);
        
        data.push({
            timestamp: timestamp.toISOString(),
            count: count
        });
    }
    
    return data;
}

// Generate realistic player count based on time of day
function generatePlayerCount(timestamp) {
    const hour = timestamp.getHours();
    let baseCount;
    
    // Simulate realistic player activity patterns
    if (hour >= 0 && hour < 6) {
        // Night time: low activity (50-150 players)
        baseCount = 50 + Math.random() * 100;
    } else if (hour >= 6 && hour < 12) {
        // Morning: medium activity (150-300 players)
        baseCount = 150 + Math.random() * 150;
    } else if (hour >= 12 && hour < 18) {
        // Afternoon: high activity (300-500 players)
        baseCount = 300 + Math.random() * 200;
    } else if (hour >= 18 && hour < 22) {
        // Evening: peak activity (400-600 players)
        baseCount = 400 + Math.random() * 200;
    } else {
        // Late evening: declining activity (200-400 players)
        baseCount = 200 + Math.random() * 200;
    }
    
    // Add some randomness
    const variance = baseCount * 0.15;
    const count = baseCount + (Math.random() - 0.5) * variance;
    
    return Math.round(Math.max(0, count));
}

// Calculate peak player count and timestamp
function calculatePeak(data) {
    if (!data || data.length === 0) {
        return { count: 0, timestamp: new Date().toISOString() };
    }
    
    let peak = data[0];
    
    for (const point of data) {
        if (point.count > peak.count) {
            peak = point;
        }
    }
    
    return {
        count: peak.count,
        timestamp: peak.timestamp
    };
}

// Calculate average player count
function calculateAverage(data) {
    if (!data || data.length === 0) {
        return 0;
    }
    
    const sum = data.reduce((acc, point) => acc + point.count, 0);
    return sum / data.length;
}

// Get current player count (last data point)
function getCurrentCount(data) {
    if (!data || data.length === 0) {
        return 0;
    }
    
    return data[data.length - 1].count;
}

// Main function to get online players data
function getOnlinePlayersData(period = '24h') {
    const data = generateMockData(period);
    const peak = calculatePeak(data);
    const average = calculateAverage(data);
    const current = getCurrentCount(data);
    
    return {
        data: data,
        peak: peak,
        average: average,
        current: current,
        period: period
    };
}

module.exports = {
    getOnlinePlayersData,
    generateMockData,
    calculatePeak,
    calculateAverage
};
