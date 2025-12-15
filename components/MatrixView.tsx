import React from 'react';
import { FiboPrompt } from '../types';
import { Code, Copy, Check } from 'lucide-react';

interface MatrixViewProps {
  data: FiboPrompt;
}

export const MatrixView: React.FC<MatrixViewProps> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full bg-studio-panel border-r border-neutral-800 flex flex-col w-80 shrink-0">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
        <div className="flex items-center gap-2 text-studio-accent">
          <Code size={18} />
          <h2 className="font-mono text-sm font-bold tracking-wider">MATRIX_STATE</h2>
        </div>
        <button 
          onClick={handleCopy}
          className="text-neutral-500 hover:text-white transition-colors"
          title="Copy JSON"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-400 space-y-6">
        
        {/* Camera Section */}
        <div className="space-y-2">
          <h3 className="text-white uppercase tracking-widest text-[10px] opacity-50 mb-1">Optical System</h3>
          <div className="pl-3 border-l-2 border-studio-accent space-y-1">
            <div className="flex justify-between">
              <span>lens:</span>
              <span className="text-studio-accent">"{data.camera.lens}"</span>
            </div>
            <div className="flex justify-between">
              <span>view:</span>
              <span className="text-studio-accent">"{data.camera.view}"</span>
            </div>
          </div>
        </div>

        {/* Lighting Section */}
        <div className="space-y-2">
          <h3 className="text-white uppercase tracking-widest text-[10px] opacity-50 mb-1">Illumination</h3>
          <div className="pl-3 border-l-2 border-studio-light space-y-1">
            <div className="flex justify-between">
              <span>direction:</span>
              <span className="text-studio-light">"{data.lighting.direction}"</span>
            </div>
            <div className="flex justify-between">
              <span>style:</span>
              <span className="text-studio-light">"{data.lighting.style}"</span>
            </div>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="space-y-2">
          <h3 className="text-white uppercase tracking-widest text-[10px] opacity-50 mb-1">Prompt Input</h3>
          <div className="p-2 bg-neutral-900 rounded border border-neutral-800 text-neutral-300 italic">
            "{data.prompt}"
          </div>
        </div>
        
        {/* Raw JSON Preview */}
        <div className="pt-4 border-t border-neutral-800">
           <pre className="text-[10px] leading-relaxed opacity-50 overflow-hidden">
{JSON.stringify(data, null, 2)}
           </pre>
        </div>

      </div>
      
      <div className="p-3 text-[10px] text-center text-neutral-600 border-t border-neutral-800">
        Bria FIBO v1.0 Compatible
      </div>
    </div>
  );
};