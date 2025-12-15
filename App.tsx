import React, { useState, useEffect } from 'react';
import { StudioCanvas } from './components/StudioCanvas';
import { MatrixView } from './components/MatrixView';
import { ControlPanel } from './components/ControlPanel';
import { Coordinates, FiboPrompt, RenderResult } from './types';
import { calculateFiboParams } from './lib/spatial-math';
import { getDirectorCoordinates } from './services/geminiService';
import { generateImage } from './services/replicateService';
import { Download, X } from 'lucide-react';

// Initial Positions
const INITIAL_CAMERA: Coordinates = { x: 0, y: 150 }; // Front, Medium distance
const INITIAL_LIGHT: Coordinates = { x: 100, y: -100 }; // Right, Back (Rim light)

export default function App() {
  // State
  const [cameraPos, setCameraPos] = useState<Coordinates>(INITIAL_CAMERA);
  const [lightPos, setLightPos] = useState<Coordinates>(INITIAL_LIGHT);
  const [prompt, setPrompt] = useState<string>("");
  const [fiboData, setFiboData] = useState<FiboPrompt>({
    camera: { lens: "50mm", view: "Front" },
    lighting: { direction: "Front", style: "Soft" },
    prompt: ""
  });
  
  // Agent State
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  
  // Render State
  const [renderStatus, setRenderStatus] = useState<RenderResult['status']>('idle');
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  // Recalculate JSON whenever positions change
  useEffect(() => {
    const data = calculateFiboParams(cameraPos, lightPos, prompt);
    setFiboData(data);
  }, [cameraPos, lightPos, prompt]);

  // Handler: Gemini Director
  const handleAgentAction = async () => {
    if (!prompt) return;
    setIsAgentThinking(true);
    
    // Call Gemini
    const result = await getDirectorCoordinates(prompt, cameraPos, lightPos);
    
    if (result) {
      // Smoothly update positions (Framer motion in StudioCanvas will handle the animation)
      setCameraPos(result.camera);
      setLightPos(result.light);
    }
    
    setIsAgentThinking(false);
  };

  // Handler: Render Image
  const handleRender = async () => {
    setRenderStatus('generating');
    try {
      const imageUrl = await generateImage(fiboData);
      setRenderedImage(imageUrl);
      setRenderStatus('complete');
    } catch (e) {
      console.error(e);
      setRenderStatus('error');
    }
  };

  return (
    <div className="flex h-screen w-full bg-studio-bg text-white font-sans overflow-hidden">
      
      {/* Left Sidebar: Matrix View (JSON) */}
      <MatrixView data={fiboData} />
      
      {/* Center: Main Studio Canvas */}
      <main className="flex-1 relative">
        {/* Top Header */}
        <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">LUMINA</h1>
            <p className="text-xs text-neutral-500 font-mono tracking-widest">SPATIAL PROMPTING INTERFACE</p>
          </div>
          
          <div className="text-right pointer-events-auto">
             {!process.env.API_KEY && (
               <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-1 rounded text-xs">
                 Missing API_KEY in env
               </div>
             )}
          </div>
        </div>

        <StudioCanvas 
          cameraPos={cameraPos} 
          setCameraPos={setCameraPos}
          lightPos={lightPos} 
          setLightPos={setLightPos}
        />
        
        {/* Floating Controls */}
        <ControlPanel 
          prompt={prompt}
          setPrompt={setPrompt}
          onAgentAction={handleAgentAction}
          isAgentThinking={isAgentThinking}
          onRender={handleRender}
          renderStatus={renderStatus}
        />
      </main>

      {/* Render Result Overlay */}
      {renderedImage && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-4xl max-h-full flex flex-col">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="font-mono text-white">RENDER_OUTPUT_001</h3>
              <button onClick={() => setRenderedImage(null)} className="text-neutral-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-2 bg-black flex-1 overflow-hidden flex items-center justify-center">
              <img src={renderedImage} alt="Generated Output" className="max-w-full max-h-[70vh] object-contain rounded" />
            </div>
            
            <div className="p-4 border-t border-neutral-800 flex justify-between items-center bg-neutral-900">
               <div className="text-xs text-neutral-500 font-mono">
                 {fiboData.camera.lens} | {fiboData.lighting.direction}
               </div>
               <a 
                 href={renderedImage} 
                 download="lumina-render.jpg"
                 target="_blank"
                 rel="noreferrer"
                 className="flex items-center gap-2 bg-studio-accent text-black px-4 py-2 rounded text-sm font-bold hover:brightness-110"
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