import React, { useRef, useEffect } from 'react';
import { Model } from '@/types';
import { MODEL_CONFIG } from '@/constants';
import MessageComponent from '@/components/Message';
import { useStore } from '@/store';

const TypingIndicator: React.FC<{ model: Model }> = ({ model }) => {
  const { icon: Icon } = MODEL_CONFIG[model];
  return (
    <div className="flex items-center space-x-3 p-4">
      <div className="w-8 h-8 flex-shrink-0">
        <Icon />
      </div>
      <div className="flex items-center space-x-1">
        <span className="font-bold">{model} is thinking</span>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

const WelcomeScreen = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
    <div className="max-w-md">
      <h1 className="text-4xl font-bold text-foreground">AI Collab Chat</h1>
      <p className="mt-2">Provide a topic and watch the AIs collaborate to find a solution.</p>
      <p className="mt-4 text-sm">
        To begin, set your API keys, master prompt, and a chat topic in the panel on the left, then click "Start Chat".
      </p>
    </div>
  </div>
);

const ChatWindow: React.FC = () => {
  const messages = useStore(state => state.messages);
  const isThinking = useStore(state => state.isThinking);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && !isThinking ? (
          <WelcomeScreen />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageComponent key={msg.id} message={msg} />
            ))}
            {isThinking && <TypingIndicator model={isThinking} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
