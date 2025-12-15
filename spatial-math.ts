import { Coordinates, FiboPrompt } from './types';

/**
 * Calculates the Bria FIBO JSON structure based on spatial coordinates.
 * Center is (0,0,0).
 * Range is roughly -300 to +300.
 */
export const calculateFiboParams = (
  cam: Coordinates, 
  light: Coordinates, 
  userPrompt: string,
  apertureVal: string = "f/5.6",
  filters: string[] = []
): FiboPrompt => {
  
  // --- Camera Logic ---
  const camDist = Math.sqrt(cam.x ** 2 + cam.y ** 2); // Projected distance on floor

  let lens = "50mm (Standard)";
  if (camDist < 100) lens = "24mm (Wide Angle)";
  if (camDist < 60) lens = "18mm (Fisheye)";
  if (camDist > 180) lens = "85mm (Portrait)";
  if (camDist > 250) lens = "200mm (Telephoto)";

  let view = "Front View";
  
  // Height Logic (Z-axis)
  let angleMod = "";
  if (cam.z > 50) angleMod = "High Angle / Bird's Eye";
  else if (cam.z < -50) angleMod = "Low Angle / Hero View";
  else angleMod = "Eye Level";

  // Azimuth Logic (X/Y)
  let azimuth = "Front";
  if (Math.abs(cam.x) < 50 && cam.y > 0) azimuth = "Front View";
  else if (Math.abs(cam.x) < 50 && cam.y < 0) azimuth = "Back View";
  else if (cam.x < -50) azimuth = "Left Side Profile";
  else if (cam.x > 50) azimuth = "Right Side Profile";

  view = `${azimuth}, ${angleMod}`;
  
  // --- Lighting Logic ---
  const lightDist = Math.sqrt(light.x ** 2 + light.y ** 2);
  const lightAngleRad = Math.atan2(light.y, light.x);
  const lightAngleDeg = lightAngleRad * (180 / Math.PI);

  let direction = "Front Lighting";
  
  // Map angles to directions
  if (lightAngleDeg > -45 && lightAngleDeg <= 45) direction = "Right Side Lighting";
  else if (lightAngleDeg > 45 && lightAngleDeg <= 135) direction = "Front Lighting (Low)";
  else if (lightAngleDeg > 135 || lightAngleDeg <= -135) direction = "Left Side Lighting";
  else if (lightAngleDeg > -135 && lightAngleDeg <= -45) direction = "Back/Rim Lighting";
  
  // Light Height Logic
  if (light.z > 100) direction += " (Overhead/Top-Down)";
  if (light.z < -50) direction += " (Uplighting/Spooky)";

  let style = "Soft Light";
  if (lightDist < 80) style = "Hard/Harsh Light";
  if (lightDist > 200) style = "Diffused/Ambient Light";

  // --- Prompt Assembly with Filters ---
  let finalPrompt = userPrompt || "A futuristic portrait";
  if (filters.length > 0) {
    finalPrompt += ". Post-processing effects: " + filters.join(", ") + ".";
  }

  return {
    structured_prompt: {
      camera: {
        lens,
        view,
        aperture: apertureVal,
      },
      lighting: {
        direction,
        style,
      },
    },
    prompt: finalPrompt
  };
};