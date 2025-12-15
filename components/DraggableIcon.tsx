import React from 'react';
import { motion } from 'framer-motion';
import { Coordinates } from '../types';

interface DraggableIconProps {
  position: Coordinates;
  onDrag: (pos: Coordinates) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  size?: number;
  zoom?: number;
}

export const DraggableIcon: React.FC<DraggableIconProps> = ({
  position,
  onDrag,
  onDragStart,
  onDragEnd,
  icon,
  label,
  color,
  size = 48,
  zoom = 1
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0} 
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrag={(event, info) => {
        // Compensate for zoom level when calculating new position
        onDrag({ 
          x: position.x + info.delta.x / zoom, 
          y: position.y + info.delta.y / zoom 
        });
      }}
      className="absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group z-30"
      style={{ 
        width: size, 
        height: size, 
      }}
    >
      {/* Icon Container with Interaction States */}
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* The Icon Itself */}
        <div 
          className={`relative z-20 rounded-full p-2.5 transition-colors duration-200 ${color}`}
        >
          {icon}
        </div>
        
        {/* Hover Glow Effect (Distinct from Drag) */}
        <motion.div 
          className={`absolute inset-0 rounded-full blur-md z-10 ${color.replace('border-', 'bg-').split(' ')[0]}`}
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ 
            opacity: 0.6,
            scale: 1.4,
            transition: { 
              duration: 0.4, 
              ease: "easeOut"
            }
          }}
        />

        {/* Active Drag Ring Effect */}
        <div className={`absolute inset-0 rounded-full border-2 opacity-0 group-active:opacity-100 group-active:scale-150 transition-all duration-300 ${color.split(' ')[0]}`} />
      </motion.div>

      {/* Precise Tooltip */}
      <div className="absolute top-full mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-40 translate-y-2 group-hover:translate-y-0">
         <div className="bg-neutral-900/90 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-md border border-neutral-700 font-mono whitespace-nowrap shadow-xl flex flex-col items-center">
           <span className="font-bold tracking-wider">{label.toUpperCase()}</span>
           <span className="text-neutral-400">
             {Math.round(position.x)}, {Math.round(position.y)}
           </span>
         </div>
         {/* Little Arrow */}
         <div className="w-2 h-2 bg-neutral-900 border-t border-l border-neutral-700 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
      </div>
      
      {/* Dynamic Connector Line to Center */}
      <svg className="absolute w-[2000px] h-[2000px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }}>
         <defs>
            <marker id={`arrow-${label}`} markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="white" fillOpacity="0.3" />
            </marker>
         </defs>
         <line 
           x1="1000" y1="1000" 
           x2={1000 - position.x} y2={1000 - position.y} 
           stroke="white" 
           strokeOpacity="0.1"
           strokeWidth="1"
           strokeDasharray="4 2"
           markerEnd={`url(#arrow-${label})`}
         />
      </svg>
    </motion.div>
  );
};