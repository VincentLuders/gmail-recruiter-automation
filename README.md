# Gmail Recruiter Automation Extension

A browser extension for Gmail recruiter automation using Claude 4.

## Setup

1. **Install the extension:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select this folder

2. **Configure API Key:**
   - Copy `config.js.example` to `config.js` (if provided)
   - OR create a new `config.js` file with your Anthropic API key:
   
   ```javascript
   // config.js - Local configuration file (not committed to git)
   export const CONFIG = {
       ANTHROPIC_API_KEY: 'your-actual-api-key-here'
   };
   ```

3. **Important:** 
   - The `config.js` file is ignored by git to keep your API key secure
   - Never commit your actual API key to version control

## Features

- AI-powered response generation for Gmail
- Seamless integration with Gmail interface
- Uses Claude 4 for intelligent responses

## Usage

1. Open Gmail
2. Select an email
3. Use the extension to generate AI responses
4. Customize and send your response 