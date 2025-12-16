
import React, { useState, useEffect, useCallback } from 'react';
import { StudioCanvas } from './components/StudioCanvas';
import { MatrixView } from './components/MatrixView';
import { ControlPanel } from './components/ControlPanel';
import { Coordinates, FiboPrompt, RenderResult, StudioState, SavedScene, SubjectType, PostProcessing } from './types';
import { calculateFiboParams } from './spatial-math';
import { getDirectorCoordinates } from './services/geminiService';
import { generateImage } from './services/replicateService';
import { Download, X, Undo, Redo, Menu, Grid as GridIcon, Loader2, AlertCircle } from 'lucide-react';

// Initial Positions
const INITIAL_CAMERA: Coordinates = { x: 0, y: 150, z: 0 }; 
const INITIAL_LIGHT: Coordinates = { x: 100, y: -100, z: 20 }; 

const INITIAL_STATE: StudioState = {
  camera: INITIAL_CAMERA,
  light: INITIAL_LIGHT,
  aperture: "f/5.6",
  prompt: "",
  filters: [],
  postProcessing: { bloom: 0, glare: 0, distortion: 0 },
  subjectType: 'person'
};

export default function App() {
  // --- API KEY MANAGEMENT ---
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('LUMINA_GEMINI_KEY') || process.env.API_KEY || '';
    }
    return process.env.API_KEY || '';
  });
  
  const [replicateKey, setReplicateKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('LUMINA_REPLICATE_KEY') || 
             process.env.REPLICATE_API_TOKEN || 
             process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || '';
    }
    return process.env.REPLICATE_API_TOKEN || '';
  });

  const handleSetGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem('LUMINA_GEMINI_KEY', key);
  };

  const handleSetReplicateKey = (key: string) => {
    setReplicateKey(key);
    localStorage.setItem('LUMINA_REPLICATE_KEY', key);
  };

  // --- STATE WITH HISTORY ---
  const [history, setHistory] = useState<StudioState[]>([INITIAL_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Helper to get current state
  const currentState = history[historyIndex];

  // Derived State (for UI binding)
  const cameraPos = currentState.camera;
  const lightPos = currentState.light;
  const aperture = currentState.aperture;
  const prompt = currentState.prompt;
  const filters = currentState.filters;
  const postProcessing = currentState.postProcessing;
  const subjectType = currentState.subjectType;

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState<'none' | 'thirds' | 'golden' | 'center'>('none');
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);

  // Load scenes from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('lumina_scenes');
    if (saved) {
      try {
        setSavedScenes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load scenes", e);
      }
    }
  }, []);

  const saveSceneToStorage = (scenes: SavedScene[]) => {
    setSavedScenes(scenes);
    localStorage.setItem('lumina_scenes', JSON.stringify(scenes));
  };

  // --- HISTORY MANAGEMENT ---
  const pushToHistory = useCallback((newState: Partial<StudioState>) => {
    const nextState = { ...currentState, ...newState };
    
    // Check deep equality (simple JSON check for now)
    if (JSON.stringify(nextState) !== JSON.stringify(currentState)) {
       const newHistory = history.slice(0, historyIndex + 1);
       newHistory.push(nextState);
       setHistory(newHistory);
       setHistoryIndex(newHistory.length - 1);
    }
  }, [history, historyIndex, currentState]);

  const undo = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // --- ACTIONS ---
  const setAperture = (val: string) => pushToHistory({ aperture: val });
  
  // Optimization: Temporary state for drag/input
  const [tempCamera, setTempCamera] = useState<Coordinates | null>(null);
  const [tempLight, setTempLight] = useState<Coordinates | null>(null);
  const [tempPrompt, setTempPrompt] = useState<string>(prompt);

  // Sync temp prompt when history changes
  useEffect(() => {
    setTempPrompt(prompt);
  }, [prompt]);

  // --- DERIVED FIBO DATA ---
  const [fiboData, setFiboData] = useState<FiboPrompt>({
    prompt: "",
    structured_prompt: {
      short_description: "",
      style_medium: "",
      artistic_style: "",
      photographic_characteristics: { camera_angle: "", lens_focal_length: "", depth_of_field: "", focus: "" },
      lighting: { direction: "", conditions: "", shadows: "" },
      aesthetics: { mood_atmosphere: "", color_scheme: "", composition: "" },
      objects: []
    }
  });
  
  useEffect(() => {
    const data = calculateFiboParams(cameraPos, lightPos, tempPrompt, aperture, filters, postProcessing, subjectType);
    setFiboData(data);
  }, [cameraPos, lightPos, tempPrompt, aperture, filters, postProcessing, subjectType]);

  // Commit handlers
  const commitCamera = () => {
    if (tempCamera) {
      pushToHistory({ camera: tempCamera });
      setTempCamera(null);
    }
  };
  const commitLight = () => {
    if (tempLight) {
      pushToHistory({ light: tempLight });
      setTempLight(null);
    }
  };
  const commitPrompt = () => {
    if (tempPrompt !== prompt) {
      pushToHistory({ prompt: tempPrompt });
    }
  };

  // Agent State
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  
  // Render State
  const [renderStatus, setRenderStatus] = useState<RenderResult['status']>('idle');
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Agent Handler
  const handleAgentAction = async () => {
    if (!tempPrompt) return;
    setIsAgentThinking(true);
    commitPrompt(); 

    const result = await getDirectorCoordinates(tempPrompt, cameraPos, lightPos, geminiKey);
    
    if (result) {
      pushToHistory({
        camera: result.camera,
        light: result.light
      });
    }
    setIsAgentThinking(false);
  };

  // Render Handler
  const handleRender = async () => {
    commitPrompt();
    setRenderStatus('generating');
    setErrorMessage(null);
    setRenderedImage(null); // Clear previous image
    
    try {
      const imageUrl = await generateImage(fiboData, replicateKey);
      setRenderedImage(imageUrl);
      setRenderStatus('complete');
    } catch (e: any) {
      console.error(e);
      setRenderStatus('error');
      setErrorMessage(e.message || "Rendering failed. Please check your API key and try again.");
    }
  };

  // Download Handler
  const handleDownload = async () => {
    if (!renderedImage) return;
    setIsDownloading(true);
    try {
      const response = await fetch(renderedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lumina-render-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  // Scene Handlers
  const handleSaveScene = (name: string) => {
    const newScene: SavedScene = {
      id: Date.now().toString(),
      name,
      state: currentState,
      createdAt: Date.now()
    };
    saveSceneToStorage([...savedScenes, newScene]);
  };

  const handleLoadScene = (scene: SavedScene) => {
    pushToHistory(scene.state);
  };

  const handleDeleteScene = (id: string) => {
    saveSceneToStorage(savedScenes.filter(s => s.id !== id));
  };

  // Key Warning Logic
  const hasGeminiKey = !!geminiKey;
  const hasReplicateKey = !!replicateKey;

  return (
    <div className="flex h-[100dvh] w-full bg-studio-bg text-white font-sans overflow-hidden">
      
      {/* Matrix View */}
      <MatrixView 
        data={fiboData} 
        aperture={aperture}
        setAperture={setAperture}
        filters={filters}
        setFilters={(f) => pushToHistory({ filters: f })}
        postProcessing={postProcessing}
        setPostProcessing={(pp) => pushToHistory({ postProcessing: pp })}
        subjectType={subjectType}
        setSubjectType={(t) => pushToHistory({ subjectType: t })}
        
        savedScenes={savedScenes}
        onSaveScene={handleSaveScene}
        onLoadScene={handleLoadScene}
        onDeleteScene={handleDeleteScene}

        geminiKey={geminiKey}
        setGeminiKey={handleSetGeminiKey}
        replicateKey={replicateKey}
        setReplicateKey={handleSetReplicateKey}

        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Canvas Area */}
      <main className="flex-1 relative h-full flex flex-col">
        {/* Top Header */}
        <div className="absolute top-0 left-0 w-full p-4 z-50 pointer-events-none flex justify-between items-start">
          <div className="ml-0 md:ml-[100px] pointer-events-auto flex gap-2 items-center">
             
             {/* Mobile Menu */}
             <button 
               className="md:hidden p-2 bg-neutral-900 border border-neutral-700 rounded text-white hover:bg-neutral-800"
               onClick={() => setIsSidebarOpen(true)}
             >
               <Menu size={16} />
             </button>

             {/* Undo/Redo */}
             <div className="flex bg-neutral-900 border border-neutral-700 rounded-md overflow-hidden">
                <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-neutral-800 disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
                  <Undo size={16} />
                </button>
                <div className="w-[1px] bg-neutral-800"></div>
                <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-neutral-800 disabled:opacity-30 transition-colors" title="Redo (Ctrl+Shift+Z)">
                  <Redo size={16} />
                </button>
             </div>

             {/* Visual Guide Toggles */}
             <div className="flex bg-neutral-900 border border-neutral-700 rounded-md overflow-hidden ml-2">
                <button 
                  onClick={() => setActiveGuide(activeGuide === 'none' ? 'thirds' : activeGuide === 'thirds' ? 'golden' : activeGuide === 'golden' ? 'center' : 'none')}
                  className="p-2 hover:bg-neutral-800 transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <GridIcon size={16} className={activeGuide !== 'none' ? 'text-studio-accent' : 'text-neutral-500'} />
                  <span className="hidden sm:inline">{activeGuide === 'none' ? 'GUIDES OFF' : activeGuide.toUpperCase()}</span>
                </button>
             </div>
          </div>
          
          <div className="text-right pointer-events-auto flex flex-col gap-2 items-end">
             <h1 className="text-xl font-bold tracking-tighter text-white drop-shadow-md">LUMINA</h1>
             {!hasGeminiKey && (
               <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-1 rounded text-xs backdrop-blur-md animate-pulse">
                 Missing Gemini Key (Settings)
               </div>
             )}
             {!hasReplicateKey && (
               <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-3 py-1 rounded text-xs backdrop-blur-md">
                 Missing Replicate Token (Settings)
               </div>
             )}
          </div>
        </div>

        {/* Error Notification */}
        {renderStatus === 'error' && errorMessage && (
           <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-red-900/95 border border-red-500 text-white px-6 py-4 rounded shadow-xl flex flex-col gap-2 w-[90%] max-w-3xl backdrop-blur-md">
             <div className="flex justify-between items-start">
                <span className="font-bold flex items-center gap-2 text-red-300 uppercase tracking-wider text-sm"><AlertCircle size={18}/> Rendering Failed</span>
                <button onClick={() => setRenderStatus('idle')} className="hover:text-red-200 p-1"><X size={16}/></button>
             </div>
             <div className="bg-black/50 rounded p-3 mt-2 border border-red-900/50">
                <pre className="text-xs font-mono whitespace-pre-wrap text-red-100/90 overflow-auto max-h-[50vh] break-all">{errorMessage}</pre>
             </div>
             <div className="text-[10px] text-red-400/60 font-mono">
               Please check your API key, prompts, and connection.
             </div>
           </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <StudioCanvas 
            cameraPos={tempCamera || cameraPos} 
            setCameraPos={setTempCamera}
            lightPos={tempLight || lightPos} 
            setLightPos={setTempLight}
            onInteractionEnd={() => {
              commitCamera();
              commitLight();
            }}
            subjectType={subjectType}
            activeGuide={activeGuide}
          />
          
          <ControlPanel 
            prompt={tempPrompt}
            setPrompt={setTempPrompt}
            onAgentAction={handleAgentAction}
            isAgentThinking={isAgentThinking}
            onRender={handleRender}
            renderStatus={renderStatus}
          />
        </div>
      </main>

      {/* Render Result Overlay */}
      {(renderedImage || renderStatus === 'generating') && (
        <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden">
            {/* Overlay Header */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
              <h3 className="font-mono text-white text-sm md:text-base flex items-center gap-2">
                {renderStatus === 'generating' ? (
                   <span className="text-studio-accent animate-pulse">● RENDERING_IN_PROGRESS</span>
                ) : (
                   <span className="text-white">RENDER_OUTPUT_001</span>
                )}
              </h3>
              <button 
                onClick={() => { setRenderedImage(null); setRenderStatus('idle'); }} 
                className="text-neutral-500 hover:text-white transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Overlay Content / Image */}
            <div className="p-2 bg-black flex-1 overflow-hidden flex items-center justify-center relative min-h-[300px]">
              {renderStatus === 'generating' ? (
                 <div className="flex flex-col items-center gap-6 opacity-70">
                    <div className="relative">
                      <div className="absolute inset-0 bg-studio-accent/20 blur-xl rounded-full animate-pulse"></div>
                      <Loader2 size={64} className="animate-spin text-studio-accent relative z-10" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-white font-mono text-sm tracking-widest">GENERATING IMAGE</p>
                      <p className="text-neutral-500 text-xs">Waiting for Replicate API...</p>
                    </div>
                 </div>
              ) : (
                 renderedImage && (
                   <img 
                     src={renderedImage} 
                     alt="Generated Output" 
                     className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded shadow-2xl" 
                   />
                 )
              )}
            </div>
            
            {/* Overlay Footer */}
            <div className="p-4 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center bg-neutral-900 gap-4">
               <div className="text-xs text-neutral-500 font-mono hidden md:block">
                 {fiboData.structured_prompt.photographic_characteristics.lens_focal_length} | {fiboData.structured_prompt.photographic_characteristics.depth_of_field}
               </div>
               
               {renderStatus === 'complete' && renderedImage && (
                 <div className="flex gap-3 w-full md:w-auto">
                    <button 
                       onClick={() => { setRenderedImage(null); setRenderStatus('idle'); }}
                       className="flex-1 md:flex-none px-6 py-2 rounded text-sm font-bold border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                    <button 
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-studio-accent text-black px-6 py-2 rounded text-sm font-bold hover:bg-cyan-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                      {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
