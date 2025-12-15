import { Coordinates, FiboPrompt } from './types';

/**
 * Calculates the High-Quality Structured Prompt based on spatial coordinates.
 */
export const calculateFiboParams = (
  cam: Coordinates, 
  light: Coordinates, 
  userPrompt: string,
  apertureVal: string = "f/5.6",
  filters: string[] = []
): FiboPrompt => {
  
  // --- 1. Photographic Characteristics ---
  const camDist = Math.sqrt(cam.x ** 2 + cam.y ** 2);
  
  // Lens Logic
  let lens = "50mm";
  if (camDist < 60) lens = "18mm Fisheye";
  else if (camDist < 100) lens = "24mm Wide-Angle";
  else if (camDist < 140) lens = "35mm";
  else if (camDist > 250) lens = "200mm Telephoto";
  else if (camDist > 180) lens = "85mm Portrait";

  // Camera Angle Logic (Z-axis)
  let angle = "Eye-level";
  if (cam.z > 60) angle = "High Angle / Bird's Eye View";
  else if (cam.z > 20) angle = "Slightly Elevated";
  else if (cam.z < -60) angle = "Low Angle / Hero View";
  else if (cam.z < -20) angle = "Slightly Low Angle";

  // Depth of Field Logic
  const fNum = parseFloat(apertureVal.replace('f/', ''));
  let dof = `f/${fNum}`;
  if (fNum <= 2.8) dof += ", Shallow Depth of Field, Bokeh Background";
  else if (fNum >= 11) dof += ", Deep Depth of Field, Sharp Background";
  else dof += ", Standard Depth of Field";

  // --- 2. Lighting Logic ---
  const lightDist = Math.sqrt(light.x ** 2 + light.y ** 2);
  const lightAngleRad = Math.atan2(light.y, light.x);
  const lightAngleDeg = lightAngleRad * (180 / Math.PI);

  let lightDir = "Front Lighting";
  let shadows = "Soft Shadows";
  
  // Direction
  if (lightAngleDeg > -45 && lightAngleDeg <= 45) lightDir = "Right Side Lighting (Key)";
  else if (lightAngleDeg > 45 && lightAngleDeg <= 135) lightDir = "Front/Butterfly Lighting";
  else if (lightAngleDeg > 135 || lightAngleDeg <= -135) lightDir = "Left Side Lighting (Fill)";
  else if (lightAngleDeg > -135 && lightAngleDeg <= -45) {
     lightDir = "Rim / Back Lighting";
     shadows = "Silhouette / High Contrast";
  }
  
  // Light Height modifiers
  if (light.z > 100) {
    lightDir = "Overhead Top-Down Lighting";
    shadows = "Deep Eye Socket Shadows";
  } else if (light.z < -50) {
    lightDir = "Under/Horror Lighting";
    shadows = "Unnatural Upward Shadows";
  }

  let lightCondition = "Studio Strobe";
  if (lightDist < 80) {
    lightCondition = "Harsh Flash / Spotlight";
    shadows = "Hard, Crisp Shadows";
  } else if (lightDist > 200) {
    lightCondition = "Large Softbox / Ambient Window";
    shadows = "Diffused, Soft Shadows";
  }

  // --- 3. Aesthetics & Composition ---
  let composition = "Center Framed";
  if (cam.x < -80) composition = "Rule of Thirds (Left)";
  else if (cam.x > 80) composition = "Rule of Thirds (Right)";
  
  const mood = filters.length > 0 ? filters.join(", ") : "Neutral, Clean";
  
  // Simple Color Scheme inference based on lighting position (Creative liberty)
  let colorScheme = "Natural / Balanced";
  if (lightDir.includes("Rim")) colorScheme = "Dramatic / High Contrast";
  if (lightDir.includes("Under")) colorScheme = "Moody / Cool Tones";

  // --- 4. Subject/Objects ---
  // Parsing user prompt to extract subject if possible, otherwise generic
  const description = userPrompt || "A subject";
  
  // View/Pose relative to camera
  let pose = "Facing Camera";
  // This is a rough approximation of relative facing assuming subject faces forward (Positive Y)
  // actually using implicit azimuth logic here, just keeping it simple
  if (Math.abs(cam.x) < 50 && cam.y < 0) pose = "Back to Camera";
  else if (cam.x > 100) pose = "Profile View (Right)";
  else if (cam.x < -100) pose = "Profile View (Left)";

  return {
    prompt: userPrompt,
    structured_prompt: {
      short_description: description,
      style_medium: "Cinematic Photography",
      artistic_style: "Photorealistic / Editorial",
      photographic_characteristics: {
        camera_angle: angle,
        lens_focal_length: lens,
        depth_of_field: dof,
        focus: "Sharp focus on subject"
      },
      lighting: {
        direction: lightDir,
        conditions: lightCondition,
        shadows: shadows
      },
      aesthetics: {
        mood_atmosphere: mood,
        color_scheme: colorScheme,
        composition: composition
      },
      objects: [
        {
          description: "Main Subject",
          location: "Center",
          action_pose: pose,
          appearance_details: "Detailed texture, high quality"
        }
      ]
    }
  };
};