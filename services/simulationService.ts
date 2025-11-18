import { GoogleGenAI } from "@google/genai";
import { FineTuneSettings, Model, Message } from "@/types";

interface ConversationPart {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const generateSimulatedResponse = async (
  apiKey: string,
  modelToSimulate: Model,
  systemInstruction: string,
  messages: Message[],
  settings: FineTuneSettings
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key not provided for simulation.");
  }

  // Create a specialized system instruction for role-playing
  const simulationInstruction = `[SYSTEM NOTE: You are currently role-playing as the AI model named '${modelToSimulate}'. Based on your training data, adopt its known persona, characteristics, and response style. Your goal is to convincingly simulate this specific AI.]

The user's original master prompt for the collaboration is:
---
${systemInstruction}
---
  `;
  
  // Construct history. 
  // Since we are simulating 'modelToSimulate' using Gemini, 
  // any message ACTUALLY from 'modelToSimulate' (in previous turns) should be treated as 'model' (self).
  // All others are 'user' with attribution.
  const conversationHistory: ConversationPart[] = messages.map(msg => {
      if (msg.author === modelToSimulate) {
          return {
              role: 'model',
              parts: [{ text: msg.content }]
          };
      } else {
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
      model: 'gemini-2.5-flash',
      contents: conversationHistory,
      config: {
        systemInstruction: simulationInstruction,
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        maxOutputTokens: settings.maxOutputTokens,
      },
    });

    return response.text || "";
  } catch (error) {
    console.error(`Error simulating ${modelToSimulate} with Gemini API:`, error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          throw new Error(`The provided Gemini API key is not valid.`);
        }
        throw new Error(error.message);
    }
    throw new Error(`An unknown error occurred while simulating ${modelToSimulate}.`);
  }
};