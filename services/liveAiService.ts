import { Model, FineTuneSettings } from '../types';

interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Maps our internal model names to their API model names
const API_CONFIG: Record<string, { modelName: string; endpoint: string }> = {
  [Model.OpenAI]: { modelName: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions' },
  [Model.Grok]: { modelName: 'grok-4-latest', endpoint: 'https://api.x.ai/v1/chat/completions' },
  [Model.DeepSeek]: { modelName: 'deepseek-chat', endpoint: 'https://api.deepseek.com/v1/chat/completions' },
  [Model.ZAI]: { modelName: 'glm-4.6', endpoint: 'https://api.z.ai/api/paas/v4/chat/completions' },
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
        return `[Error] API configuration for ${model} is not defined.`;
    }
    
    // Grok API uses a different role name ('human' instead of 'user')
    const roleMapping = (role: 'user' | 'model') => {
        if (model === Model.Grok) return role === 'user' ? 'human' : 'assistant';
        return role === 'user' ? 'user' : 'assistant';
    };

    const messages = [
        { role: 'system', content: masterPrompt },
        ...conversationHistory.map(part => ({
            role: roleMapping(part.role),
            content: part.parts.map(p => p.text).join('')
        }))
    ];

    const body: { [key: string]: any } = {
        model: config.modelName,
        messages,
        max_tokens: settings.maxOutputTokens,
        temperature: settings.temperature,
    };

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorText = `HTTP error! status: ${response.status}`;
            try {
                // Try to parse as JSON first
                const errorData = await response.json();
                errorText = errorData.error?.message || errorData.message || JSON.stringify(errorData);
            } catch (e) {
                // If parsing fails, use the raw text body
                errorText = await response.text();
            }
            throw new Error(errorText);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || `No response from ${model}.`;

    } catch (error) {
        console.error(`Error calling ${model} API:`, error);
        if (error instanceof Error) {
             return `Failed to get live response from ${model}. Error: ${error.message}`;
        }
        return `An unknown error occurred while contacting the ${model} API.`;
    }
};


export const generateLiveResponse = async (
  apiKey: string,
  model: Model,
  masterPrompt: string,
  conversationHistory: ConversationPart[],
  settings: FineTuneSettings
): Promise<string> => {
    // Route to the generic API handler for all live models
    return callGenericApi(apiKey, model, masterPrompt, conversationHistory, settings);
};