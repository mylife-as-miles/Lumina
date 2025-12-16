import React, { useState } from 'react';
import { FiboPrompt, AVAILABLE_FILTERS, PostProcessing, SavedScene, StudioState, SubjectType } from '../types';
import { Code, Copy, Check, Sliders, Layers, Camera, Lightbulb, Palette, User, X, Save, Trash, Box, FolderOpen, Settings, Key } from 'lucide-react';

interface MatrixViewProps {
  data: FiboPrompt;
  aperture: string;
  setAperture: (val: string) => void;
  filters: string[];
  setFilters: (f: string[]) => void;
  postProcessing: PostProcessing;
  setPostProcessing: (pp: PostProcessing) => void;
  subjectType: SubjectType;
  setSubjectType: (t: SubjectType) => void;
  
  // Scene Management
  savedScenes: SavedScene[];
  onSaveScene: (name: string) => void;
  onLoadScene: (scene: SavedScene) => void;
  onDeleteScene: (id: string) => void;

  // API Keys
  geminiKey: string;
  setGeminiKey: (k: string) => void;
  replicateKey: string;
  setReplicateKey: (k: string) => void;

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
  postProcessing,
  setPostProcessing,
  subjectType,
  setSubjectType,
  savedScenes,
  onSaveScene,
  onLoadScene,
  onDeleteScene,
  geminiKey,
  setGeminiKey,
  replicateKey,
  setReplicateKey,
  isOpen = false,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'matrix' | 'scenes' | 'settings'>('matrix');
  const [newSceneName, setNewSceneName] = React.useState('');

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
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur">
           <div className="flex gap-4">
             <button 
               onClick={() => setActiveTab('matrix')}
               className={`flex items-center gap-2 text-sm font-bold tracking-wider ${activeTab === 'matrix' ? 'text-studio-accent' : 'text-neutral-500'}`}
               title="Matrix"
             >
               <Code size={16} />
             </button>
             <button 
               onClick={() => setActiveTab('scenes')}
               className={`flex items-center gap-2 text-sm font-bold tracking-wider ${activeTab === 'scenes' ? 'text-studio-accent' : 'text-neutral-500'}`}
               title="Scenes"
             >
               <FolderOpen size={16} />
             </button>
           </div>
           
           <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`text-neutral-500 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded ${activeTab === 'settings' ? 'text-studio-accent' : ''}`}
              title="Settings"
            >
              <Settings size={16} />
            </button>

            {activeTab === 'matrix' && (
              <button 
                onClick={handleCopy}
                className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded"
                title="Copy JSON"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            )}
            <button 
              onClick={onClose}
              className="md:hidden text-neutral-500 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-5 font-mono text-[11px] space-y-2 custom-scrollbar pb-24 md:pb-5">
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
               <div className="p-3 bg-neutral-900 rounded border border-neutral-800">
                  <h3 className="flex items-center gap-2 text-studio-accent font-bold mb-3 text-xs uppercase tracking-wider">
                    <Key size={14} /> API Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-neutral-500 mb-1">Gemini API Key</label>
                      <input 
                        type="password" 
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIza..."
                        className="w-full bg-black border border-neutral-700 rounded px-2 py-2 text-white outline-none focus:border-studio-accent focus:ring-1 focus:ring-studio-accent/50"
                      />
                      <p className="text-[9px] text-neutral-600 mt-1">Required for Director Agent (Sparkles).</p>
                    </div>

                    <div>
                      <label className="block text-neutral-500 mb-1">Replicate API Token</label>
                      <input 
                        type="password" 
                        value={replicateKey}
                        onChange={(e) => setReplicateKey(e.target.value)}
                        placeholder="r8_..."
                        className="w-full bg-black border border-neutral-700 rounded px-2 py-2 text-white outline-none focus:border-studio-accent focus:ring-1 focus:ring-studio-accent/50"
                      />
                      <p className="text-[9px] text-neutral-600 mt-1">Required for Image Rendering.</p>
                    </div>
                  </div>
               </div>

               <div className="p-3 border border-yellow-900/50 bg-yellow-900/10 rounded text-yellow-500/80">
                 Keys are stored locally in your browser (localStorage).
               </div>
            </div>
          )}

          {activeTab === 'scenes' && (
            <div className="space-y-4">
               {/* Save New Scene */}
               <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
                  <h4 className="text-neutral-400 mb-2 uppercase tracking-wide">Save Current State</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Scene Name..." 
                      value={newSceneName}
                      onChange={(e) => setNewSceneName(e.target.value)}
                      className="flex-1 bg-black border border-neutral-700 rounded px-2 text-white outline-none focus:border-studio-accent"
                    />
                    <button 
                      onClick={() => {
                        if (newSceneName.trim()) {
                          onSaveScene(newSceneName);
                          setNewSceneName('');
                        }
                      }}
                      className="bg-studio-accent text-black p-2 rounded hover:brightness-110"
                    >
                      <Save size={16} />
                    </button>
                  </div>
               </div>

               {/* Saved List */}
               <div className="space-y-2">
                 {savedScenes.map(scene => (
                   <div key={scene.id} className="flex items-center justify-between bg-neutral-900/50 p-3 rounded border border-neutral-800 hover:border-neutral-600 transition-colors">
                      <div>
                        <div className="font-bold text-white text-xs">{scene.name}</div>
                        <div className="text-[9px] text-neutral-600">{new Date(scene.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => onLoadScene(scene)} className="text-studio-accent hover:text-white p-1" title="Load">
                           <FolderOpen size={14} />
                        </button>
                        <button onClick={() => onDeleteScene(scene.id)} className="text-red-500 hover:text-red-400 p-1" title="Delete">
                           <Trash size={14} />
                        </button>
                      </div>
                   </div>
                 ))}
                 {savedScenes.length === 0 && (
                   <div className="text-center text-neutral-600 py-10">No saved scenes</div>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <>
              {/* Description */}
              <div className="p-3 bg-neutral-900/50 rounded border border-neutral-800 text-neutral-300 italic mb-4">
                  "{sp.short_description}"
              </div>

              {/* Subject Select */}
              <SectionHeader icon={Box} title="Studio Model" />
              <div className="flex gap-2 pl-1 mb-4">
                 {(['person', 'car', 'building'] as SubjectType[]).map(t => (
                   <button 
                     key={t}
                     onClick={() => setSubjectType(t)}
                     className={`px-3 py-1.5 rounded border capitalize transition-colors ${subjectType === t ? 'bg-studio-accent text-black border-studio-accent' : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'}`}
                   >
                     {t}
                   </button>
                 ))}
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

              {/* Post Processing */}
              <SectionHeader icon={Sliders} title="Post Processing" />
              <div className="space-y-3 pl-1">
                  {/* Bloom */}
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                      <span>Bloom</span> <span>{postProcessing.bloom}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={postProcessing.bloom}
                      onChange={(e) => setPostProcessing({...postProcessing, bloom: parseInt(e.target.value)})}
                      className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-studio-accent"
                    />
                  </div>
                  {/* Glare */}
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                      <span>Glare</span> <span>{postProcessing.glare}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={postProcessing.glare}
                      onChange={(e) => setPostProcessing({...postProcessing, glare: parseInt(e.target.value)})}
                      className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-studio-accent"
                    />
                  </div>
                  {/* Distortion */}
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                      <span>Distortion</span> <span>{postProcessing.distortion}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={postProcessing.distortion}
                      onChange={(e) => setPostProcessing({...postProcessing, distortion: parseInt(e.target.value)})}
                      className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-studio-accent"
                    />
                  </div>
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
            </>
          )}

        </div>
      </div>
    </>
  );
};