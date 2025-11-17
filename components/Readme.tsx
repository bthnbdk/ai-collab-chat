import React from 'react';
import { Button } from '@/components/ui/button';

interface ReadmeProps {
  onClose: () => void;
}

const Readme: React.FC<ReadmeProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl p-6 text-card-foreground overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">How It Works</h2>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onClose} 
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
        </div>
        
        <div className="prose prose-invert prose-sm md:prose-base max-w-none space-y-4">
          <p>
            Welcome to AI Collab Chat! This application allows you to start a discussion on any topic and have multiple AI models collaborate to explore ideas and find solutions.
          </p>

          <h3 className="text-xl font-semibold">Simple & Secure Access</h3>
          <p>
            This application uses a single, static password for access. There are no user accounts. Your API keys are securely saved in your browser's local storage, so you only need to enter them once. They are never stored on a server.
          </p>

          <h3 className="text-xl font-semibold">AI Modes Explained</h3>
          <p>Each non-Gemini AI model can operate in one of three modes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Mock:</strong> This is the default mode. It uses pre-written, offline responses to simulate a conversation. It's fast and doesn't require any API keys.
            </li>
            <li>
              <strong>Simulated:</strong> This mode uses the powerful Gemini model to role-play as another AI (like Grok or OpenAI). It provides dynamic, context-aware responses that mimic the chosen AI's style. This mode requires a valid <strong>Gemini API key</strong>.
            </li>
            <li>
              <strong>Live:</strong> This mode makes a direct call to the AI's actual API server. You must provide a valid API key for that specific model to use this mode. All models (OpenAI, Grok, DeepSeek, Z.ai) are now implemented.
            </li>
          </ul>

          <h3 className="text-xl font-semibold">API Keys</h3>
           <ul className="list-disc pl-5 space-y-2">
            <li>Your API keys are saved to your browser's local storage and will be remembered for your next session.</li>
            <li><strong>Gemini Key:</strong> This key is <strong>required</strong> for Gemini's own turns and to power the "Simulated" mode for all other AIs.</li>
            <li><strong>Other Keys (OpenAI, etc.):</strong> These are only needed if you want to use the "Live" mode for that specific AI.</li>
          </ul>

          <h3 className="text-xl font-semibold">AI Fine-Tuning</h3>
          <p>You can adjust several parameters to control the AI's behavior:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Temperature, Top K, Top P:</strong> These settings control the randomness and creativity of the Gemini and Simulated responses. Higher values lead to more creative (but potentially less coherent) answers.</li>
            <li><strong>Max Output Tokens:</strong> Sets the maximum length of a response from Gemini and all Live models. This helps control costs and keeps replies concise.</li>
            <li><strong>Response Delay:</strong> Adds a pause (in seconds) between each AI's turn, making the conversation easier to follow.</li>
          </ul>
          
          <div className="text-center mt-6">
            <Button onClick={onClose}>
              Got it!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Readme;
