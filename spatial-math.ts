
import { Coordinates, FiboPrompt, PostProcessing, SubjectType } from './types';

/**
 * Calculates the High-Quality Structured Prompt based on spatial coordinates.
 */
export const calculateFiboParams = (
  cam: Coordinates, 
  light: Coordinates, 
  userPrompt: string,
  apertureVal: string = "f/5.6",
  filters: string[] = [],
  postProcessing: PostProcessing = { bloom: 0, glare: 0, distortion: 0 },
  subjectType: SubjectType = 'person'
): FiboPrompt => {
  
  // Convert filters to a Set for easier lookup
  const activeFilters = new Set(filters);

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

  // -- FILTER LOGIC: Optical Effects --
  // We append these directly to camera characteristics for better adherence
  let focusStr = "Sharp focus on subject";
  if (activeFilters.has("Vignette")) lens += ", Heavy Vignette";
  if (activeFilters.has("Chromatic Aberration")) lens += ", Chromatic Aberration";
  if (activeFilters.has("Motion Blur")) focusStr = "Motion Blur, Kinetic Energy";
  
  // Post Processing Integration
  if (postProcessing.bloom > 20) focusStr += ", Soft Bloom, Dreamy Glow";
  if (postProcessing.glare > 20) focusStr += ", Lens Flare, Specular Highlights";
  if (postProcessing.distortion > 20) lens += ", Barrel Distortion, Lens Curvature";

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
  
  // -- FILTER LOGIC: Styles --
  let artisticStyle = "Photorealistic / Editorial";
  if (activeFilters.has("Film Grain")) artisticStyle += ", ISO 3200, Analog Film Grain, Noise";
  if (activeFilters.has("Cinematic Color Grading")) artisticStyle += ", Color Graded, Teal and Orange LUT";
  
  const mood = activeFilters.size > 0 
    ? `Stylized: ${Array.from(activeFilters).join(", ")}` 
    : "Neutral, Clean, Professional";
  
  // Simple Color Scheme inference based on lighting position (Creative liberty)
  let colorScheme = "Natural / Balanced";
  if (lightDir.includes("Rim")) colorScheme = "Dramatic / High Contrast";
  if (lightDir.includes("Under")) colorScheme = "Moody / Cool Tones";

  // --- 4. Subject/Objects ---
  let description = userPrompt;
  if (!description) {
      if (subjectType === 'car') description = "A sleek modern sports car";
      else if (subjectType === 'building') description = "A modern architectural structure";
      else description = "A portrait of a person";
  }
  
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
      artistic_style: artisticStyle,
      photographic_characteristics: {
        camera_angle: angle,
        lens_focal_length: lens,
        depth_of_field: dof,
        focus: focusStr
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
          description: subjectType === 'person' ? "Main Subject" : description,
          location: "Center",
          action_pose: pose,
          appearance_details: "Detailed texture, high quality"
        }
      ]
    }
  };
};
