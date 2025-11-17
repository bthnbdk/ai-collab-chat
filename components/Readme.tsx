import React from 'react';

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
        className="bg-gray-800 w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl p-6 text-gray-300 overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">How It Works</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div className="prose prose-invert prose-sm md:prose-base max-w-none space-y-4">
          <p>
            Welcome to AI Collab Chat! This application allows you to start a discussion on any topic and have multiple AI models collaborate to explore ideas and find solutions.
          </p>

          <h3 className="text-xl font-semibold">Secure User Login</h3>
          <p>
            This application uses Auth0 for secure authentication. All your settings, including API keys and preferences, will be securely saved to a database and linked to your account.
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
          
          <div className="bg-yellow-900/40 border border-yellow-600 text-yellow-300 p-4 rounded-lg">
             <h3 className="text-xl font-semibold text-yellow-200 mt-0">Troubleshooting Login Issues</h3>
             <p>If you're having trouble logging in, please check these two things in your Auth0 Dashboard:</p>
             <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>
                    <strong>Application Type:</strong> Go to <strong>Applications</strong>, select your app, and ensure the "Application Type" is set to <strong>Single Page Application</strong>.
                </li>
                 <li>
                    <strong>Allowed Callback URLs:</strong> Make sure your Netlify site URL (e.g., <code>https://your-site-name.netlify.app</code>) is listed. No <code>/callback</code> path is needed.
                </li>
             </ol>
          </div>

          <div className="text-center mt-6">
            <button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Readme;