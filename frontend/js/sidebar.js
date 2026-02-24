// Sidebar Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
    // Server dropdown toggle
    const serverItems = document.querySelectorAll('.server-item');
    
    serverItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = item.closest('.nav-item-group');
            
            // Close other open dropdowns
            document.querySelectorAll('.nav-item-group').forEach(group => {
                if (group !== parent) {
                    group.classList.remove('open');
                }
            });
            
            // Toggle current dropdown
            parent.classList.toggle('open');
        });
    });

    // Navigation item click handler
    const navItems = document.querySelectorAll('.nav-item:not(.server-item)');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.id === 'logoutBtn') return;
            
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Handle navigation
            const href = item.getAttribute('href');
            console.log('Navigate to:', href);
            // TODO: Implement page navigation
        });
    });
});
