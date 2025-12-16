
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Coordinates, SubjectType } from '../types';

// Three.js Imports
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  TransformControls, 
  Grid, 
  Environment, 
  ContactShadows, 
  Text,
  Float,
  Box,
  Cylinder,
  Billboard
} from '@react-three/drei';

// --- TYPE DECLARATION FIX ---
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
  onInteractionEnd?: () => void;
  subjectType: SubjectType;
  activeGuide: 'none' | 'thirds' | 'golden' | 'center';
}

// --- 3D SUB-COMPONENTS ---

const SubjectModel = ({ type }: { type: SubjectType }) => {
  return (
    <group position={[0, 0, 0]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        {type === 'person' && (
          <>
            <mesh position={[0, 25, 0]} castShadow receiveShadow>
               <sphereGeometry args={[12, 32, 32]} />
               <meshStandardMaterial color="#333" roughness={0.1} metalness={0.8} />
            </mesh>
            <mesh position={[0, -10, 0]} castShadow receiveShadow>
               <capsuleGeometry args={[10, 40, 4, 16]} />
               <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
            </mesh>
          </>
        )}
        
        {type === 'car' && (
          <group position={[0, 10, 0]} scale={0.8}>
             <Box args={[30, 15, 60]} position={[0, 5, 0]} castShadow receiveShadow>
               <meshStandardMaterial color="#700" roughness={0.2} metalness={0.9} />
             </Box>
             <Box args={[25, 12, 30]} position={[0, 18, -5]} castShadow receiveShadow>
               <meshStandardMaterial color="#111" roughness={0.1} metalness={0.5} />
             </Box>
             <Cylinder args={[6, 6, 4]} rotation={[0, 0, Math.PI/2]} position={[16, -5, 20]}>
                <meshStandardMaterial color="#111" />
             </Cylinder>
             <Cylinder args={[6, 6, 4]} rotation={[0, 0, Math.PI/2]} position={[-16, -5, 20]}>
                <meshStandardMaterial color="#111" />
             </Cylinder>
             <Cylinder args={[6, 6, 4]} rotation={[0, 0, Math.PI/2]} position={[16, -5, -20]}>
                <meshStandardMaterial color="#111" />
             </Cylinder>
             <Cylinder args={[6, 6, 4]} rotation={[0, 0, Math.PI/2]} position={[-16, -5, -20]}>
                <meshStandardMaterial color="#111" />
             </Cylinder>
          </group>
        )}

        {type === 'building' && (
          <group position={[0, 20, 0]}>
            <Box args={[30, 60, 30]} castShadow receiveShadow>
               <meshStandardMaterial color="#444" roughness={0.5} metalness={0.2} />
            </Box>
             <Box args={[32, 2, 32]} position={[0, 0, 0]}>
               <meshStandardMaterial color="#111" />
            </Box>
            <Box args={[32, 2, 32]} position={[0, 15, 0]}>
               <meshStandardMaterial color="#111" />
            </Box>
             <Box args={[32, 2, 32]} position={[0, -15, 0]}>
               <meshStandardMaterial color="#111" />
            </Box>
          </group>
        )}
      </Float>
      
      {/* Grounding Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <ringGeometry args={[15, 16, 32]} />
        <meshBasicMaterial color="#00f0ff" opacity={0.2} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const VisualGuides = ({ type }: { type: 'none' | 'thirds' | 'golden' | 'center' }) => {
  if (type === 'none') return null;

  return (
    <group position={[0, 0.5, 0]}>
      {type === 'center' && (
        <>
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
             <planeGeometry args={[0.5, 400]} />
             <meshBasicMaterial color="#00f0ff" opacity={0.3} transparent side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
             <planeGeometry args={[0.5, 400]} />
             <meshBasicMaterial color="#00f0ff" opacity={0.3} transparent side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {type === 'thirds' && (
        <>
           {/* Rule of Thirds Boundaries (approx 80 units based on math) */}
           <mesh position={[-80, 0, 0]}>
             <planeGeometry args={[1, 400]} />
             <meshBasicMaterial color="#ffff00" opacity={0.2} transparent side={THREE.DoubleSide} />
           </mesh>
           <mesh position={[80, 0, 0]}>
             <planeGeometry args={[1, 400]} />
             <meshBasicMaterial color="#ffff00" opacity={0.2} transparent side={THREE.DoubleSide} />
           </mesh>
        </>
      )}
      
      {type === 'golden' && (
        <>
           {/* Golden Ratio (approx 50 units) */}
           <mesh position={[-50, 0, 0]}>
             <planeGeometry args={[1, 400]} />
             <meshBasicMaterial color="#ff00ff" opacity={0.2} transparent side={THREE.DoubleSide} />
           </mesh>
           <mesh position={[50, 0, 0]}>
             <planeGeometry args={[1, 400]} />
             <meshBasicMaterial color="#ff00ff" opacity={0.2} transparent side={THREE.DoubleSide} />
           </mesh>
        </>
      )}
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
  const [isDragging, setIsDragging] = useState(false);
  
  // Mapping App Coords (X, Y=Depth, Z=Height) to Three (X, Y=Height, Z=Depth)
  const targetThreePos = new THREE.Vector3(position.x, position.z, position.y);
  
  // Animation loop: Smoothly interpolate to target position unless dragging
  useFrame((state, delta) => {
    if (meshRef.current && !isDragging) {
      // Lerp for smooth animation when coordinates update externally (e.g. AI Agent)
      meshRef.current.position.lerp(targetThreePos, 6 * delta);
      // Ensure the prop faces the "stage"
      meshRef.current.lookAt(0, position.z * 0.5, 0); 
    }
  });

  // Handle snapping logic
  const SNAP_THRESHOLD = 10;
  const SNAP_GRID = 50;

  return (
    <TransformControls 
      object={meshRef as any} 
      mode="translate"
      enabled={isSelected}
      showX={isSelected} showY={isSelected} showZ={isSelected}
      size={0.8}
      onMouseDown={() => {
        setIsDragging(true);
        if (onDragStart) onDragStart();
      }}
      onMouseUp={() => {
        setIsDragging(false);
        if (onDragEnd) onDragEnd();
      }}
      onChange={(e) => {
          if (meshRef.current) {
            const p = meshRef.current.position;
            
            // Snapping Logic
            let x = p.x;
            let y = p.y; // Height (Z in app)
            let z = p.z; // Depth (Y in app)
            
            // Check snapping
            if (Math.abs(x) < SNAP_THRESHOLD) x = 0;
            else if (Math.abs(x % SNAP_GRID) < SNAP_THRESHOLD) x = Math.round(x / SNAP_GRID) * SNAP_GRID;
            
            if (Math.abs(z) < SNAP_THRESHOLD) z = 0;
            else if (Math.abs(z % SNAP_GRID) < SNAP_THRESHOLD) z = Math.round(z / SNAP_GRID) * SNAP_GRID;

            // Sync back: Three(X, Y, Z) -> App(X, Z, Y)
            onDrag({ x: x, y: z, z: y });
            
            // Note: We don't manually set meshRef.current.position here because 
            // TransformControls does it. We just sync the data up.
          }
      }}
    >
      <group 
        ref={meshRef} 
        // Initial position set, but useFrame handles updates
        position={[position.x, position.z, position.y]}
        onClick={(e) => { e.stopPropagation(); setIsSelected(!isSelected); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <group scale={isSelected ? 1.1 : 1}>
          {/* Mesh */}
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

          {/* Helpers */}
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

          <Billboard position={[0, 25, 0]}>
            <Text 
              fontSize={6} 
              color="white" 
              anchorX="center" 
              anchorY="middle"
              font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
            >
              {label}
            </Text>
          </Billboard>
          
          {(hovered || isSelected) && (
            <Billboard position={[0, 16, 0]}>
              <Text 
                fontSize={3} 
                color="#888" 
                anchorX="center" 
                anchorY="middle" 
              >
                {Math.round(position.x)}, {Math.round(position.y)}, {Math.round(position.z)}
              </Text>
            </Billboard>
          )}
        </group>
      </group>
    </TransformControls>
  );
};

const StudioScene = ({ 
  cameraPos, setCameraPos, onCamDragEnd,
  lightPos, setLightPos, onLightDragEnd,
  subjectType,
  activeGuide
}: any) => {
  const [target] = useState(() => {
    const t = new THREE.Object3D();
    t.position.set(0, 20, 0); 
    return t;
  });

  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.2} />
      
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
      
      <group position={[0, 0.1, 0]}>
        <mesh position={[100, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <cylinderGeometry args={[0.2, 0.2, 200]} />
           <meshBasicMaterial color="#500" />
        </mesh>
        <mesh position={[0, 0, 100]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.2, 0.2, 200]} />
           <meshBasicMaterial color="#005" />
        </mesh>
      </group>

      <SubjectModel type={subjectType} />
      <VisualGuides type={activeGuide} />
      
      <ContactShadows resolution={1024} scale={200} blur={2} opacity={0.5} far={10} color="#000" />

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

      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.05}
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
  onInteractionEnd,
  subjectType,
  activeGuide
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
               subjectType={subjectType}
               activeGuide={activeGuide}
            />
         </Suspense>
       </Canvas>
       
       <div className="absolute bottom-4 left-4 text-[10px] text-neutral-600 font-mono pointer-events-none select-none">
          Left Click: Rotate • Right Click: Pan • Scroll: Zoom • Click Props to Move (Snapping Active)
       </div>
    </div>
  );
};
