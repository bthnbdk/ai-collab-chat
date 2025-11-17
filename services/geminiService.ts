import { GoogleGenAI } from "@google/genai";
import { GeminiSettings } from "../types";

interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const generateGeminiResponse = async (
  apiKey: string,
  systemInstruction: string,
  conversationHistory: ConversationPart[],
  settings: GeminiSettings
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key not provided.");
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationHistory,
      config: {
        systemInstruction,
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          return `Failed to get response from Gemini. Error: The provided API key is not valid. Please check the key in the settings panel.`;
        }
        return `Failed to get response from Gemini. Error: ${error.message}`;
    }
    return "An unknown error occurred while contacting the Gemini API.";
  }
};
