import React, { useState, useEffect, useCallback } from 'react';
import { StudioCanvas } from './components/StudioCanvas';
import { MatrixView } from './components/MatrixView';
import { ControlPanel } from './components/ControlPanel';
import { Coordinates, FiboPrompt, RenderResult, StudioState } from './types';
import { calculateFiboParams } from './spatial-math';
import { getDirectorCoordinates } from './services/geminiService';
import { generateImage } from './services/replicateService';
import { Download, X, Undo, Redo, Menu } from 'lucide-react';

// Initial Positions
const INITIAL_CAMERA: Coordinates = { x: 0, y: 150, z: 0 }; // Front, Medium distance, Eye Level
const INITIAL_LIGHT: Coordinates = { x: 100, y: -100, z: 20 }; // Right, Back, slightly elevated

export default function App() {
  // --- STATE WITH HISTORY ---
  const [history, setHistory] = useState<StudioState[]>([
    {
      camera: INITIAL_CAMERA,
      light: INITIAL_LIGHT,
      aperture: "f/5.6",
      prompt: "",
      filters: []
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Helper to get current state
  const currentState = history[historyIndex];

  // Derived State (for UI binding)
  const cameraPos = currentState.camera;
  const lightPos = currentState.light;
  const aperture = currentState.aperture;
  const prompt = currentState.prompt;
  const filters = currentState.filters;

  // Mobile Menu State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- HISTORY MANAGEMENT ---
  const pushToHistory = useCallback((newState: Partial<StudioState>) => {
    const nextState = { ...currentState, ...newState };
    
    // If we're not at the end of history, slice it off
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Only push if something actually changed (shallow check)
    if (JSON.stringify(nextState) !== JSON.stringify(currentState)) {
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
  }, [historyIndex, history]); // Deps need to be here for closure access

  // --- ACTIONS ---
  // State setters that push to history (used for discreet updates like slider change)
  const setAperture = (val: string) => pushToHistory({ aperture: val });
  
  // Optimization: Temporary state for drag/input to avoid spamming history
  const [tempCamera, setTempCamera] = useState<Coordinates | null>(null);
  const [tempLight, setTempLight] = useState<Coordinates | null>(null);
  const [tempPrompt, setTempPrompt] = useState<string>(prompt);

  // Sync temp prompt when history changes (undo/redo)
  useEffect(() => {
    setTempPrompt(prompt);
  }, [prompt]);

  // --- DERIVED FIBO DATA ---
  // Initial empty state until effect runs
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
  
  // Recalculate JSON whenever current state OR TEMP PROMPT changes
  useEffect(() => {
    const data = calculateFiboParams(cameraPos, lightPos, tempPrompt, aperture, filters);
    setFiboData(data);
  }, [cameraPos, lightPos, tempPrompt, aperture, filters]);

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

  // Handler: Gemini Director
  const handleAgentAction = async () => {
    if (!tempPrompt) return;
    setIsAgentThinking(true);
    commitPrompt(); // Ensure prompt is saved before action

    // Call Gemini
    const result = await getDirectorCoordinates(tempPrompt, cameraPos, lightPos);
    
    if (result) {
      // Commit the new agent state to history
      pushToHistory({
        camera: result.camera,
        light: result.light
      });
    }
    
    setIsAgentThinking(false);
  };

  // Handler: Render Image
  const handleRender = async () => {
    // Save the current prompt to history so Undo works later
    commitPrompt();
    
    setRenderStatus('generating');
    setErrorMessage(null);
    try {
      const imageUrl = await generateImage(fiboData);
      setRenderedImage(imageUrl);
      setRenderStatus('complete');
    } catch (e: any) {
      console.error(e);
      setRenderStatus('error');
      setErrorMessage(e.message || "Rendering failed");
    }
  };

  const hasGeminiKey = !!process.env.API_KEY;
  const hasReplicateKey = !!(process.env.REPLICATE_API_TOKEN || process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN);

  return (
    <div className="flex h-[100dvh] w-full bg-studio-bg text-white font-sans overflow-hidden">
      
      {/* Left Sidebar: Matrix View (JSON) */}
      <MatrixView 
        data={fiboData} 
        aperture={aperture}
        setAperture={setAperture}
        filters={filters}
        setFilters={(f) => pushToHistory({ filters: f })}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Center: Main Studio Canvas */}
      <main className="flex-1 relative h-full flex flex-col">
        {/* Top Header */}
        <div className="absolute top-0 left-0 w-full p-4 z-50 pointer-events-none flex justify-between items-start">
          <div className="ml-0 md:ml-[100px] pointer-events-auto flex gap-2 items-center">
             
             {/* Mobile Menu Button */}
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
          </div>
          
          <div className="text-right pointer-events-auto flex flex-col gap-2 items-end">
             <h1 className="text-xl font-bold tracking-tighter text-white drop-shadow-md">LUMINA</h1>
             {!hasGeminiKey && (
               <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-1 rounded text-xs backdrop-blur-md">
                 Missing Gemini API Key
               </div>
             )}
             {!hasReplicateKey && (
               <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 px-3 py-1 rounded text-xs backdrop-blur-md">
                 Missing Replicate API Token
               </div>
             )}
          </div>
        </div>

        {/* Error Notification */}
        {renderStatus === 'error' && errorMessage && (
           <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-red-900/90 border border-red-500 text-white px-6 py-3 rounded shadow-xl flex items-center gap-4 w-[90%] md:w-auto text-sm md:text-base">
             <span className="truncate">{errorMessage}</span>
             <button onClick={() => setRenderStatus('idle')}><X size={16}/></button>
           </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <StudioCanvas 
            cameraPos={tempCamera || cameraPos} 
            setCameraPos={setTempCamera}
            lightPos={tempLight || lightPos} 
            setLightPos={setTempLight}
            onInteractionEnd={() => {
              // We need to call the commits here. 
              // Since DraggableIcon calls onDragEnd, StudioCanvas calls this.
              commitCamera();
              commitLight();
            }}
          />
          
          {/* Fixed Floating Controls - Now anchored inside the canvas container */}
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
      {renderedImage && (
        <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="font-mono text-white text-sm md:text-base">RENDER_OUTPUT_001</h3>
              <button onClick={() => setRenderedImage(null)} className="text-neutral-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-2 bg-black flex-1 overflow-hidden flex items-center justify-center">
              <img src={renderedImage} alt="Generated Output" className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded" />
            </div>
            
            <div className="p-4 border-t border-neutral-800 flex justify-between items-center bg-neutral-900">
               <div className="text-xs text-neutral-500 font-mono hidden md:block">
                 {fiboData.structured_prompt.photographic_characteristics.lens_focal_length} | {fiboData.structured_prompt.photographic_characteristics.depth_of_field}
               </div>
               <a 
                 href={renderedImage} 
                 download="lumina-render.jpg"
                 target="_blank"
                 rel="noreferrer"
                 className="flex items-center gap-2 bg-studio-accent text-black px-4 py-2 rounded text-sm font-bold hover:brightness-110 w-full md:w-auto justify-center"
               >
                 <Download size={16} /> Download
               </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}