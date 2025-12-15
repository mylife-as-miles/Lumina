import React from 'react';
import { motion } from 'framer-motion';
import { Coordinates } from '../types';

interface DraggableIconProps {
  position: Coordinates;
  onDrag: (pos: Coordinates) => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  size?: number;
}

export const DraggableIcon: React.FC<DraggableIconProps> = ({
  position,
  onDrag,
  icon,
  label,
  color,
  size = 48
}) => {
  // Center of the canvas is (0,0) in our logic. 
  // We don't need to offset for display if the parent container is set up correctly with flex center
  // and we treat the motion div as absolute or relative to that center.
  // However, framer-motion 'drag' usually works best when the element is positioned relative to its container.
  
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      onDrag={(event, info) => {
        // We update the parent state with the new visual coordinates
        onDrag({ x: info.point.x, y: info.point.y });
      }}
      // Use onDragEnd/onUpdate to sync cleaner logic if needed, but onUpdate is frequent.
      // A better way for controlled components in Framer Motion is updating state in onDrag
      onUpdate={(latest) => {
         // The 'animate' prop handles the external updates (Gemini).
         // The 'drag' gesture handles internal updates.
         // To sync them, we need to push the drag values back up.
         if (typeof latest.x === 'number' && typeof latest.y === 'number') {
            onDrag({ x: latest.x, y: latest.y });
         }
      }}
      className="absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group z-20"
      style={{ 
        width: size, 
        height: size, 
        // We rely on the parent to place (0,0) at the visual center using top-1/2 left-1/2
        // But 'x' and 'y' in framer motion are transforms.
      }}
    >
      <div 
        className={`rounded-full p-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 transition-colors duration-300 bg-neutral-900 ${color}`}
      >
        {icon}
      </div>
      <span className="mt-2 text-[10px] uppercase tracking-wider font-mono bg-black/50 px-1 rounded text-neutral-400 group-hover:text-white transition-colors select-none whitespace-nowrap">
        {label}
      </span>
      
      {/* Dashed line to center indicator (visual aid) */}
      <svg className="absolute w-[600px] h-[600px] pointer-events-none opacity-0 group-hover:opacity-20 transition-opacity" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
         <line x1="300" y1="300" x2={300 - position.x} y2={300 - position.y} stroke="currentColor" strokeDasharray="4" />
      </svg>
    </motion.div>
  );
};