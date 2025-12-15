import { GoogleGenAI, SchemaType, Type } from "@google/genai";
import { Coordinates } from "../types";

// Safety check for API Key
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are the "Director Agent" for a virtual photography studio app called Lumina.
You control the physical position of a Camera and a Light source on a 2D floor plan to achieve specific cinematic looks based on user descriptions.

COORDINATE SYSTEM:
- The Subject is at (0, 0).
- The canvas range is roughly -300 to 300 on both axes.
- Y-Axis: Negative is UP (Back of studio), Positive is DOWN (Front of studio).
- X-Axis: Negative is LEFT, Positive is RIGHT.

LOGIC RULES:
1. Camera Distance:
   - Close (< 80): Wide angle, intense, distorted, macro.
   - Medium (80-180): Standard portrait, 50mm.
   - Far (> 180): Telephoto, compressed background, voyeuristic.

2. Camera Angle:
   - (0, y>0): Front view.
   - (x!=0, y): Side/Angled view.

3. Light Position:
   - Close to subject: Hard, high contrast shadows.
   - Far from subject: Soft, diffused light.
   - Behind subject (y < 0): Rim light, silhouette, dramatic.
   - Front of subject (y > 0): Beauty lighting.

Your task: output a JSON object with 'camera' and 'light' coordinates (x, y) that match the user's requested style (e.g., "Film Noir", "Cyberpunk", "Corporate Headshot").
`;

export const getDirectorCoordinates = async (
  prompt: string, 
  currentCam: Coordinates, 
  currentLight: Coordinates
): Promise<{ camera: Coordinates; light: Coordinates } | null> => {
  if (!API_KEY) {
    console.error("Gemini API Key is missing.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Current State - Camera: ${JSON.stringify(currentCam)}, Light: ${JSON.stringify(currentLight)}. 
      User Request: "${prompt}".
      Move the camera and light to achieve this look.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            camera: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
              required: ["x", "y"],
            },
            light: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
              required: ["x", "y"],
            },
          },
          required: ["camera", "light"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Director Error:", error);
    return null;
  }
};