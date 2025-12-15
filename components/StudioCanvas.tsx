import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Zap, Target } from 'lucide-react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Grid rendering helper
  const renderGrid = () => {
    return (
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full" 
             style={{ 
               backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, 
               backgroundSize: '50px 50px',
               backgroundPosition: 'center center'
             }}>
        </div>
        {/* Axes */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-neutral-600"></div>
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-neutral-600"></div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-studio-bg overflow-hidden flex items-center justify-center select-none shadow-inner shadow-black">
      {renderGrid()}
      
      {/* Canvas Container - Defines the coordinate space visually */}
      {/* We center everything. Framer Motion x/y 0 is the starting point. */}
      
      {/* Subject (Center) */}
      <div className="absolute z-10 flex flex-col items-center justify-center">
        <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_white]"></div>
        <div className="mt-2 text-xs text-neutral-500 font-mono tracking-widest">SUBJECT</div>
      </div>

      {/* Camera Icon */}
      <DraggableIcon 
        position={cameraPos} 
        onDrag={setCameraPos}
        icon={<Camera size={24} className="text-studio-accent" />}
        label="Camera"
        color="border-studio-accent shadow-studio-accent/20"
      />

      {/* Light Icon */}
      <DraggableIcon 
        position={lightPos} 
        onDrag={setLightPos}
        icon={<Zap size={24} className="text-studio-light" />}
        label="Light"
        color="border-studio-light shadow-studio-light/20"
      />
      
      {/* Decor: Range Rings */}
      <div className="absolute border border-neutral-800 rounded-full w-[200px] h-[200px] pointer-events-none opacity-30 border-dashed"></div>
      <div className="absolute border border-neutral-800 rounded-full w-[500px] h-[500px] pointer-events-none opacity-20 border-dashed"></div>

    </div>
  );
};