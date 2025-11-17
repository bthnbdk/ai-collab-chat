
import { Model } from './types';
import { GrokIcon, GeminiIcon, OpenAIIcon, DeepSeekIcon, ZaiIcon, UserIcon } from './components/icons';

export const MODELS = [Model.Grok, Model.Gemini, Model.OpenAI, Model.DeepSeek, Model.ZAI];

export const MODEL_CONFIG = {
  [Model.Grok]: { color: 'bg-grok', icon: GrokIcon },
  [Model.Gemini]: { color: 'bg-gemini', icon: GeminiIcon },
  [Model.OpenAI]: { color: 'bg-openai', icon: OpenAIIcon },
  [Model.DeepSeek]: { color: 'bg-deepseek', icon: DeepSeekIcon },
  [Model.ZAI]: { color: 'bg-zai', icon: ZaiIcon },
  [Model.User]: { color: 'bg-user', icon: UserIcon },
};
