// content.js

// Listen for reload message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "reloadContentScript") {
        initializeContentScript();
        showNotification('Content script reloaded!');
    }
});

// Platform detection
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Reusable notification function
function showNotification(message) {
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
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function processPrompt(emailThread) {
    const { customPrompt } = await chrome.storage.local.get(['customPrompt']);
    const defaultPrompt = `Write in French.
  
  {Chat}
  
  Now, provide only the answer I will send now to the recipient without any additional comments!`;

    const prompt = (customPrompt || defaultPrompt)
        .replace('{Chat}', emailThread)
        .replace('{time}', new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
        .replace('{date}', new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }))
        .replace('{day}', new Date().toLocaleDateString('en-US', { weekday: 'long' }));

    console.log('Complete prompt being sent to API:', prompt);
    return prompt;
}

async function extractChatThread() {
    if (window.location.hostname.includes("mail.google.com")) {
        return extractEmailThread();
    } else if (window.location.hostname.includes("app.rogerroger.io")) {
        return extractRogerChatThread();
    } else {
        console.error("Unsupported domain for extraction");
        return null;
    }
}

async function extractRogerChatThread() {
    console.log('Starting RogerRoger chat extraction');
    const linkedinMessages = Array.from(document.querySelectorAll("div.conversation--message.conversation--linkedinmessage .linkedin-body"));
    const whatsappMessages = Array.from(document.querySelectorAll("div.conversation--message.conversation--whatsappmessage .whatsapp-body"));
    const allMessages = [...linkedinMessages, ...whatsappMessages];
    if (allMessages.length === 0) {
        console.log("No RogerRoger conversation messages found");
        return null;
    }
    let fullThread = "";
    allMessages.forEach(msg => {
        fullThread += msg.innerText + "\n";
    });
    console.log("Final extracted RogerRoger chat content:", fullThread.trim());
    return fullThread.trim();
}

async function extractEmailThread() {
    console.log('Starting email thread extraction');

    const trimButton = document.querySelector('div.ajR[role="button"][data-tooltip="Show trimmed content"]');

    if (trimButton && trimButton.style.display !== 'none') {
        console.log('Found trim button, clicking...');
        trimButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const composeArea = document.querySelector('.Am.Al.editable[role="textbox"]');
    if (!composeArea) {
        console.log('Compose area not found');
        return null;
    }

    function processHTML(html) {
        // First, preserve important line breaks in signatures
        let content = html
            .replace(/(<div[^>]*>)\s*<strong[^>]*>(.*?)<\/strong>/gi, '$1\n$2') // Preserve name in signature
            .replace(/<span[^>]*>Founder[^<]*<\/span>/gi, '\nFounder & IT Headhunter') // Fix title line
            .replace(/<strong[^>]*>Lux Search<\/strong>/gi, '\nLux Search') // Fix company line
            .replace(/\|\s*\+(\d+)/gi, '\n+$1') // Fix phone number line

            // Preserve email headers with complete information
            .replace(/On\s+(.*?)at\s+(.*?)\s*<(\w+@[\w.]+)>\s+wrote:/gi, 'On $1at $2 $3> wrote:')

            // Remove extra separators around email addresses
            .replace(/---\s*(\w+@[\w.]+)/g, '$1')
            .replace(/(\w+@[\w.]+)\s*---/g, '$1');

        // Then handle general formatting
        content = content
            .replace(/<div><br><\/div>/gi, '\n\n') // Double line breaks
            .replace(/<div>/gi, '\n') // Single line breaks
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<blockquote.*?>/gi, '\n')
            .replace(/<\/blockquote>/gi, '\n')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&amp;/gi, '&')
            .replace(/<[^>]+>/g, '') // Remove remaining HTML
            .replace(/\s*\|\s*/g, ' | ') // Clean up separators
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive empty lines

            // Add message separators
            .replace(/Sicher versendet mit Proton Mail\.\s*([^\n])/g, 'Sicher versendet mit Proton Mail.\n\n---\n\n$1')
            .replace(/(\w+@[\w.]+>)\s*schrieb am/g, '\n---\n\n$1 schrieb am')

            // Fix spaces in timestamps
            .replace(/(\d{1,2})\s*:\s*(\d{2})/g, '$1:$2')

            // Final cleanup
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .replace(/wrote:\n(?!\n)/g, 'wrote:\n\n')
            .trim();

        return content;
    }

    const quoteContainer = composeArea.querySelector('.gmail_quote');
    let fullThread = '';

    if (quoteContainer) {
        fullThread = processHTML(quoteContainer.innerHTML);
    }

    console.log('Final extracted content:', fullThread);
    return fullThread;
}

