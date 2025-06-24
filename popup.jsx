import React, { useState, useEffect } from 'react';

const defaultPrompts = [
  {
    id: 1,
    name: "Get Phone Number",
    prompt: "I'm a recruiter and I need to get my his phone number. I need to handle objections.\n\nThe following is the chat I have with the candidate:\n\n{chat}\n\nNow, I want you to create the response I will send now to the candidate!"
  },
  {
    id: 2,
    name: "Follow Up",
    prompt: "I'm a recruiter following up with a candidate. Here's our chat history:\n\n{chat}\n\nCreate a friendly follow-up message to maintain engagement."
  }
];

export default function Popup() {
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', prompt: '' });
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load saved prompts from storage
    chrome.storage.sync.get(['prompts', 'selectedPromptId'], (result) => {
      setPrompts(result.prompts || defaultPrompts);
      setSelectedPromptId(result.selectedPromptId || defaultPrompts[0].id);
    });
  }, []);

  const savePrompt = () => {
    if (!newPrompt.name || !newPrompt.prompt) return;

    const updatedPrompts = [...prompts, {
      id: Date.now(),
      ...newPrompt
    }];

    setPrompts(updatedPrompts);
    chrome.storage.sync.set({ prompts: updatedPrompts });
    setNewPrompt({ name: '', prompt: '' });
    setIsEditing(false);
  };

  const deletePrompt = (id) => {
    const updatedPrompts = prompts.filter(p => p.id !== id);
    setPrompts(updatedPrompts);
    chrome.storage.sync.set({ prompts: updatedPrompts });

    if (selectedPromptId === id) {
      const newSelectedId = updatedPrompts[0]?.id || null;
      setSelectedPromptId(newSelectedId);
      chrome.storage.sync.set({ selectedPromptId: newSelectedId });
    }
  };

  const selectPrompt = (id) => {
    setSelectedPromptId(id);
    chrome.storage.sync.set({ selectedPromptId: id });
  };

  return (
    <div className="w-96 p-4 bg-gray-50 min-h-[400px]">
      <h1 className="text-xl font-bold mb-4">LinkedIn Chat Prompts</h1>

      {/* Prompt List */}
      <div className="space-y-2 mb-4">
        {prompts.map(prompt => (
          <div
            key={prompt.id}
            className={`p-3 rounded-lg border ${selectedPromptId === prompt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{prompt.name}</h3>
              <div className="space-x-2">
                <button
                  onClick={() => selectPrompt(prompt.id)}
                  className="px-2 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Select
                </button>
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  className="px-2 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{prompt.prompt}</p>
          </div>
        ))}
      </div>

      {/* Add New Prompt Button */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Prompt
        </button>
      )}

      {/* Add/Edit Prompt Form */}
      {isEditing && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Name
            </label>
            <input
              type="text"
              value={newPrompt.name}
              onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter prompt name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Text
            </label>
            <textarea
              value={newPrompt.prompt}
              onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
              className="w-full px-3 py-2 border rounded-md h-32"
              placeholder="Enter prompt text (use {chat} to include conversation)"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={savePrompt}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Prompt
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setNewPrompt({ name: '', prompt: '' });
              }}
              className="flex-1 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Placeholder Info */}
      <div className="mt-4 text-sm text-gray-500">
        <p>Available placeholders:</p>
        <ul className="list-disc pl-5">
          <li>{'{chat}'} - Current conversation</li>
          <li>{'{time}'} - Current time</li>
          <li>{'{date}'} - Current date</li>
          <li>{'{day}'} - Current day</li>
        </ul>
      </div>
    </div>
  );
}