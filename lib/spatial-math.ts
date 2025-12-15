import { Coordinates, FiboPrompt } from '../types';

/**
 * Calculates the Bria FIBO JSON structure based on spatial coordinates.
 * Center is (0,0).
 * Range is roughly -300 to +300.
 */
export const calculateFiboParams = (
  cam: Coordinates, 
  light: Coordinates, 
  userPrompt: string
): FiboPrompt => {
  
  // --- Camera Logic ---
  const camDist = Math.sqrt(cam.x ** 2 + cam.y ** 2);
  const camAngleRad = Math.atan2(cam.y, cam.x);
  const camAngleDeg = camAngleRad * (180 / Math.PI);

  let lens = "50mm (Standard)";
  if (camDist < 100) lens = "24mm (Wide Angle)";
  if (camDist < 60) lens = "18mm (Fisheye)";
  if (camDist > 180) lens = "85mm (Portrait)";
  if (camDist > 250) lens = "200mm (Telephoto)";

  let view = "Front View";
  // Simple quadrant logic for view angle
  // -90 is top (in screen coords if y is inverted, but let's assume standard math grid: up is neg Y in DOM usually, but let's stick to Cartesian for logic)
  // In DOM: -Y is Up, +Y is Down. -X Left, +X Right.
  
  if (Math.abs(cam.x) < 40 && cam.y > 0) view = "Front View";
  else if (Math.abs(cam.x) < 40 && cam.y < 0) view = "Back View";
  else if (cam.x < -40) view = "Left Side Profile";
  else if (cam.x > 40) view = "Right Side Profile";
  
  // Refine with height (simulated by Y proximity to 0 in a top-down view? 
  // or purely radial). Let's keep it simple top-down 2D map.
  
  // --- Lighting Logic ---
  const lightDist = Math.sqrt(light.x ** 2 + light.y ** 2);
  const lightAngleRad = Math.atan2(light.y, light.x);
  const lightAngleDeg = lightAngleRad * (180 / Math.PI);

  let direction = "Front Lighting";
  
  // Map angles to directions (DOM coords: 0 is Right, 90 is Down, 180 is Left, -90 is Up)
  if (lightAngleDeg > -45 && lightAngleDeg <= 45) direction = "Right Side Lighting";
  else if (lightAngleDeg > 45 && lightAngleDeg <= 135) direction = "Front Lighting (Low)"; // Assuming down is front for the subject
  else if (lightAngleDeg > 135 || lightAngleDeg <= -135) direction = "Left Side Lighting";
  else if (lightAngleDeg > -135 && lightAngleDeg <= -45) direction = "Back/Rim Lighting";

  let style = "Soft Light";
  if (lightDist < 80) style = "Hard/Harsh Light";
  if (lightDist > 200) style = "Diffused/Ambient Light";

  return {
    camera: {
      lens,
      view,
    },
    lighting: {
      direction,
      style,
    },
    prompt: userPrompt || "A futuristic portrait"
  };
};