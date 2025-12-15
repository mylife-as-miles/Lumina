export interface Coordinates {
  x: number;
  y: number;
  z: number; // Vertical height (Low/High angle)
}

export interface FiboPrompt {
  structured_prompt: {
    camera: {
      lens: string;
      view: string;
      aperture: string;
    };
    lighting: {
      direction: string;
      style: string;
    };
  };
  prompt: string;
}

export interface StudioState {
  camera: Coordinates;
  light: Coordinates;
  aperture: string;
  prompt: string;
  filters: string[];
}

export interface RenderResult {
  id: string;
  status: 'idle' | 'generating' | 'complete' | 'error';
  imageUrl?: string;
}

export enum StudioMode {
  MANUAL = 'MANUAL',
  AGENT = 'AGENT'
}

export const AVAILABLE_FILTERS = [
  "Film Grain",
  "Soft Bloom",
  "Cinematic Color Grading",
  "Vignette",
  "Motion Blur"
];