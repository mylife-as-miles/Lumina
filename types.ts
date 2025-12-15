export interface Coordinates {
  x: number;
  y: number;
}

export interface FiboPrompt {
  camera: {
    lens: string;
    view: string;
    aperture?: string;
  };
  lighting: {
    direction: string;
    style: string;
  };
  prompt: string;
}

export interface StudioState {
  camera: Coordinates;
  light: Coordinates;
  userPrompt: string;
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