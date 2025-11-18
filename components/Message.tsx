import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { Message } from '@/types';
import { MODEL_CONFIG } from '@/constants';
import { CopyIcon, CheckIcon } from '@/components/icons';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const { author, content, isError } = message;
  const isUser = author === 'User';
  const { color, icon: Icon } = MODEL_CONFIG[author];
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  };

  const renderedContent = useMemo(() => {
    if (isError) {
      return { __html: `<p><strong>Error from ${author}:</strong> ${content}</p>` };
    }
    try {
        let rawMarkup = '';
        // Check if marked is available and has the parse method
        // This guards against potential import issues or version mismatches
        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
             rawMarkup = marked.parse(content || '', { gfm: true, breaks: true }) as string;
        } else {
             // Fallback if marked is not working
             rawMarkup = content || '';
             console.warn('marked library not available or parse method missing');
        }
        return { __html: rawMarkup };
    } catch (error) {
        console.error("Error parsing markdown:", error);
        return { __html: `<p>${content}</p>` };
    }
  }, [content, isError, author]);

  const containerClasses = `flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
  
  const getBubbleClasses = () => {
    const baseClasses = "max-w-xl p-3 rounded-lg prose prose-sm prose-invert prose-headings:my-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:bg-gray-800 prose-pre:p-2 prose-pre:rounded-md prose-code:before:content-[''] prose-code:after:content-[''] whitespace-pre-wrap";
    if (isError) {
      return `${baseClasses} bg-destructive/80 text-destructive-foreground rounded-bl-none`;
    }
    if (isUser) {
      return `${baseClasses} bg-primary text-primary-foreground rounded-br-none`;
    }
    return `${baseClasses} bg-card text-card-foreground border rounded-bl-none`;
  };
  
  const iconContainerClasses = `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isError ? 'bg-destructive' : color}`;

  return (
    <div className={containerClasses}>
      <div className={iconContainerClasses}>
        <Icon />
      </div>
      <div className={`flex flex-col flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && <p className="text-sm font-bold text-muted-foreground mb-1">{author}</p>}
        <div className="group relative">
          <div className={getBubbleClasses()} dangerouslySetInnerHTML={renderedContent} />
           {!isError && (
             <button
              onClick={handleCopy}
              className={`absolute top-1 p-1.5 rounded-md bg-black/20 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 ${isUser ? 'left-1' : 'right-1'}`}
              aria-label="Copy message"
            >
              {isCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;