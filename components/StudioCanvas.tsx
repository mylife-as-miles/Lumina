import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Coordinates } from '../types';

// Three.js Imports
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  TransformControls, 
  Grid, 
  Environment, 
  ContactShadows, 
  Text,
  Float
} from '@react-three/drei';

// --- TYPE DECLARATION FIX ---
// Override JSX.IntrinsicElements to allow React Three Fiber elements which are generated dynamically.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface StudioCanvasProps {
  cameraPos: Coordinates;
  setCameraPos: (pos: Coordinates) => void;
  lightPos: Coordinates;
  setLightPos: (pos: Coordinates) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

// --- 3D SUB-COMPONENTS ---

const SubjectModel = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Abstract Artistic Mannequin */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh position={[0, 25, 0]} castShadow receiveShadow>
           <sphereGeometry args={[12, 32, 32]} />
           <meshStandardMaterial color="#333" roughness={0.1} metalness={0.8} />
        </mesh>
        <mesh position={[0, -10, 0]} castShadow receiveShadow>
           <capsuleGeometry args={[10, 40, 4, 16]} />
           <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
        </mesh>
      </Float>
      {/* Grounding Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <ringGeometry args={[15, 16, 32]} />
        <meshBasicMaterial color="#00f0ff" opacity={0.2} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// A specialized controller for a prop in the 3D scene
const PropController = ({ 
  position, 
  onDrag, 
  onDragStart, 
  onDragEnd, 
  color, 
  label, 
  type 
}: any) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  
  // Mapping App Coords (X, Y=Depth, Z=Height) to Three (X, Y=Height, Z=Depth)
  const threePos = new THREE.Vector3(position.x, position.z, position.y);
  
  // Update internal ref if prop changes externally (e.g. undo/redo)
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(position.x, position.z, position.y);
      // Look at center
      meshRef.current.lookAt(0, position.z * 0.5, 0); 
    }
  }, [position.x, position.y, position.z]);

  return (
    <>
      <TransformControls 
        object={meshRef as any} 
        mode="translate"
        enabled={isSelected}
        showX={isSelected} showY={isSelected} showZ={isSelected}
        size={0.8}
        onMouseDown={() => {
          if (onDragStart) onDragStart();
        }}
        onMouseUp={() => {
          if (onDragEnd) onDragEnd();
        }}
        onChange={(e) => {
           if (meshRef.current) {
             const p = meshRef.current.position;
             // Sync back: Three(X, Y, Z) -> App(X, Z, Y)
             onDrag({ x: p.x, y: p.z, z: p.y });
             meshRef.current.lookAt(0, p.y * 0.5, 0);
           }
        }}
      >
        <group 
          ref={meshRef} 
          position={threePos} 
          onClick={(e) => { e.stopPropagation(); setIsSelected(!isSelected); }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Visual Representation */}
          <group scale={isSelected ? 1.1 : 1}>
            {/* The "Device" Mesh */}
            <mesh rotation={[0, Math.PI, 0]}>
               {type === 'camera' ? (
                 <group>
                   <boxGeometry args={[15, 15, 25]} />
                   <meshStandardMaterial color={isSelected ? color : "#222"} emissive={color} emissiveIntensity={isSelected ? 0.5 : 0.1} />
                   <mesh position={[0, 0, 15]} rotation={[Math.PI/2, 0, 0]}>
                     <cylinderGeometry args={[8, 8, 10]} />
                     <meshStandardMaterial color="#111" />
                   </mesh>
                 </group>
               ) : (
                 <group rotation={[Math.PI/2, 0, 0]}>
                   <cylinderGeometry args={[2, 12, 15, 4]} />
                   <meshStandardMaterial color={isSelected ? color : "#222"} emissive={color} emissiveIntensity={isSelected ? 0.8 : 0.2} />
                   <mesh position={[0, -8, 0]}>
                      <sphereGeometry args={[5]} />
                      <meshBasicMaterial color="#fff" />
                   </mesh>
                 </group>
               )}
            </mesh>

            {/* Frustum / Light Cone Helper */}
            {type === 'camera' && (
              <mesh position={[0, 0, -40]} rotation={[Math.PI/2, 0, 0]}>
                 <coneGeometry args={[20, 60, 4, 1, true]} />
                 <meshBasicMaterial color={color} wireframe transparent opacity={0.1} />
              </mesh>
            )}
             {type === 'light' && (
              <mesh position={[0, 0, -40]} rotation={[Math.PI/2, 0, 0]}>
                 <coneGeometry args={[25, 60, 32, 1, true]} />
                 <meshBasicMaterial color={color} transparent opacity={0.05} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Label */}
            <Text 
              position={[0, 25, 0]} 
              fontSize={6} 
              color="white" 
              anchorX="center" 
              anchorY="middle"
              billboard
              font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" // fallback font
            >
              {label}
            </Text>
            
            {/* Coordinates Tooltip (Only when selected/hovered) */}
            {(hovered || isSelected) && (
              <Text 
                position={[0, 16, 0]} 
                fontSize={3} 
                color="#888" 
                anchorX="center" 
                anchorY="middle" 
                billboard
              >
                {Math.round(position.x)}, {Math.round(position.y)}, {Math.round(position.z)}
              </Text>
            )}
          </group>
        </group>
      </TransformControls>
    </>
  );
};

