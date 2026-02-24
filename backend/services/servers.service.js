// Servers Service - Mock Data Generation
const servers = [
    { id: 1, name: 'MOSCOW', owner: '@hostwes' },
    { id: 2, name: 'SEVASTOPOL', owner: '@flame_samp' },
    { id: 3, name: 'YALTA', owner: '@yalta_admin' },
    { id: 4, name: 'BABYLON', owner: '@M4aka' },
    { id: 5, name: 'CONTINENTAL', owner: '@HR_support' }
];

// Generate mock server statistics
function getMockServers() {
    return servers.map(server => {
        const status = generateStatus();
        const loadPercentage = generateLoad(status);
        const responseTime = generateResponseTime(status);
        const playersOnline = generatePlayersOnline();

        return {
            id: server.id,
            name: server.name,
            owner: server.owner,
            status: status,
            load_percentage: loadPercentage,
            response_time_ms: responseTime,
            players_online: playersOnline,
            last_check: new Date().toISOString()
        };
    });
}

// Generate random status with weighted probabilities
function generateStatus() {
    const rand = Math.random();
    if (rand < 0.7) return 'online';      // 70% online
    if (rand < 0.95) return 'warning';    // 25% warning
    return 'offline';                      // 5% offline
}

// Generate load based on status
function generateLoad(status) {
    if (status === 'offline') return 0;
    if (status === 'warning') return Math.floor(Math.random() * 20) + 70; // 70-90%
    return Math.floor(Math.random() * 60) + 20; // 20-80% for online
}

// Generate response time based on status
function generateResponseTime(status) {
    if (status === 'offline') return 0;
    if (status === 'warning') return Math.floor(Math.random() * 300) + 200; // 200-500ms
    return Math.floor(Math.random() * 150) + 30; // 30-180ms for online
}

// Generate random players online
function generatePlayersOnline() {
    return Math.floor(Math.random() * 500) + 50; // 50-550 players
}

// Get server by ID
function getServerById(id) {
    const mockServers = getMockServers();
    return mockServers.find(server => server.id === parseInt(id));
}

module.exports = {
    getMockServers,
    getServerById
};
