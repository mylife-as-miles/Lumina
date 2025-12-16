import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from "../types";

const SYSTEM_INSTRUCTION = `
You are the "Director Agent" for a virtual photography studio app called Lumina.
You control the physical position of a Camera and a Light source on a 3D coordinate system to achieve specific cinematic looks.

COORDINATE SYSTEM:
- The Subject is at (0, 0, 0).
- X-Axis: Negative Left, Positive Right.
- Y-Axis: Negative Back, Positive Front.
- Z-Axis: Height. 0 is Eye Level. Positive is Up (High Angle). Negative is Down (Low Angle).
- Range: -300 to 300 for X/Y, -200 to 200 for Z.

LOGIC RULES:
1. Camera Distance:
   - Close (< 80): Wide angle, intense.
   - Far (> 180): Telephoto, compressed.
2. Camera Height (Z):
   - High (Z > 50): Bird's eye, diminishing subject.
   - Low (Z < -50): Hero shot, imposing subject.
3. Lighting:
   - Z > 100: Overhead light.
   - Z < -50: Uplighting (Scary).

Your task: output a JSON object with 'camera' and 'light' coordinates (x, y, z) that match the user's requested style.
`;

export const getDirectorCoordinates = async (
  prompt: string, 
  currentCam: Coordinates, 
  currentLight: Coordinates,
  apiKey: string
): Promise<{ camera: Coordinates; light: Coordinates } | null> => {
  if (!apiKey) {
    console.error("Gemini API Key is missing.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

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
                z: { type: Type.NUMBER },
              },
              required: ["x", "y", "z"],
            },
            light: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                z: { type: Type.NUMBER },
              },
              required: ["x", "y", "z"],
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