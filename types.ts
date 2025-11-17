export enum Model {
  Grok = 'Grok',
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek',
  ZAI = 'Z.ai',
  User = 'User',
}

export interface Message {
  author: Model;
  content: string;
  id: string;
}

export type ApiKeys = {
  [Model.Gemini]: string;
  [Model.OpenAI]: string;
  [Model.Grok]: string;
  [Model.DeepSeek]: string;
  [Model.ZAI]: string;
};

export interface GeminiSettings {
  temperature: number;
  topK: number;
  topP: number;
}

export type ApiModes = {
  [Model.Grok]: 'mock' | 'live';
  [Model.OpenAI]: 'mock' | 'live';
  [Model.DeepSeek]: 'mock' | 'live';
  [Model.ZAI]: 'mock' | 'live';
};