async function findAndInsertResponse(response) {
    const maxAttempts = 5;
    const delayMs = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Attempt ${attempt} to find compose area`);

        const composeArea = await findComposeArea();
        if (composeArea) {
            return insertResponse(composeArea, response);
        }

        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw new Error('Could not find the compose area after multiple attempts');
}

async function findComposeArea() {
    if (window.location.hostname.includes("mail.google.com")) {
        return document.querySelector('.Am.Al.editable[role="textbox"]');
    } else if (window.location.hostname.includes("app.rogerroger.io")) {
        return document.querySelector('div.editablechatinput[contenteditable="true"]');
    }
}

function insertResponse(composeArea, response) {
    try {
        composeArea.focus();
        // Convert line breaks in the response to proper HTML line breaks
        const formattedResponse = response
            .split('\n')
            .map(line => line.trim())
            .join('<br>');

        const existingContent = composeArea.innerHTML;
        composeArea.innerHTML = formattedResponse + '<br><br>' + existingContent;

        const event = new Event('input', { bubbles: true });
        composeArea.dispatchEvent(event);
        return true;
    } catch (error) {
        console.error('Error inserting response:', error);
        throw new Error('Failed to insert response into compose area');
    }
}

function initializeContentScript() {
    console.log('Content script loaded for Gmail Assistant');
    console.log(`Running on ${isMac ? 'Mac' : 'Windows/Linux'} platform`);

    // Main shortcut (⌘I on Mac, Ctrl+I on Windows)
    document.addEventListener('keydown', async (e) => {
        if ((isMac && e.metaKey || !isMac && e.ctrlKey) && e.key.toLowerCase() === 'i') {
            console.log(`${isMac ? '⌘I' : 'Ctrl+I'} detected`);
            e.preventDefault();
            try {
                const emailThread = await extractChatThread();
                if (!emailThread) {
                    throw new Error('No email thread content extracted');
                }
                const prompt = await processPrompt(emailThread);
                console.log('📤 Sending message to background script...');
                const response = await chrome.runtime.sendMessage({
                    action: 'generateResponse',
                    prompt: prompt
                });
                console.log('📥 Received response from background:', typeof response, response?.substring(0, 100) + '...');
                
                if (typeof response === 'string' && response.startsWith('Error:')) {
                    console.error('❌ Error response received:', response);
                    throw new Error(response);
                }
                await findAndInsertResponse(response);
            } catch (error) {
                console.error('Error:', error);
                alert(error.message);
            }
        }
    }, true);

    // Custom prompt shortcut (⌘7 on Mac, Ctrl+7 on Windows)
    document.addEventListener('keydown', async (e) => {
        if ((isMac && e.metaKey || !isMac && e.ctrlKey) && e.key === '7') {
            console.log(`${isMac ? '⌘7' : 'Ctrl+7'} detected`);
            e.preventDefault();

            try {
                const clipboardText = await navigator.clipboard.readText();
                if (!clipboardText) {
                    throw new Error('No clipboard content found');
                }

                await chrome.storage.local.set({ customPrompt: clipboardText });
                showNotification('Custom prompt updated from clipboard!');
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to read clipboard: ' + error.message);
            }
        }
    }, true);

    // Reload shortcut (⌘O on Mac, Ctrl+O on Windows)
    document.addEventListener('keydown', async (e) => {
        if ((isMac && e.metaKey || !isMac && e.ctrlKey) && e.key === 'o') {
            e.preventDefault();
            initializeContentScript();
            showNotification('Content script reloaded!');
        }
    });
}

// Initial call to set everything up
initializeContentScript();