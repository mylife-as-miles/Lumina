import React from 'react';
import { Sparkles, Loader2, Play } from 'lucide-react';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (s: string) => void;
  onAgentAction: () => void;
  isAgentThinking: boolean;
  onRender: () => void;
  renderStatus: 'idle' | 'generating' | 'complete' | 'error';
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  prompt,
  setPrompt,
  onAgentAction,
  isAgentThinking,
  onRender,
  renderStatus
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAgentAction();
    }
  };

  return (
    // Wrapper: Fixed to Viewport, defining the "Safe Zone" for the controls
    // Mobile: Full width at bottom
    // Desktop: Starts after Sidebar (left-96), centered in remaining space
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-end 
                    pointer-events-none
                    pb-[env(safe-area-inset-bottom)] md:pb-8
                    md:left-96 transition-all duration-300">
      
      {/* The Control Card */}
      <div className="pointer-events-auto w-full md:w-[600px] max-w-full md:max-w-[95%]
                      bg-neutral-900/95 backdrop-blur-md shadow-2xl 
                      border-t border-neutral-700 md:border md:rounded-xl
                      flex flex-col relative overflow-hidden transition-all duration-300">
        
        {/* Header / Mode Indicator */}
        <div className="h-1 w-full bg-gradient-to-r from-studio-accent via-purple-500 to-studio-light"></div>
        
        <div className="p-3 md:p-4 flex gap-2 md:gap-4 items-center">
          {/* AI Input Area */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-studio-accent/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the shot..."
              className="w-full bg-black/50 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg pl-3 pr-10 py-3 outline-none focus:border-studio-accent transition-colors font-mono text-sm"
            />
            <button
              onClick={onAgentAction}
              disabled={isAgentThinking || !prompt}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              {isAgentThinking ? <Loader2 size={18} className="animate-spin text-studio-accent" /> : <Sparkles size={18} />}
            </button>
          </div>

          {/* Render Button */}
          <button
            onClick={onRender}
            disabled={renderStatus === 'generating'}
            className={`
              h-full aspect-square md:aspect-auto md:px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0
              ${renderStatus === 'generating' 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-studio-accent hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]'}
            `}
            title="Render Image"
          >
            {renderStatus === 'generating' ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
            <span className="hidden md:inline">{renderStatus === 'generating' ? 'Rendering' : 'Render'}</span>
          </button>
        </div>
        
        {/* Helper Text */}
        <div className="px-4 pb-4 md:pb-2 flex justify-between text-[10px] text-neutral-500 font-mono uppercase">
          <span>Gemini 2.5</span>
          <span className="hidden md:inline">Output: Bria FIBO</span>
        </div>
      </div>
    </div>
  );
};