const StudioScene = ({ 
  cameraPos, setCameraPos, onCamDragEnd,
  lightPos, setLightPos, onLightDragEnd
}: any) => {
  // Lighting Target (Subject Center)
  const [target] = useState(() => {
    const t = new THREE.Object3D();
    t.position.set(0, 20, 0); 
    return t;
  });

  return (
    <>
      <primitive object={target} />

      {/* --- Environment & Lighting --- */}
      <ambientLight intensity={0.2} />
      
      {/* Dynamic Main SpotLight */}
      <spotLight 
        position={[lightPos.x, lightPos.z, lightPos.y]} 
        target={target}
        intensity={1500} 
        angle={0.8}
        penumbra={0.5}
        distance={2000}
        castShadow
        shadow-bias={-0.0001}
      />

      <Environment preset="city" />
      
      {/* --- Floor --- */}
      <Grid 
        infiniteGrid 
        fadeDistance={500} 
        sectionSize={50} 
        sectionThickness={1.5} 
        sectionColor="#333" 
        cellSize={10} 
        cellThickness={0.6} 
        cellColor="#1a1a1a" 
        position={[0, -0.1, 0]}
      />
      
      {/* Axes */}
      <group position={[0, 0.1, 0]}>
        {/* X Axis (Red) */}
        <mesh position={[100, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <cylinderGeometry args={[0.2, 0.2, 200]} />
           <meshBasicMaterial color="#500" />
        </mesh>
        {/* Z Axis (Blue - Depth in 3D) */}
        <mesh position={[0, 0, 100]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.2, 0.2, 200]} />
           <meshBasicMaterial color="#005" />
        </mesh>
      </group>

      <SubjectModel />
      <ContactShadows resolution={1024} scale={200} blur={2} opacity={0.5} far={10} color="#000" />

      {/* --- Interactables --- */}
      <PropController 
        type="camera"
        label="CAMERA"
        position={cameraPos}
        onDrag={setCameraPos}
        onDragEnd={onCamDragEnd}
        color="#00f0ff"
      />

      <PropController 
        type="light"
        label="LIGHT"
        position={lightPos}
        onDrag={setLightPos}
        onDragEnd={onLightDragEnd}
        color="#ffaa00"
      />

      {/* Orbit Controls (Camera Movement) */}
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below floor
        maxDistance={500}
      />
    </>
  );
};

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  cameraPos,
  setCameraPos,
  lightPos,
  setLightPos,
  onInteractionEnd
}) => {
  return (
    <div className="w-full h-full bg-studio-bg cursor-crosshair">
       <Canvas
         shadows
         camera={{ position: [0, 50, 200], fov: 45 }}
         gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
         dpr={[1, 2]}
       >
         <Suspense fallback={null}>
            <StudioScene 
               cameraPos={cameraPos}
               setCameraPos={setCameraPos}
               onCamDragEnd={onInteractionEnd}
               lightPos={lightPos}
               setLightPos={setLightPos}
               onLightDragEnd={onInteractionEnd}
            />
         </Suspense>
       </Canvas>
       
       {/* 2D Overlay Elements */}
       <div className="absolute bottom-4 left-4 text-[10px] text-neutral-600 font-mono pointer-events-none select-none">
          Left Click: Rotate • Right Click: Pan • Scroll: Zoom • Click Props to Move
       </div>
    </div>
  );
};