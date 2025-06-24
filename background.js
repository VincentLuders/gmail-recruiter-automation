  // background.js
  console.log('Background script loaded');
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'generateResponse') {
          console.log('Generating response for prompt:', request.prompt);
  
          generateChatResponse(request.prompt)
              .then(response => {
                  console.log('API response received:', response);
                  sendResponse(response);
              })
              .catch(error => {
                  console.error('API error:', error);
                  sendResponse(`Error: ${error.message}`);
              });
          return true; // Required for async response
      }
  });
  
  async function generateChatResponse(prompt) {
      try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': 'YOUR_ANTHROPIC_API_KEY_HERE',
                  'anthropic-version': '2023-06-01',
                  'anthropic-dangerous-direct-browser-access': 'true'
              },
              body: JSON.stringify({
                  model: 'claude-4-sonnet-latest',
                  max_tokens: 400,
                  messages: [{
                      role: 'user',
                      content: prompt
                  }]
              })
          });
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
          }
  
          const data = await response.json();
          console.log('Raw API response:', data);
  
          if (!data.content || !data.content[0] || !data.content[0].text) {
              console.error('Unexpected API response format:', data);
              throw new Error('Invalid API response format');
          }
  
          return data.content[0].text;
      } catch (error) {
          console.error('Error in generateChatResponse:', error);
          throw error;
      }
  }