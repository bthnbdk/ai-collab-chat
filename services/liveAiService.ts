import { Model, FineTuneSettings } from '@/types';

interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const API_CONFIG: Record<string, { modelName: string; endpoint: string }> = {
  [Model.OpenAI]: { modelName: 'gpt-5-nano', endpoint: 'https://api.openai.com/v1/chat/completions' },
  [Model.Grok]: { modelName: 'grok-4-fast-reasoning', endpoint: 'https://api.x.ai/v1/chat/completions' },
  [Model.DeepSeek]: { modelName: 'deepseek-chat', endpoint: 'https://api.deepseek.com/v1/chat/completions' },
  [Model.ZAI]: { modelName: 'glm-4.5-air', endpoint: 'https://api.z.ai/api/paas/v4/chat/completions' },
};

const callGenericApi = async (
  apiKey: string,
  model: Model,
  masterPrompt: string,
  conversationHistory: ConversationPart[],
  settings: FineTuneSettings
): Promise<string> => {
    
    const config = API_CONFIG[model];
    if (!config) {
        throw new Error(`API configuration for ${model} is not defined.`);
    }
    
    const roleMapping = (role: 'user' | 'model', currentModel: Model) => {
        if (currentModel === Model.Grok) {
            return role === 'user' ? 'user' : 'assistant';
        }
        return role === 'user' ? 'user' : 'assistant';
    };

    const messages = [
        { role: 'system', content: masterPrompt },
        ...conversationHistory.map(part => ({
            role: roleMapping(part.role, model),
            content: part.parts.map(p => p.text).join('')
        }))
    ];

    const body: { [key: string]: any } = {
        model: config.modelName,
        messages,
        temperature: settings.temperature,
        stream: false,
    };
    
    if (model === Model.OpenAI) {
        body.max_completion_tokens = settings.maxOutputTokens;
    } else {
        body.max_tokens = settings.maxOutputTokens;
    }

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
                errorText = errorData.error?.message || errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorText = await responseClone.text();
            }
            throw new Error(errorText);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || `No valid response content from ${model}.`;

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
  conversationHistory: ConversationPart[],
  settings: FineTuneSettings
): Promise<string> => {
    return callGenericApi(apiKey, model, masterPrompt, conversationHistory, settings);
};
