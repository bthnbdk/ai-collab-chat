import React, { useState } from 'react';
import { ApiKeys, Model, GeminiSettings, ApiModes } from '../types';
import { MODELS } from '../constants';
import { LogoutIcon } from './icons';

interface SettingsPanelProps {
  currentUser: string;
  onLogout: () => void;
  apiKeys: ApiKeys;
  setApiKeys: (keys: ApiKeys) => void;
  masterPrompt: string;
  setMasterPrompt: (prompt: string) => void;
  geminiSettings: GeminiSettings;
  setGeminiSettings: (settings: GeminiSettings) => void;
  apiModes: ApiModes;
  setApiModes: (modes: ApiModes) => void;
  chatTopic: string;
  setChatTopic: (topic: string) => void;
  isChatting: boolean;
  onStart: () => void;
  onStop: () => void;
  onDownload: () => void;
  onClear: () => void;
  hasMessages: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  currentUser,
  onLogout,
  apiKeys,
  setApiKeys,
  masterPrompt,
  setMasterPrompt,
  geminiSettings,
  setGeminiSettings,
  apiModes,
  setApiModes,
  chatTopic,
  setChatTopic,
  isChatting,
  onStart,
  onStop,
  onDownload,
  onClear,
  hasMessages
}) => {
  const [isTuningOpen, setIsTuningOpen] = useState(false);

  const handleApiKeyChange = (model: Model, value: string) => {
    setApiKeys({ ...apiKeys, [model]: value });
  };

  const handleSettingChange = (setting: keyof GeminiSettings, value: string) => {
    setGeminiSettings({ ...geminiSettings, [setting]: parseFloat(value) });
  };

  const handleApiModeChange = (model: keyof ApiModes, mode: 'mock' | 'live') => {
    setApiModes({ ...apiModes, [model]: mode });
  };

  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 p-4 bg-gray-800 border-r border-gray-700 flex flex-col space-y-4 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">AI Collab Chat</h1>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-400 hidden lg:inline">{currentUser}</span>
          <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-700" title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </div>
      
      <div>
        <label htmlFor="master-prompt" className="block text-sm font-medium text-gray-300 mb-1">Master Prompt</label>
        <textarea
          id="master-prompt"
          rows={6}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={masterPrompt}
          onChange={(e) => setMasterPrompt(e.target.value)}
          disabled={isChatting}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-2">AI Models & Keys</h2>
        <div className="space-y-3">
          {[Model.Gemini, ...MODELS.filter(m => m !== Model.Gemini)].map(model => (
            <div key={model} className="bg-gray-700/50 p-3 rounded-md">
              <label htmlFor={`${model}-key`} className="block text-sm font-medium text-gray-300 mb-2">{model}</label>
              
              {model !== Model.Gemini && (
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-gray-400">Mode:</span>
                  <button
                    onClick={() => handleApiModeChange(model as keyof ApiModes, 'mock')}
                    disabled={isChatting}
                    className={`px-2 py-1 text-xs rounded transition-colors ${apiModes[model as keyof ApiModes] === 'mock' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    Mock
                  </button>
                  <button
                    onClick={() => handleApiModeChange(model as keyof ApiModes, 'live')}
                    disabled={isChatting}
                    className={`px-2 py-1 text-xs rounded transition-colors ${apiModes[model as keyof ApiModes] === 'live' ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                  >
                    Live (Simulated)
                  </button>
                </div>
              )}

              <input
                type="password"
                id={`${model}-key`}
                placeholder={`${model === Model.Gemini ? 'Required' : 'Optional (for future use)'}`}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={apiKeys[model as Exclude<Model, Model.User>] || ''}
                onChange={(e) => handleApiKeyChange(model as Exclude<Model, Model.User>, e.target.value)}
                disabled={isChatting}
              />
            </div>
          ))}
           <div className="text-xs text-gray-400 bg-gray-700/50 p-2 rounded-md">
            The Gemini API key is required for its own responses and for simulating 'Live' responses from other AIs. API keys for other models are for future implementation.
            Get a Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
          </div>
        </div>
      </div>

      <div>
        <button onClick={() => setIsTuningOpen(!isTuningOpen)} className="w-full text-left font-semibold text-gray-200 mb-2 flex justify-between items-center">
          <span>Gemini Fine-Tuning</span>
          <span className={`transform transition-transform ${isTuningOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isTuningOpen && (
          <div className="space-y-3 bg-gray-700/50 p-3 rounded-md">
            <div className="text-sm">
              <label htmlFor="temperature" className="flex justify-between"><span>Temperature</span> <span>{geminiSettings.temperature.toFixed(2)}</span></label>
              <input type="range" id="temperature" min="0" max="1" step="0.01" value={geminiSettings.temperature} onChange={e => handleSettingChange('temperature', e.target.value)} className="w-full" disabled={isChatting} />
            </div>
             <div className="text-sm">
              <label htmlFor="topK" className="flex justify-between"><span>Top K</span> <span>{geminiSettings.topK}</span></label>
              <input type="range" id="topK" min="1" max="100" step="1" value={geminiSettings.topK} onChange={e => handleSettingChange('topK', e.target.value)} className="w-full" disabled={isChatting} />
            </div>
             <div className="text-sm">
              <label htmlFor="topP" className="flex justify-between"><span>Top P</span> <span>{geminiSettings.topP.toFixed(2)}</span></label>
              <input type="range" id="topP" min="0" max="1" step="0.01" value={geminiSettings.topP} onChange={e => handleSettingChange('topP', e.target.value)} className="w-full" disabled={isChatting} />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow"></div>

      <div className="space-y-4 border-t border-gray-700 pt-4">
        <textarea
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter the chat topic here..."
          value={chatTopic}
          onChange={(e) => setChatTopic(e.target.value)}
          disabled={isChatting}
        />
        {isChatting ? (
          <button
            onClick={onStop}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Stop Chat
          </button>
        ) : (
          <button
            onClick={onStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Start Chat
          </button>
        )}
         <div className="flex space-x-2">
          <button
            onClick={onDownload}
            disabled={!hasMessages}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Download
          </button>
          <button
            onClick={onClear}
            disabled={!hasMessages}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SettingsPanel;