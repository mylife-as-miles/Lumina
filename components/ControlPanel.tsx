import React, { useState } from 'react';
import { Send, Image as ImageIcon, Sparkles, Loader2, Play } from 'lucide-react';

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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[90%] bg-neutral-900/90 backdrop-blur-md border border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-30">
      
      {/* Header / Mode Indicator */}
      <div className="h-1 w-full bg-gradient-to-r from-studio-accent via-purple-500 to-studio-light"></div>
      
      <div className="p-4 flex gap-4">
        {/* AI Input Area */}
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-studio-accent/10 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the shot (e.g., 'Cyberpunk close-up with neon backlighting')..."
            className="w-full bg-black/50 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg px-4 py-3 outline-none focus:border-studio-accent transition-colors font-mono text-sm"
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
            px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all
            ${renderStatus === 'generating' 
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
              : 'bg-white text-black hover:bg-studio-accent hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]'}
          `}
        >
          {renderStatus === 'generating' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Rendering
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              Render
            </>
          )}
        </button>
      </div>
      
      {/* Helper Text */}
      <div className="px-4 pb-2 flex justify-between text-[10px] text-neutral-500 font-mono uppercase">
        <span>AI Director: Gemini 2.5</span>
        <span>Output: Bria FIBO</span>
      </div>
    </div>
  );
};