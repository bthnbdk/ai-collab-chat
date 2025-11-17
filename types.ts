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

export interface FineTuneSettings {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
  responseDelay: number; // in seconds
}

export type ApiMode = 'mock' | 'simulated' | 'live';

export type ApiModes = {
  [Model.Grok]: ApiMode;
  [Model.OpenAI]: ApiMode;
  [Model.DeepSeek]: ApiMode;
  [Model.ZAI]: ApiMode;
};

export interface AppError {
  model?: Model;
  message: string;
}