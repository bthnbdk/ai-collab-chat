import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Model, Message, ApiKeys, GeminiSettings, ApiModes } from './types';
import { MODELS } from './constants';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import { generateGeminiResponse } from './services/geminiService';
import { generateMockResponse } from './services/mockAiService';
import { generateSimulatedResponse } from './services/simulationService';

const LOCAL_STORAGE_USER_KEY = 'ai-collab-chat-user';
const LOCAL_STORAGE_DATA_KEY = 'ai-collab-chat-data';

const defaultGeminiSettings: GeminiSettings = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
};

const defaultApiModes: ApiModes = {
  [Model.Grok]: 'mock',
  [Model.OpenAI]: 'mock',
  [Model.DeepSeek]: 'mock',
  [Model.ZAI]: 'mock',
};

const defaultMasterPrompt = `You are an expert AI assistant participating in a collaborative forum with other AI models named Grok, Gemini, OpenAI, DeepSeek, and Z.ai. The user has provided a topic, and your collective goal is to explore it and build a comprehensive solution or understanding.

**Your Role:**
- **Contribute to a cumulative discussion.** Your response should consider the entire conversation, not just the most recent message. Synthesize existing points and introduce new ideas to move the conversation forward.
- **Engage in a forum-like dialogue.** You can directly address other models (e.g., "@Gemini, could you elaborate on your point about X?"). If you are mentioned by name, you should prioritize responding to that query.
- **Work towards consensus.** Strive to find common ground and build on the best ideas presented by the group. Your aim is to help the group reach a well-reasoned conclusion or a set of actionable steps.
- **Be concise and constructive.** Keep your responses focused and to the point. Add unique value with each turn.`;


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    [Model.Gemini]: '', [Model.OpenAI]: '', [Model.Grok]: '', [Model.DeepSeek]: '', [Model.ZAI]: '',
  });
  const [masterPrompt, setMasterPrompt] = useState(defaultMasterPrompt);
  const [geminiSettings, setGeminiSettings] = useState<GeminiSettings>(defaultGeminiSettings);
  const [apiModes, setApiModes] = useState<ApiModes>(defaultApiModes);
  const [chatTopic, setChatTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isThinking, setIsThinking] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const turnIndexRef = useRef(0);

  // Check for logged in user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (storedUser) {
      setCurrentUser(storedUser);
    }
  }, []);

  // Load user data when user logs in
  useEffect(() => {
    if (currentUser) {
      const allData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DATA_KEY) || '{}');
      const userData = allData[currentUser] || {};
      setApiKeys(userData.apiKeys || { [Model.Gemini]: '', [Model.OpenAI]: '', [Model.Grok]: '', [Model.DeepSeek]: '', [Model.ZAI]: '' });
      setMasterPrompt(userData.masterPrompt || defaultMasterPrompt);
      setGeminiSettings(userData.geminiSettings || defaultGeminiSettings);
      setApiModes(userData.apiModes || defaultApiModes);
    }
  }, [currentUser]);

  // Save user data whenever it changes
  useEffect(() => {
    if (currentUser) {
      const allData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DATA_KEY) || '{}');
      allData[currentUser] = { apiKeys, masterPrompt, geminiSettings, apiModes };
      localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(allData));
    }
  }, [apiKeys, masterPrompt, geminiSettings, apiModes, currentUser]);


  const handleLogin = (username: string) => {
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, trimmedUsername);
      setCurrentUser(trimmedUsername);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setCurrentUser(null);
    setMessages([]);
    setChatTopic('');
    handleStopChat();
  };

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

    const conversationHistory = messages.map(msg => ({
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
        responseContent = await generateGeminiResponse(apiKeys[Model.Gemini], masterPrompt, conversationHistory, geminiSettings);
      } else {
        const mode = apiModes[currentTurnModel as keyof ApiModes];
        if (mode === 'live') {
          if (!apiKeys[Model.Gemini]) throw new Error(`Gemini API key is required to simulate a 'live' response for ${currentTurnModel}.`);
          responseContent = await generateSimulatedResponse(apiKeys[Model.Gemini], currentTurnModel, masterPrompt, conversationHistory, geminiSettings);
        } else {
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
  }, [apiKeys, isChatting, masterPrompt, messages, geminiSettings, apiModes]);

  useEffect(() => {
    if (isChatting && messages.length > 0 && !isThinking) {
      const lastMessageAuthor = messages[messages.length - 1].author;
      if (lastMessageAuthor === Model.User || MODELS.includes(lastMessageAuthor as Model)) {
         const timeoutId = setTimeout(getNextResponse, 1000);
         return () => clearTimeout(timeoutId);
      }
    }
  }, [messages, isChatting, isThinking, getNextResponse]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-900 text-gray-100">
      <SettingsPanel
        currentUser={currentUser}
        onLogout={handleLogout}
        apiKeys={apiKeys}
        setApiKeys={setApiKeys}
        masterPrompt={masterPrompt}
        setMasterPrompt={setMasterPrompt}
        geminiSettings={geminiSettings}
        setGeminiSettings={setGeminiSettings}
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