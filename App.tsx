import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Model, Message, ApiKeys, FineTuneSettings, ApiModes, AppError } from './types';
import { MODELS } from './constants';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
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

interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    try {
        const savedKeys = localStorage.getItem('apiKeys');
        return savedKeys ? JSON.parse(savedKeys) : defaultApiKeys;
    } catch (error) {
        console.error('Failed to load API keys from localStorage', error);
        return defaultApiKeys;
    }
  });
  const [masterPrompt, setMasterPrompt] = useState(defaultMasterPrompt);
  const [fineTuneSettings, setFineTuneSettings] = useState<FineTuneSettings>(defaultFineTuneSettings);
  const [apiModes, setApiModes] = useState<ApiModes>(defaultApiModes);
  const [chatTopic, setChatTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isThinking, setIsThinking] = useState<Model | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const turnIndexRef = useRef(0);

  useEffect(() => {
    try {
        localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    } catch (error) {
        console.error('Failed to save API keys to localStorage', error);
    }
  }, [apiKeys]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleStartChat = () => {
    if (!chatTopic.trim()) {
      setError({ message: 'Please enter a chat topic.' });
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

    const conversationHistory: ConversationPart[] = messages.map(msg => ({
      role: msg.author === Model.User ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.author !== Model.User) {
        conversationHistory[conversationHistory.length-1].role = 'user';
    }

    try {
        let responsePromise: Promise<string>;
        let needsTimeout = true;
        const API_TIMEOUT = 30000; // 30 seconds

        if (currentTurnModel === Model.Gemini) {
            if (!apiKeys[Model.Gemini]) throw new Error('Gemini API key is missing.');
            responsePromise = generateGeminiResponse(apiKeys[Model.Gemini], masterPrompt, conversationHistory, fineTuneSettings);
        } else {
            const mode = apiModes[currentTurnModel as keyof ApiModes];
            if (mode === 'simulated') {
                if (!apiKeys[Model.Gemini]) throw new Error(`Gemini API key is required to simulate a response for ${currentTurnModel}.`);
                responsePromise = generateSimulatedResponse(apiKeys[Model.Gemini], currentTurnModel, masterPrompt, conversationHistory, fineTuneSettings);
            } else if (mode === 'live') {
                const modelApiKey = apiKeys[currentTurnModel as keyof ApiKeys];
                if (!modelApiKey) throw new Error(`${currentTurnModel} API key is required for live mode.`);
                responsePromise = generateLiveResponse(modelApiKey, currentTurnModel, masterPrompt, conversationHistory, fineTuneSettings);
            }
            else { // mock mode
               responsePromise = generateMockResponse(currentTurnModel, masterPrompt, messages.map(m => m.content).join('\n'));
               needsTimeout = false;
            }
        }

        const timeoutPromise = new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error(`Response timed out after ${API_TIMEOUT / 1000} seconds.`)), API_TIMEOUT)
        );
        
        const responseContent = await (needsTimeout 
            ? Promise.race([responsePromise, timeoutPromise])
            : responsePromise
        );

        setMessages(prev => [...prev, { author: currentTurnModel, content: responseContent, id: crypto.randomUUID() }]);
        turnIndexRef.current = (turnIndexRef.current + 1) % MODELS.length;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError({ model: currentTurnModel, message: errorMessage });
        turnIndexRef.current = (turnIndexRef.current + 1) % MODELS.length;
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

  const handleLogin = (password: string) => {
    // Hardcoded password check
    if (password === 'ai-collab') {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }
  
  return (
    <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-900 text-gray-100">
      <SettingsPanel
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