import React from 'react';
import { FiboPrompt } from '../types';
import { Code, Copy, Check, Sliders } from 'lucide-react';

interface MatrixViewProps {
  data: FiboPrompt;
  aperture: string;
  setAperture: (val: string) => void;
}

const APERTURE_STOPS = ["f/1.4", "f/2.0", "f/2.8", "f/4.0", "f/5.6", "f/8.0", "f/11", "f/16", "f/22"];

export const MatrixView: React.FC<MatrixViewProps> = ({ data, aperture, setAperture }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStopIndex = APERTURE_STOPS.indexOf(aperture);

  return (
    <div className="h-full bg-studio-panel border-r border-neutral-800 flex flex-col w-80 shrink-0 z-40">
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
        <div className="space-y-3">
          <h3 className="text-white uppercase tracking-widest text-[10px] opacity-50 mb-1 border-b border-neutral-800 pb-1">Optical System</h3>
          <div className="pl-3 border-l-2 border-studio-accent space-y-2">
            <div className="flex justify-between">
              <span>lens:</span>
              <span className="text-studio-accent">{data.structured_prompt.camera.lens}</span>
            </div>
            <div className="flex justify-between">
              <span>view:</span>
              <span className="text-studio-accent">{data.structured_prompt.camera.view}</span>
            </div>
            
            {/* Aperture Control */}
            <div className="pt-2">
              <div className="flex justify-between mb-1">
                <span className="flex items-center gap-1"><Sliders size={10}/> aperture:</span>
                <span className="text-studio-accent font-bold">{aperture}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max={APERTURE_STOPS.length - 1} 
                value={currentStopIndex !== -1 ? currentStopIndex : 4}
                onChange={(e) => setAperture(APERTURE_STOPS[parseInt(e.target.value)])}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-studio-accent"
              />
              <div className="flex justify-between text-[8px] text-neutral-600 mt-1">
                <span>f/1.4</span>
                <span>f/22</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lighting Section */}
        <div className="space-y-2">
          <h3 className="text-white uppercase tracking-widest text-[10px] opacity-50 mb-1 border-b border-neutral-800 pb-1">Illumination</h3>
          <div className="pl-3 border-l-2 border-studio-light space-y-1">
            <div className="flex justify-between">
              <span>direction:</span>
              <span className="text-studio-light">{data.structured_prompt.lighting.direction}</span>
            </div>
            <div className="flex justify-between">
              <span>style:</span>
              <span className="text-studio-light">{data.structured_prompt.lighting.style}</span>
            </div>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="space-y-2">
          <h3 className="text-white uppercase tracking-widest text-[10px] opacity-50 mb-1 border-b border-neutral-800 pb-1">Prompt Input</h3>
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