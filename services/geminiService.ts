
import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from "../types";

const SYSTEM_INSTRUCTION = `
You are the "Director Agent" for Lumina, a spatial design tool. 
Your goal is to translate the user's creative intent into precise 3D coordinates for a Camera and a Light source.

THE STAGE (3D COORDINATE SYSTEM):
- **Subject**: Fixed at (0, 0, 0).
- **X-Axis (Horizontal)**: Negative = Left, Positive = Right. (Range: -300 to 300)
- **Y-Axis (Depth)**: Negative = Back (Behind Subject), Positive = Front (Towards Camera). (Range: -300 to 300)
- **Z-Axis (Height)**: 0 = Eye Level. Positive = Up (High Angle). Negative = Down (Low Angle). (Range: -200 to 200)

CINEMATIC LOGIC & RULES:
1. **Camera Distance (Y-Axis & X-Axis combined)**:
   - *Intimate/Wide*: Distance < 80. (e.g., [0, 60, 0])
   - *Portrait/Standard*: Distance ~120-150.
   - *Telephoto/Compressed*: Distance > 200.

2. **Camera Height (Z-Axis)**:
   - *Hero Shot*: Low angle (Z < -40). Makes subject look powerful.
   - *Bird's Eye*: High angle (Z > 80). Makes subject look small/integrated.
   - *Eye Level*: Z ~ 0.

3. **Lighting (Key & Mood)**:
   - *Rembrandt/Side*: Light X is offset (e.g., X=100, Y=100).
   - *Rim/Backlight*: Light Y is Negative (e.g., Y=-100). Essential for "Dramatic" or "Silhouette".
   - *Horror/Uplight*: Light Z is Negative (e.g., Z=-50).
   - *God Ray/Overhead*: Light Z is High (e.g., Z=150).

INSTRUCTIONS:
- Analyze the user's prompt for mood, style, and composition.
- Move the camera to frame the shot.
- Move the light to sculpt the subject.
- Return ONLY the JSON object with the new coordinates.
- Be bold with your choices if the prompt is dramatic.
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
      Act on the 3D space: Move the camera and light to achieve this look.`,
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
