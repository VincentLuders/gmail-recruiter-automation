const ContactManager = {
    async addContact(email, type) {
        const contacts = await chrome.storage.local.get('contacts') || {};
        contacts[email] = { type };
        await chrome.storage.local.set({ contacts });
    },

    async getContactType(email) {
        const { contacts } = await chrome.storage.local.get('contacts');
        return contacts?.[email]?.type;
    }
};