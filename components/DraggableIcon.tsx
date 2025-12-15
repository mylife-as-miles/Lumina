import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
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
  is3DMode?: boolean;
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
  zoom = 1,
  is3DMode = false
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  // Z-axis visualization (Scale based on height)
  // Base scale is 1. Higher Z = bigger (closer/higher)
  const zScale = 1 + (position.z / 500); 
  
  // Shadow blur/spread based on Z (Higher = more diffuse, further)
  const shadowBlur = Math.max(10, 10 + (position.z / 5));
  const shadowOpacity = Math.max(0.2, 1 - (position.z / 300));

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      // When not dragging, animate to position (so undo/redo works)
      animate={{ 
        x: position.x, 
        y: position.y,
        scale: isDragging ? 1.2 : zScale,
        rotateX: is3DMode ? -45 : 0 // Counter-rotate icon in 3D mode to face camera
      }}
      // Add a nice bounce when releasing
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 1 
      }}
      onDragStart={() => {
        setIsDragging(true);
        if (onDragStart) onDragStart();
      }}
      onDragEnd={() => {
        setIsDragging(false);
        if (onDragEnd) onDragEnd();
      }}
      onDrag={(event, info) => {
        // Shift Key for Height (Z) adjustment
        const e = event as PointerEvent; // Framer motion passes pointer event
        
        let newX = position.x + info.delta.x / zoom;
        let newY = position.y + info.delta.y / zoom;
        let newZ = position.z;

        if (e.shiftKey) {
          // Lock X/Y, modify Z with Y-drag
          newX = position.x;
          newY = position.y;
          // Invert deltaY so dragging UP increases Z (Height)
          newZ = position.z - (info.delta.y / zoom) * 2;
        }

        onDrag({ x: newX, y: newY, z: newZ });
      }}
      className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing group z-30`}
      style={{ 
        width: size, 
        height: size,
        // Lift element in CSS z-index based on height so higher items overlap lower ones
        zIndex: 30 + Math.floor(position.z)
      }}
    >
      {/* Icon Container with Interaction States */}
      <motion.div 
        className="relative"
        whileTap={{ scale: 0.9 }}
      >
        {/* The Icon Itself */}
        <div 
          className={`
            relative z-20 rounded-full p-2.5 transition-all duration-200
            ${color}
            ${isDragging ? 'ring-4 ring-white/50 shadow-2xl' : ''}
          `}
        >
          {icon}
        </div>
        
        {/* Hover Glow Effect */}
        <motion.div 
          className={`absolute inset-0 rounded-full blur-md z-10 ${color.replace('border-', 'bg-').split(' ')[0]}`}
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 0.6, scale: 1.4 }}
          animate={{ opacity: isDragging ? 0.8 : 0 }}
        />

        {/* Height Stem (Visualizes Z distance from ground) */}
        {position.z !== 0 && (
           <div 
             className="absolute top-1/2 left-1/2 w-[2px] bg-white/30 -z-10 pointer-events-none"
             style={{
               height: Math.abs(position.z),
               transform: `translate(-50%, 0) ${position.z > 0 ? 'rotate(180deg)' : ''} translateY(50%)`,
               transformOrigin: 'top center'
             }}
           ></div>
        )}
        
        {/* Ground Shadow (Visualizes Z position) */}
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 bg-black rounded-full blur-sm pointer-events-none -z-20 transition-all duration-75"
          style={{
             width: size * (1 - position.z/400),
             height: size/2 * (1 - position.z/400),
             opacity: shadowOpacity,
             marginTop: position.z > 0 ? position.z : 0, // Push shadow away if high
             filter: `blur(${shadowBlur}px)`
          }}
        ></div>

      </motion.div>

      {/* Precise Tooltip */}
      <div className={`absolute top-full mt-3 transition-all duration-200 pointer-events-none z-50 flex flex-col items-center
                      ${isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
      `}>
         <div className="bg-neutral-900/90 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-md border border-neutral-700 font-mono whitespace-nowrap shadow-xl flex flex-col items-center">
           <span className="font-bold tracking-wider">{label.toUpperCase()}</span>
           <span className="text-neutral-400">
             X:{Math.round(position.x)} Y:{Math.round(position.y)} <span className="text-studio-accent">Z:{Math.round(position.z)}</span>
           </span>
           {isDragging && <span className="text-[8px] text-neutral-500 mt-1">SHIFT+DRAG for Height</span>}
         </div>
         <div className="w-2 h-2 bg-neutral-900 border-t border-l border-neutral-700 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
      </div>
    </motion.div>
  );
};