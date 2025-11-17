import { Model, FineTuneSettings } from '../types';

interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Maps our internal model names to their API model names
const API_CONFIG: Record<string, { modelName: string; endpoint: string }> = {
  [Model.OpenAI]: { modelName: 'gpt-5-nano', endpoint: 'https://api.openai.com/v1/chat/completions' },
  [Model.Grok]: { modelName: 'grok-4-latest', endpoint: 'https://api.x.ai/v1/chat/completions' },
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
        return `[Error] API configuration for ${model} is not defined.`;
    }
    
    // Standardize roles for API compatibility
    const roleMapping = (role: 'user' | 'model') => {
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
        temperature: settings.temperature,
        stream: false, // Ensure non-streaming response for stability
    };
    
    // Handle model-specific parameter differences
    if (model === Model.OpenAI) {
        body.max_completion_tokens = settings.maxOutputTokens;
    } else {
        body.max_tokens = settings.maxOutputTokens;
    }

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
            const responseClone = response.clone(); // Clone the response to read body twice
            let errorText = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorText = errorData.error?.message || errorData.message || JSON.stringify(errorData);
            } catch (e) {
                // If parsing JSON fails, read the body as plain text from the clone
                errorText = await responseClone.text();
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