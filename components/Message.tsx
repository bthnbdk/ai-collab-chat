import React, { useState } from 'react';
import { Message } from '../types';
import { MODEL_CONFIG } from '../constants';
import { CopyIcon, CheckIcon } from './icons';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const { author, content } = message;
  const isUser = author === 'User';
  const { color, icon: Icon } = MODEL_CONFIG[author];
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  };

  const containerClasses = `flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
  const bubbleClasses = `max-w-xl p-3 rounded-lg whitespace-pre-wrap ${
    isUser
      ? 'bg-blue-800 text-white rounded-br-none'
      : `bg-gray-700 text-gray-200 rounded-bl-none`
  }`;
  
  const iconContainerClasses = `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`;

  return (
    <div className={containerClasses}>
      <div className={iconContainerClasses}>
        <Icon />
      </div>
      <div className={`flex flex-col flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && <p className="text-sm font-bold text-gray-400 mb-1">{author}</p>}
        <div className="group relative">
          <div className={bubbleClasses}>
            <p className="text-sm">{content}</p>
          </div>
           <button
            onClick={handleCopy}
            className={`absolute top-1 p-1.5 rounded-md bg-black/20 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 ${isUser ? 'left-1' : 'right-1'}`}
            aria-label="Copy message"
          >
            {isCopied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
