import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Model, Message, ApiKeys, FineTuneSettings, ApiModes } from '@/types';
import { MODELS } from '@/constants';
import { generateGeminiResponse } from '@/services/geminiService';
import { generateMockResponse } from '@/services/mockAiService';
import { generateSimulatedResponse } from '@/services/simulationService';
import { generateLiveResponse } from '@/services/liveAiService';

interface AppState {
  isLoggedIn: boolean;
  apiKeys: ApiKeys;
  masterPrompt: string;
  fineTuneSettings: FineTuneSettings;
  apiModes: ApiModes;
  chatTopic: string;
  messages: Message[];
  isChatting: boolean;
  isThinking: Model | null;
  turnIndex: number;

  handleLogin: (password: string) => boolean;
  setApiKey: (model: Model, key: string) => void;
  setMasterPrompt: (prompt: string) => void;
  setFineTuneSetting: <K extends keyof FineTuneSettings>(setting: K, value: FineTuneSettings[K]) => void;
  setApiMode: (model: Model, mode: 'mock' | 'simulated' | 'live') => void;
  setChatTopic: (topic: string) => void;
  
  startChat: () => void;
  stopChat: () => void;
  clearChat: () => void;
  downloadChat: () => void;
  
  addMessage: (message: Message) => void;
  getNextResponse: () => Promise<void>;
}

const defaultFineTuneSettings: FineTuneSettings = {
  temperature: 0.7,
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 512,
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // STATE
      isLoggedIn: false,
      apiKeys: defaultApiKeys,
      masterPrompt: defaultMasterPrompt,
      fineTuneSettings: defaultFineTuneSettings,
      apiModes: defaultApiModes,
      chatTopic: '',
      messages: [],
      isChatting: false,
      isThinking: null,
      turnIndex: 0,

      // ACTIONS
      handleLogin: (password: string) => {
        if (password === 'ai-collab') {
          set({ isLoggedIn: true });
          return true;
        }
        return false;
      },
      setApiKey: (model, key) => set(state => ({ apiKeys: { ...state.apiKeys, [model]: key } })),
      setMasterPrompt: (prompt) => set({ masterPrompt: prompt }),
      setFineTuneSetting: (setting, value) => set(state => ({ fineTuneSettings: { ...state.fineTuneSettings, [setting]: value } })),
      setApiMode: (model, mode) => set(state => ({ apiModes: { ...state.apiModes, [model as keyof ApiModes]: mode } })),
      setChatTopic: (topic) => set({ chatTopic: topic }),

      addMessage: (message) => set(state => ({ messages: [...state.messages, message] })),

      startChat: () => {
        const { chatTopic, getNextResponse } = get();
        if (!chatTopic.trim()) {
          alert('Please enter a chat topic.');
          return;
        }
        set({
          isChatting: true,
          turnIndex: 0,
          messages: [{ author: Model.User, content: chatTopic, id: crypto.randomUUID() }]
        });
        setTimeout(getNextResponse, 100);
      },

      stopChat: () => set({ isChatting: false, isThinking: null }),
      clearChat: () => set({ messages: [], chatTopic: '', isChatting: false, isThinking: null, turnIndex: 0 }),
      downloadChat: () => {
          const { messages, chatTopic, masterPrompt } = get();
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
      },

      getNextResponse: async () => {
        const { isChatting, turnIndex, messages, apiKeys, masterPrompt, fineTuneSettings, apiModes, addMessage, getNextResponse } = get();
        if (!isChatting) return;

        const currentTurnModel = MODELS[turnIndex];
        set({ isThinking: currentTurnModel });

        const conversationHistory = messages.map(msg => ({
          role: msg.author === Model.User ? 'user' : 'model' as 'user' | 'model',
          parts: [{ text: msg.content }],
        }));
        
        try {
            let responseContent: string = "";
            
            if (currentTurnModel === Model.Gemini) {
                responseContent = await generateGeminiResponse(apiKeys.Gemini, masterPrompt, conversationHistory, fineTuneSettings);
            } else {
                const mode = apiModes[currentTurnModel as keyof ApiModes];
                if (mode === 'simulated') {
                    responseContent = await generateSimulatedResponse(apiKeys.Gemini, currentTurnModel, masterPrompt, conversationHistory, fineTuneSettings);
                } else if (mode === 'live') {
                    const modelApiKey = apiKeys[currentTurnModel as keyof ApiKeys];
                    responseContent = await generateLiveResponse(modelApiKey, currentTurnModel, masterPrompt, conversationHistory, fineTuneSettings);
                }
                else { // mock mode
                   responseContent = await generateMockResponse(currentTurnModel, masterPrompt, messages.map(m => m.content).join('\n'));
                }
            }
            
            addMessage({ author: currentTurnModel, content: responseContent || "(No content)", id: crypto.randomUUID() });
            set({ turnIndex: (turnIndex + 1) % MODELS.length });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            addMessage({ author: currentTurnModel, content: errorMessage, id: crypto.randomUUID(), isError: true });
            set({ turnIndex: (turnIndex + 1) % MODELS.length });
        } finally {
            if (get().isChatting) {
                set({ isThinking: null });
                const delay = get().fineTuneSettings.responseDelay * 1000;
                setTimeout(getNextResponse, delay);
            }
        }
      },
    }),
    {
      name: 'ai-collab-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        apiKeys: state.apiKeys,
        masterPrompt: state.masterPrompt,
        fineTuneSettings: state.fineTuneSettings,
        apiModes: state.apiModes,
      }),
    }
  )
);