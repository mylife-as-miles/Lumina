import React from 'react';
import { FiboPrompt, AVAILABLE_FILTERS } from '../types';
import { Code, Copy, Check, Sliders, Layers, Camera, Lightbulb, Palette, User, X } from 'lucide-react';

interface MatrixViewProps {
  data: FiboPrompt;
  aperture: string;
  setAperture: (val: string) => void;
  filters: string[];
  setFilters: (f: string[]) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const APERTURE_STOPS = ["f/1.4", "f/2.0", "f/2.8", "f/4.0", "f/5.6", "f/8.0", "f/11", "f/16", "f/22"];

export const MatrixView: React.FC<MatrixViewProps> = ({ 
  data, 
  aperture, 
  setAperture, 
  filters, 
  setFilters,
  isOpen = false,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);
  const sp = data.structured_prompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFilter = (filter: string) => {
    if (filters.includes(filter)) {
      setFilters(filters.filter(f => f !== filter));
    } else {
      setFilters([...filters, filter]);
    }
  };

  const currentStopIndex = APERTURE_STOPS.indexOf(aperture);

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 className="flex items-center gap-2 text-white uppercase tracking-widest text-[10px] opacity-60 mb-2 border-b border-neutral-800 pb-1 mt-4">
      <Icon size={12} className="text-studio-accent" /> {title}
    </h3>
  );

  const KeyVal = ({ k, v }: { k: string, v: string }) => (
    <div className="flex justify-between items-start gap-2 mb-1 group">
      <span className="text-neutral-500 shrink-0 group-hover:text-neutral-400 transition-colors">{k.replace(/_/g, ' ')}:</span>
      <span className="text-right text-neutral-200 font-medium truncate" title={v}>{v}</span>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
          onClick={onClose}
        ></div>
      )}

      <div className={`
        fixed inset-y-0 left-0 z-[70] w-80 bg-studio-panel border-r border-neutral-800 shadow-2xl flex flex-col h-[100dvh]
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-96 md:z-40 md:shadow-2xl md:h-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur">
          <div className="flex items-center gap-2 text-studio-accent">
            <Code size={18} />
            <h2 className="font-mono text-sm font-bold tracking-wider">MATRIX_STATE</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded"
              title="Copy JSON"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <button 
              onClick={onClose}
              className="md:hidden text-neutral-500 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-5 font-mono text-[11px] space-y-2 custom-scrollbar pb-24 md:pb-5">
          
          {/* Description */}
          <div className="p-3 bg-neutral-900/50 rounded border border-neutral-800 text-neutral-300 italic mb-4">
              "{sp.short_description}"
          </div>

          {/* Camera */}
          <SectionHeader icon={Camera} title="Photographic Characteristics" />
          <div className="pl-2 border-l border-neutral-800 ml-1">
            <KeyVal k="lens" v={sp.photographic_characteristics.lens_focal_length} />
            <KeyVal k="angle" v={sp.photographic_characteristics.camera_angle} />
            <KeyVal k="focus" v={sp.photographic_characteristics.focus} />
            
            {/* Aperture Control */}
            <div className="mt-3 bg-neutral-900 p-2 rounded border border-neutral-800">
              <div className="flex justify-between mb-1">
                <span className="flex items-center gap-1 text-neutral-400"><Sliders size={10}/> Aperture</span>
                <span className="text-studio-accent font-bold">{aperture}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max={APERTURE_STOPS.length - 1} 
                value={currentStopIndex !== -1 ? currentStopIndex : 4}
                onChange={(e) => setAperture(APERTURE_STOPS[parseInt(e.target.value)])}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-studio-accent"
              />
              <div className="text-[9px] text-neutral-500 mt-1 truncate">
                {sp.photographic_characteristics.depth_of_field}
              </div>
            </div>
          </div>

          {/* Lighting */}
          <SectionHeader icon={Lightbulb} title="Lighting Configuration" />
          <div className="pl-2 border-l border-neutral-800 ml-1">
            <KeyVal k="direction" v={sp.lighting.direction} />
            <KeyVal k="conditions" v={sp.lighting.conditions} />
            <KeyVal k="shadows" v={sp.lighting.shadows} />
          </div>

          {/* Aesthetics */}
          <SectionHeader icon={Palette} title="Aesthetics & Composition" />
          <div className="pl-2 border-l border-neutral-800 ml-1">
            <KeyVal k="mood" v={sp.aesthetics.mood_atmosphere} />
            <KeyVal k="composition" v={sp.aesthetics.composition} />
            <KeyVal k="color" v={sp.aesthetics.color_scheme} />
            <KeyVal k="style" v={sp.artistic_style} />
          </div>

          {/* Object/Subject */}
          <SectionHeader icon={User} title="Subject Details" />
          <div className="pl-2 border-l border-neutral-800 ml-1">
            {sp.objects.map((obj, i) => (
               <div key={i} className="space-y-1">
                  <KeyVal k="pose" v={obj.action_pose || ''} />
                  <KeyVal k="location" v={obj.location || ''} />
               </div>
            ))}
          </div>

          {/* Filters */}
          <SectionHeader icon={Layers} title="FX Filters" />
          <div className="grid grid-cols-1 gap-1 pl-1">
             {AVAILABLE_FILTERS.map(f => (
               <label key={f} className="flex items-center gap-2 hover:bg-neutral-800/50 p-1 rounded cursor-pointer transition-colors">
                 <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={filters.includes(f)}
                    onChange={() => toggleFilter(f)}
                 />
                 <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-colors ${filters.includes(f) ? 'bg-studio-accent border-studio-accent' : 'border-neutral-700 bg-neutral-900'}`}>
                   {filters.includes(f) && <Check size={8} className="text-black" />}
                 </div>
                 <span className={filters.includes(f) ? "text-white" : "text-neutral-500"}>{f}</span>
               </label>
             ))}
          </div>

          {/* Raw JSON Preview Toggle */}
          <details className="mt-6 pt-4 border-t border-neutral-800">
             <summary className="cursor-pointer text-neutral-600 hover:text-white transition-colors text-[10px]">Show Raw JSON</summary>
             <pre className="mt-2 text-[9px] leading-relaxed text-neutral-500 overflow-hidden bg-black p-2 rounded">
{JSON.stringify(data, null, 2)}
             </pre>
          </details>

        </div>
      </div>
    </>
  );
};