import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Camera, Zap } from 'lucide-react';
import { Coordinates } from '../types';
import { DraggableIcon } from './DraggableIcon';

interface StudioCanvasProps {
  cameraPos: Coordinates;
  setCameraPos: (pos: Coordinates) => void;
  lightPos: Coordinates;
  setLightPos: (pos: Coordinates) => void;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  cameraPos,
  setCameraPos,
  lightPos,
  setLightPos
}) => {
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const controls = useAnimation();

  // Euclidean distances for dynamic rings
  const camDist = Math.sqrt(cameraPos.x ** 2 + cameraPos.y ** 2);
  const lightDist = Math.sqrt(lightPos.x ** 2 + lightPos.y ** 2);

  const handleWheel = (e: React.WheelEvent) => {
    // Basic zoom logic
    const scaleFactor = 0.001;
    // Invert deltaY for natural zoom feel (scroll up to zoom in)
    const newZoom = Math.min(Math.max(0.2, zoom - e.deltaY * scaleFactor), 4);
    setZoom(newZoom);
  };

  const handlePan = (event: any, info: any) => {
    setPan({ x: pan.x + info.delta.x, y: pan.y + info.delta.y });
  };
  
  // Trigger camera shake effect
  const triggerShake = () => {
    controls.start({
      x: [0, -4, 4, -2, 2, 0],
      y: [0, -2, 2, -1, 1, 0],
      transition: { duration: 0.3, ease: "easeInOut" }
    });
  };

  return (
    <div 
      className="relative w-full h-full bg-studio-bg overflow-hidden flex items-center justify-center select-none shadow-inner shadow-black cursor-crosshair group"
      onWheel={handleWheel}
    >
      {/* --- POST PROCESSING EFFECTS LAYERS --- */}
      
      {/* 1. Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.8)_100%)]" />

      {/* 2. Grain/Noise Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}>
      </div>

      {/* 3. Chromatic Aberration Simulation (Subtle border color shift on edges) */}
      <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>

      {/* Draggable Background Area for Panning */}
      <motion.div 
        className="absolute inset-0 w-full h-full z-0"
        onPan={handlePan} 
        style={{ touchAction: 'none' }}
      />

      {/* Transformed World Container with Shake Animation */}
      <motion.div
        className="relative flex items-center justify-center w-0 h-0"
        animate={controls}
        style={{
          scale: zoom,
          x: pan.x,
          y: pan.y
        }}
      >
        {/* Infinite Grid with Depth of Field (Mask Blur) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4000px] h-[4000px] pointer-events-none opacity-20"
             style={{ 
               backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, 
               backgroundSize: '50px 50px',
               backgroundPosition: 'center center',
               // Depth of Field Effect: Masking edges to simulate focus
               maskImage: 'radial-gradient(circle at center, black 0%, black 40%, transparent 80%)',
               WebkitMaskImage: 'radial-gradient(circle at center, black 0%, black 40%, transparent 80%)'
             }}>
        </div>

        {/* Axes (also masked for DoF) */}
        <div className="absolute w-[4000px] h-[1px] bg-neutral-800" style={{ maskImage: 'linear-gradient(90deg, transparent, black 40%, black 60%, transparent)' }}></div>
        <div className="absolute h-[4000px] w-[1px] bg-neutral-800" style={{ maskImage: 'linear-gradient(180deg, transparent, black 40%, black 60%, transparent)' }}></div>

        {/* --- VISUAL GUIDES --- */}

        {/* Central "Face View" Zone (-50 to 50) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[4000px] bg-studio-accent/5 pointer-events-none border-l border-r border-dashed border-studio-accent/30 flex flex-col items-center justify-center gap-[600px]"
             style={{ maskImage: 'linear-gradient(180deg, transparent 5%, black 40%, black 60%, transparent 95%)' }}>
            <div className="text-[80px] font-bold text-studio-accent/10 rotate-90 whitespace-nowrap">FRONT VIEW</div>
            <div className="text-[80px] font-bold text-studio-accent/10 rotate-90 whitespace-nowrap">BACK VIEW</div>
        </div>

        {/* Left Profile Zone (x < -50) */}
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-[200px] w-[300px] h-[4000px] pointer-events-none opacity-20 flex items-center justify-end pr-8"
             style={{ maskImage: 'linear-gradient(180deg, transparent 20%, black 50%, transparent 80%)' }}>
            <div className="text-[60px] font-bold text-neutral-600 rotate-90 whitespace-nowrap tracking-wider">LEFT PROFILE</div>
        </div>

        {/* Right Profile Zone (x > 50) */}
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 translate-x-[200px] w-[300px] h-[4000px] pointer-events-none opacity-20 flex items-center justify-start pl-8"
             style={{ maskImage: 'linear-gradient(180deg, transparent 20%, black 50%, transparent 80%)' }}>
            <div className="text-[60px] font-bold text-neutral-600 -rotate-90 whitespace-nowrap tracking-wider">RIGHT PROFILE</div>
        </div>

        {/* Explicit Labels for Boundaries */}
        <div className="absolute top-1/2 left-1/2 -translate-x-[50px] -translate-y-1/2 w-[1px] h-[400px] bg-studio-accent/50 opacity-50">
           <div className="absolute top-0 -left-1 -translate-x-full text-[8px] text-studio-accent/70 font-mono bg-black/50 px-1">X:-50</div>
        </div>
        <div className="absolute top-1/2 left-1/2 translate-x-[50px] -translate-y-1/2 w-[1px] h-[400px] bg-studio-accent/50 opacity-50">
           <div className="absolute top-0 -right-1 translate-x-full text-[8px] text-studio-accent/70 font-mono bg-black/50 px-1">X:+50</div>
        </div>

        {/* Lens Threshold Rings (Static Reference) */}
        <div className="absolute rounded-full border border-neutral-800 w-[160px] h-[160px] pointer-events-none flex items-start justify-center">
             <span className="text-[6px] text-neutral-600 bg-black/50 px-1 -mt-2">MACRO / WIDE (&lt;80)</span>
        </div>
        <div className="absolute rounded-full border border-neutral-800 w-[360px] h-[360px] pointer-events-none flex items-start justify-center">
             <span className="text-[6px] text-neutral-600 bg-black/50 px-1 -mt-2">TELEPHOTO (&gt;180)</span>
        </div>

        {/* Dynamic Range Rings */}
        <motion.div 
          className="absolute border border-studio-accent/40 rounded-full pointer-events-none border-dashed z-0"
          animate={{ width: camDist * 2, height: camDist * 2 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-studio-accent font-mono bg-black px-1 shadow-[0_0_10px_black]">
                CAM: {Math.round(camDist)}cm
            </div>
        </motion.div>
        
        <motion.div 
          className="absolute border border-studio-light/40 rounded-full pointer-events-none border-dashed z-0"
          animate={{ width: lightDist * 2, height: lightDist * 2 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-[8px] text-studio-light font-mono bg-black px-1 shadow-[0_0_10px_black]">
              LIGHT: {Math.round(lightDist)}cm
          </div>
        </motion.div>

        {/* Subject (Center) with Ambient Occlusion */}
        <div className="absolute z-10 flex flex-col items-center justify-center pointer-events-none">
          {/* Ambient Occlusion Shadow */}
          <div className="absolute w-[100px] h-[100px] bg-black opacity-60 blur-xl rounded-full -z-10"></div>
          
          <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_white] z-10"></div>
          <div className="w-[1px] h-[20px] bg-neutral-700 absolute -top-6"></div>
          <div className="w-[20px] h-[1px] bg-neutral-700 absolute -left-6"></div>
        </div>

        {/* Interactive Icons */}
        <DraggableIcon 
          position={cameraPos} 
          onDrag={setCameraPos}
          onDragEnd={triggerShake}
          icon={<Camera size={20} className="text-black" />}
          label="Camera"
          color="border-studio-accent bg-studio-accent shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          zoom={zoom}
        />

        <DraggableIcon 
          position={lightPos} 
          onDrag={setLightPos}
          onDragEnd={triggerShake}
          icon={<Zap size={20} className="text-black" />}
          label="Light"
          color="border-studio-light bg-studio-light shadow-[0_0_15px_rgba(255,170,0,0.4)]"
          zoom={zoom}
        />

      </motion.div>
      
      {/* HUD: Zoom/Pan Controls & Indicators */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none z-50">
        <div className="bg-black/80 backdrop-blur border border-neutral-800 rounded px-3 py-2 text-xs font-mono text-neutral-400">
           <div>ZOOM: {Math.round(zoom * 100)}%</div>
           <div>PAN: {Math.round(pan.x)}, {Math.round(pan.y)}</div>
        </div>
      </div>
      
      <div className="absolute top-6 right-6 text-xs text-neutral-600 font-mono text-right pointer-events-none z-50">
        SCROLL TO ZOOM<br/>DRAG BG TO PAN
      </div>
    </div>
  );
};