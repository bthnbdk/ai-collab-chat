import { Model, FineTuneSettings, Message } from '@/types';

const API_CONFIG: Record<string, { modelName: string; endpoint: string }> = {
  [Model.OpenAI]: { modelName: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions' },
  [Model.Grok]: { modelName: 'grok-4-fast-reasoning', endpoint: 'https://api.x.ai/v1/chat/completions' },
  [Model.DeepSeek]: { modelName: 'deepseek-chat', endpoint: 'https://api.deepseek.com/chat/completions' },
  [Model.ZAI]: { modelName: 'glm-4.6', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions' },
};

const callGenericApi = async (
  apiKey: string,
  model: Model,
  masterPrompt: string,
  messages: Message[],
  settings: FineTuneSettings
): Promise<string> => {
    
    const config = API_CONFIG[model];
    if (!config) {
        throw new Error(`API configuration for ${model} is not defined.`);
    }
    
    // Construct messages for OpenAI-compatible endpoints
    // System: Master Prompt
    // Assistant: Previous messages from THIS model
    // User: Messages from User OR other AIs (prefixed)
    const apiMessages = [
        { role: 'system', content: masterPrompt },
        ...messages.map(msg => {
            if (msg.author === model) {
                return {
                    role: 'assistant',
                    content: msg.content
                };
            } else {
                const content = msg.author === Model.User 
                    ? msg.content 
                    : `[${msg.author}]: ${msg.content}`;
                return {
                    role: 'user',
                    content: content
                };
            }
        })
    ];

    const body: { [key: string]: any } = {
        model: config.modelName,
        messages: apiMessages,
        temperature: settings.temperature,
        stream: false,
        max_tokens: settings.maxOutputTokens,
    };

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify(body)
        });

        const responseClone = response.clone();

        if (!response.ok) {
            let errorText = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                // Clean up error message if it's nested
                errorText = errorData.error?.message || errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorText = await responseClone.text();
            }
            throw new Error(errorText);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || `(No valid response content from ${model})`;

    } catch (error) {
        console.error(`Error calling ${model} API:`, error);
        if (error instanceof Error) {
             throw new Error(error.message);
        }
        throw new Error(`An unknown error occurred while contacting the ${model} API.`);
    }
};

export const generateLiveResponse = (
  apiKey: string,
  model: Model,
  masterPrompt: string,
  messages: Message[],
  settings: FineTuneSettings
): Promise<string> => {
    return callGenericApi(apiKey, model, masterPrompt, messages, settings);
};