  // background.js
console.log('Background script loaded');

// Try to load local config, fall back to placeholder
let API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';

// Try to import local config if it exists
async function loadConfig() {
    try {
        const configModule = await import('./config.js');
        if (configModule.CONFIG && configModule.CONFIG.ANTHROPIC_API_KEY) {
            API_KEY = configModule.CONFIG.ANTHROPIC_API_KEY;
            console.log('✅ Local config loaded successfully');
            console.log('🔑 API Key loaded:', API_KEY.substring(0, 20) + '...' + API_KEY.substring(API_KEY.length - 4));
        } else {
            console.log('❌ Config file found but no API key in it');
        }
    } catch (e) {
        console.log('❌ Local config not found, using placeholder API key');
        console.error('Config loading error:', e);
    }
}

// Load config when background script starts
loadConfig();
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateResponse') {
        console.log('🚀 Generating response for prompt:', request.prompt.substring(0, 100) + '...');
        console.log('🔑 Current API Key:', API_KEY.substring(0, 20) + '...' + API_KEY.substring(API_KEY.length - 4));
        
        // Make sure config is loaded before making API call
        loadConfig().then(() => {
            console.log('🔄 Config reloaded, using API Key:', API_KEY.substring(0, 20) + '...' + API_KEY.substring(API_KEY.length - 4));
            
            return generateChatResponse(request.prompt);
        })
        .then(response => {
            console.log('✅ API response received:', response.substring(0, 100) + '...');
            sendResponse(response);
        })
        .catch(error => {
            console.error('❌ API error:', error);
            console.error('❌ Full error details:', error);
            sendResponse(`Error: ${error.message}`);
        });
        return true; // Required for async response
    }
});
  
  async function generateChatResponse(prompt) {
    try {
        console.log('🌐 Making API request to Anthropic...');
        console.log('🔑 API Key being sent:', API_KEY.substring(0, 20) + '...' + API_KEY.substring(API_KEY.length - 4));
        
        const requestBody = {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 400,
            messages: [{
                role: 'user',
                content: prompt
            }]
        };
        
        console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API error response:', errorData);
            throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Raw API response:', data);

        if (!data.content || !data.content[0] || !data.content[0].text) {
            console.error('❌ Unexpected API response format:', data);
            throw new Error('Invalid API response format');
        }

        return data.content[0].text;
    } catch (error) {
        console.error('💥 Error in generateChatResponse:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🌐 Network error - check internet connection');
        }
        throw error;
    }
}