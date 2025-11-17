import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Model, Message, ApiKeys, FineTuneSettings, ApiModes } from './types';
import { MODELS } from './constants';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import { generateGeminiResponse } from './services/geminiService';
import { generateMockResponse } from './services/mockAiService';
import { generateSimulatedResponse } from './services/simulationService';
import { generateLiveResponse } from './services/liveAiService';

const defaultFineTuneSettings: FineTuneSettings = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 1024,
  responseDelay: 1,
};

const defaultApiModes: ApiModes = {
  [Model.Grok]: 'mock',
  [Model.OpenAI]: 'mock',
  [Model.DeepSeek]: 'mock',
  [Model.ZAI]: 'mock',
};

const defaultApiKeys: ApiKeys = {
    [Model.Gemini]: '', [Model.OpenAI]: '', [Model.Grok]: '', [Model.DeepSeek]: '', [Model.ZAI]: '',
};

const defaultMasterPrompt = `You are an expert AI assistant participating in a collaborative forum with other AI models named Grok, Gemini, OpenAI, DeepSeek, and Z.ai. The user has provided a topic, and your collective goal is to explore it and build a comprehensive solution or understanding.

**Your Role:**
- **Contribute to a cumulative discussion.** Your response should consider the entire conversation, not just the most recent message. Synthesize existing points and introduce new ideas to move the conversation forward.
- **Engage in a forum-like dialogue.** You can directly address other models (e.g., "@Gemini, could you elaborate on your point about X?"). If you are mentioned by name, you should prioritize responding to that query.
- **Work towards consensus.** Strive to find common ground and build on the best ideas presented by the group. Your aim is to help the group reach a well-reasoned conclusion or a set of actionable steps.
- **Be concise and constructive.** Keep your responses focused and to the point. Add unique value with each turn.
- **Use Markdown for formatting** when it helps clarify your response (e.g., lists, bolding, code blocks).`;


