// popup.js
// Load saved prompt when popup opens
document.addEventListener('DOMContentLoaded', () => {
    const promptEditor = document.getElementById('promptEditor');

    // Initial load
    chrome.storage.sync.get(['customPrompt'], (result) => {
        promptEditor.value = result.customPrompt || '';
    });

    // Listen for changes to storage
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.customPrompt) {
            promptEditor.value = changes.customPrompt.newValue;
        }
    });
});

// Save prompt when button is clicked
document.getElementById('savePrompt').addEventListener('click', () => {
    const customPrompt = document.getElementById('promptEditor').value;
    chrome.storage.sync.set({ customPrompt }, () => {
        const status = document.getElementById('saveStatus');
        status.style.display = 'inline';
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    });
});

// Add reload functionality
document.getElementById('reloadScript').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.runtime.reload();
        const notification = document.createElement('div');
        notification.style.cssText = `
             position: fixed;
             top: 20px;
             right: 20px;
             background: #4CAF50;
             color: white;
             padding: 15px;
             border-radius: 5px;
             z-index: 10000;
             box-shadow: 0 2px 5px rgba(0,0,0,0.2);
         `;
        notification.textContent = 'Extension reloaded!';
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
            window.close();
        }, 2000);
    });
});