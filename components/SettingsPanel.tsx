import React, { useState } from 'react';
import { Model, ApiMode } from '@/types';
import Readme from '@/components/Readme';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const SettingsPanel: React.FC = () => {
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  
  const {
    apiKeys, setApiKey, masterPrompt, setMasterPrompt, fineTuneSettings, setFineTuneSetting,
    apiModes, setApiMode, chatTopic, setChatTopic, isChatting, startChat, stopChat,
    downloadChat, clearChat, messages
  } = useStore();

  const modelsToDisplay = [Model.Gemini, Model.Grok, Model.OpenAI, Model.DeepSeek, Model.ZAI];

  const getButtonClass = (currentMode: ApiMode, buttonMode: ApiMode) => {
    // FIX: The 'primary' variant does not exist on the Button component.
    // The intended variant for the primary button style is 'default'.
    return currentMode === buttonMode ? 'default' : 'secondary';
  };
  
  const hasMessages = messages.length > 0;

  return (
    <>
      <aside className="w-full md:w-1/3 lg:w-1/4 p-4 bg-card border-r flex flex-col space-y-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">AI Collab Chat</h1>
        </div>
        
        <div>
          <Label htmlFor="master-prompt">Master Prompt</Label>
          <Textarea
            id="master-prompt"
            rows={6}
            className="mt-1"
            value={masterPrompt}
            onChange={(e) => setMasterPrompt(e.target.value)}
            disabled={isChatting}
          />
        </div>

        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>AI Models & Keys</AccordionTrigger>
                <AccordionContent className="space-y-3">
                    {modelsToDisplay.map(model => (
                      <Card key={model}>
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{model}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                            {model !== Model.Gemini && (
                              <div>
                                <Label className="text-xs">Mode</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <Button size="sm" variant={getButtonClass(apiModes[model], 'mock')} onClick={() => setApiMode(model, 'mock')} disabled={isChatting}>Mock</Button>
                                    <Button size="sm" variant={getButtonClass(apiModes[model], 'simulated')} onClick={() => setApiMode(model, 'simulated')} disabled={isChatting}>Simulated</Button>
                                    <Button size="sm" variant={getButtonClass(apiModes[model], 'live')} onClick={() => setApiMode(model, 'live')} disabled={isChatting || !apiKeys[model]}>Live</Button>
                                </div>
                              </div>
                            )}
                            <Input
                              type="password"
                              id={`${model}-key`}
                              placeholder={model === Model.Gemini ? 'Required' : 'Optional, for Live mode'}
                              value={apiKeys[model] || ''}
                              onChange={(e) => setApiKey(model, e.target.value)}
                              disabled={isChatting}
                              autoComplete="off"
                            />
                        </CardContent>
                      </Card>
                    ))}
                     <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md space-y-1">
                      <p><span className="font-bold">Gemini Key:</span> Required for its own turns and for 'Simulated' mode.</p>
                      <p><span className="font-bold">Other Keys:</span> Required for 'Live' mode for that AI.</p>
                      <p>Get a Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.</p>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>AI Fine-Tuning</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-2">
                    <div className="text-sm space-y-2">
                        <Label htmlFor="temperature" className="flex justify-between"><span>Temperature (Gemini/Simulated)</span> <span>{fineTuneSettings.temperature.toFixed(2)}</span></Label>
                        <Slider id="temperature" min={0} max={1} step={0.01} value={[fineTuneSettings.temperature]} onValueChange={([val]) => setFineTuneSetting('temperature', val)} disabled={isChatting} />
                    </div>
                    <div className="text-sm space-y-2">
                        <Label htmlFor="topK" className="flex justify-between"><span>Top K (Gemini/Simulated)</span> <span>{fineTuneSettings.topK}</span></Label>
                        <Slider id="topK" min={1} max={100} step={1} value={[fineTuneSettings.topK]} onValueChange={([val]) => setFineTuneSetting('topK', val)} disabled={isChatting} />
                    </div>
                    <div className="text-sm space-y-2">
                        <Label htmlFor="topP" className="flex justify-between"><span>Top P (Gemini/Simulated)</span> <span>{fineTuneSettings.topP.toFixed(2)}</span></Label>
                        <Slider id="topP" min={0} max={1} step={0.01} value={[fineTuneSettings.topP]} onValueChange={([val]) => setFineTuneSetting('topP', val)} disabled={isChatting} />
                    </div>
                    <div className="text-sm space-y-2">
                        <Label htmlFor="maxOutputTokens" className="flex justify-between"><span>Max Output Tokens</span> <span>{fineTuneSettings.maxOutputTokens}</span></Label>
                        <Slider id="maxOutputTokens" min={64} max={8192} step={64} value={[fineTuneSettings.maxOutputTokens]} onValueChange={([val]) => setFineTuneSetting('maxOutputTokens', val)} disabled={isChatting} />
                    </div>
                    <div className="text-sm space-y-2">
                        <Label htmlFor="responseDelay" className="flex justify-between"><span>Response Delay (seconds)</span> <span>{fineTuneSettings.responseDelay}s</span></Label>
                         <Slider id="responseDelay" min={0} max={10} step={0.5} value={[fineTuneSettings.responseDelay]} onValueChange={([val]) => setFineTuneSetting('responseDelay', val)} disabled={isChatting} />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <div className="flex-grow"></div>

        <div className="space-y-4 border-t pt-4">
           <Button 
            variant="link"
            onClick={() => setIsReadmeOpen(true)}
            className="w-full"
           >
            How It Works
          </Button>
          <Textarea
            rows={3}
            placeholder="Enter the chat topic here..."
            value={chatTopic}
            onChange={(e) => setChatTopic(e.target.value)}
            disabled={isChatting}
          />
          {isChatting ? (
            <Button
              onClick={stopChat}
              variant="destructive"
              className="w-full"
            >
              Stop Chat
            </Button>
          ) : (
            <Button
              onClick={startChat}
              className="w-full"
            >
              Start Chat
            </Button>
          )}
           <div className="flex space-x-2">
            <Button
              onClick={downloadChat}
              disabled={!hasMessages}
              variant="secondary"
              className="w-full"
            >
              Download
            </Button>
            <Button
              onClick={clearChat}
              disabled={!hasMessages}
              variant="secondary"
              className="w-full"
            >
              Clear
            </Button>
          </div>
        </div>
      </aside>
      {isReadmeOpen && <Readme onClose={() => setIsReadmeOpen(false)} />}
    </>
  );
};

export default SettingsPanel;