// FIX: Define a shared interface for conversation history parts to ensure type safety when passing to AI services.
interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(defaultApiKeys);
  const [masterPrompt, setMasterPrompt] = useState(defaultMasterPrompt);
  const [fineTuneSettings, setFineTuneSettings] = useState<FineTuneSettings>(defaultFineTuneSettings);
  const [apiModes, setApiModes] = useState<ApiModes>(defaultApiModes);
  const [chatTopic, setChatTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isThinking, setIsThinking] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const turnIndexRef = useRef(0);
  // FIX: Explicitly initialize useRef with undefined to resolve a potential type inference issue causing an error.
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // Load user data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isDataLoaded) {
      const fetchUserData = async () => {
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(`/.netlify/functions/get-user-settings`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setApiKeys(data.api_keys || defaultApiKeys);
            setMasterPrompt(data.master_prompt || defaultMasterPrompt);
            setFineTuneSettings(data.fine_tune_settings || defaultFineTuneSettings);
            setApiModes(data.api_modes || defaultApiModes);
          } else if (response.status === 404) {
            console.log("New user, using default settings.");
          } else {
            throw new Error(`Failed to load settings: ${response.statusText}`);
          }
        } catch (err) {
          console.error(err);
          setError("Could not load your settings from the database.");
        } finally {
          setIsDataLoaded(true);
        }
      };
      fetchUserData();
    }
  }, [isAuthenticated, isDataLoaded, getAccessTokenSilently]);

  // Debounced save user data whenever it changes
  useEffect(() => {
    if (isAuthenticated && isDataLoaded) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const token = await getAccessTokenSilently();
          const settingsPayload = {
            apiKeys,
            masterPrompt,
            fineTuneSettings,
            apiModes
          };
          const response = await fetch('/.netlify/functions/save-user-settings', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settingsPayload),
          });
          if (!response.ok) {
            throw new Error('Failed to save settings to the database.');
          }
           console.log("Settings saved.");
        } catch (err) {
          console.error(err);
          setError("Could not save your settings. Please check your connection.");
        }
      }, 1500);
    }
     return () => clearTimeout(saveTimeoutRef.current);
  }, [apiKeys, masterPrompt, fineTuneSettings, apiModes, isAuthenticated, isDataLoaded, getAccessTokenSilently]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleStartChat = () => {
    if (!chatTopic.trim()) {
      setError('Please enter a chat topic.');
      return;
    }
    setError(null);
    setMessages([{ author: Model.User, content: chatTopic, id: crypto.randomUUID() }]);
    setIsChatting(true);
    turnIndexRef.current = 0;
  };

  const handleStopChat = () => {
    setIsChatting(false);
    setIsThinking(null);
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;
    const header = `AI Collab Chat\nTopic: ${chatTopic}\nMaster Prompt: ${masterPrompt}\n\n========================================\n\n`;
    const chatContent = messages.map(msg => `[${msg.author}]:\n${msg.content}`).join('\n\n');
    const fullText = header + chatContent;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-collab-chat-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    setMessages([]);
    handleStopChat();
    setError(null);
    turnIndexRef.current = 0;
  };

  const getNextResponse = useCallback(async () => {
    if (!isChatting) return;

    const currentTurnModel = MODELS[turnIndexRef.current];
    setIsThinking(currentTurnModel);

    // FIX: Explicitly type conversationHistory to ensure the 'role' property is correctly inferred as 'user' | 'model'.
    const conversationHistory: ConversationPart[] = messages.map(msg => ({
      role: msg.author === Model.User ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.author !== Model.User) {
        conversationHistory[conversationHistory.length-1].role = 'user';
    }

    try {
      let responseContent: string;
      if (currentTurnModel === Model.Gemini) {
        if (!apiKeys[Model.Gemini]) throw new Error('Gemini API key is missing.');
        responseContent = await generateGeminiResponse(apiKeys[Model.Gemini], masterPrompt, conversationHistory, fineTuneSettings);
      } else {
        const mode = apiModes[currentTurnModel as keyof ApiModes];
        if (mode === 'simulated') {
          if (!apiKeys[Model.Gemini]) throw new Error(`Gemini API key is required to simulate a response for ${currentTurnModel}.`);
          responseContent = await generateSimulatedResponse(apiKeys[Model.Gemini], currentTurnModel, masterPrompt, conversationHistory, fineTuneSettings);
        } else if (mode === 'live') {
          const modelApiKey = apiKeys[currentTurnModel as keyof ApiKeys];
          if (!modelApiKey) throw new Error(`${currentTurnModel} API key is required for live mode.`);
          responseContent = await generateLiveResponse(modelApiKey, currentTurnModel, masterPrompt, conversationHistory, fineTuneSettings);
        }
        else {
           responseContent = await generateMockResponse(currentTurnModel, masterPrompt, messages.map(m => m.content).join('\n'));
        }
      }

      setMessages(prev => [...prev, { author: currentTurnModel, content: responseContent, id: crypto.randomUUID() }]);
      turnIndexRef.current = (turnIndexRef.current + 1) % MODELS.length;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error from ${currentTurnModel}: ${errorMessage}`);
      handleStopChat();
    } finally {
      if (isChatting) {
        setIsThinking(null);
      }
    }
  }, [apiKeys, isChatting, masterPrompt, messages, fineTuneSettings, apiModes]);

  useEffect(() => {
    if (isChatting && messages.length > 0 && !isThinking) {
      const lastMessageAuthor = messages[messages.length - 1].author;
      if (lastMessageAuthor === Model.User || MODELS.includes(lastMessageAuthor as Model)) {
         const delay = (fineTuneSettings.responseDelay || 1) * 1000;
         const timeoutId = setTimeout(getNextResponse, delay);
         return () => clearTimeout(timeoutId);
      }
    }
  }, [messages, isChatting, isThinking, getNextResponse, fineTuneSettings.responseDelay]);
  
  const WelcomeComponent = () => (
     <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold">Welcome to AI Collab Chat</h1>
          <p className="mt-2 text-gray-400">Please log in to start collaborating with AI.</p>
           <button
              onClick={() => loginWithRedirect()}
              className="w-full mt-4 px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
            >
              Login / Sign Up
            </button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
       <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-xl">Initializing Auth Service...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <WelcomeComponent />;
  }
  
  if (isAuthenticated && !isDataLoaded) {
     return (
       <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-xl">Loading your settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-900 text-gray-100">
      <SettingsPanel
        currentUser={user}
        onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        apiKeys={apiKeys}
        setApiKeys={setApiKeys}
        masterPrompt={masterPrompt}
        setMasterPrompt={setMasterPrompt}
        fineTuneSettings={fineTuneSettings}
        setFineTuneSettings={setFineTuneSettings}
        apiModes={apiModes}
        setApiModes={setApiModes}
        chatTopic={chatTopic}
        setChatTopic={setChatTopic}
        isChatting={isChatting}
        onStart={handleStartChat}
        onStop={handleStopChat}
        onDownload={handleDownloadChat}
        onClear={handleClearChat}
        hasMessages={messages.length > 0}
      />
      <main className="flex-1 flex flex-col h-full">
        <ChatWindow
          messages={messages}
          isThinking={isThinking}
          error={error}
          messagesEndRef={messagesEndRef}
        />
      </main>
    </div>
  );
};

export default App;
