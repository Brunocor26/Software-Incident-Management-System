// Settings Page Scripts
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page loaded');
    
    // Add event listeners
    const saveBtn = document.querySelector('.btn-primary');
    const cancelBtn = document.querySelector('.btn-secondary');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveSettings);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }
    
    loadSettings();
});

function loadSettings() {
    // Placeholder for loading settings data
    console.log('Loading settings...');
}

function handleSaveSettings(event) {
    event.preventDefault();
    console.log('Saving settings...');
    // Add settings save logic here
}

function handleCancel(event) {
    event.preventDefault();
    console.log('Settings cancelled');
    // Add cancel logic here
}
