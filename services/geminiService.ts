import { GoogleGenAI } from "@google/genai";
import { FineTuneSettings, Message, Model } from "@/types";

interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const generateGeminiResponse = async (
  apiKey: string,
  systemInstruction: string,
  messages: Message[],
  settings: FineTuneSettings
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key not provided.");
  }
  
  // Construct conversation history
  // For Gemini, 'model' role is for ITSELF. 
  // Other AIs should be presented as 'user' messages with attribution.
  const conversationHistory: ConversationPart[] = messages.map(msg => {
    if (msg.author === Model.Gemini) {
        return {
            role: 'model',
            parts: [{ text: msg.content }]
        };
    } else {
        // If it's the User, just send content.
        // If it's another AI, prefix with name.
        const text = msg.author === Model.User 
            ? msg.content 
            : `[${msg.author}]: ${msg.content}`;
            
        return {
            role: 'user',
            parts: [{ text }]
        };
    }
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: conversationHistory,
      config: {
        systemInstruction,
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        maxOutputTokens: settings.maxOutputTokens,
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          throw new Error(`The provided API key is not valid. Please check the key in the settings panel.`);
        }
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};