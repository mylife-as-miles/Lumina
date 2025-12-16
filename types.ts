
export interface Coordinates {
  x: number;
  y: number;
  z: number; // Vertical height (Low/High angle)
}

export interface FiboPrompt {
  prompt: string;
  structured_prompt: {
    short_description: string;
    style_medium: string;
    artistic_style: string;
    photographic_characteristics: {
      camera_angle: string;
      lens_focal_length: string;
      depth_of_field: string;
      focus: string;
    };
    lighting: {
      direction: string;
      conditions: string;
      shadows: string;
    };
    aesthetics: {
      mood_atmosphere: string;
      color_scheme: string;
      composition: string;
    };
    objects: Array<{
      description: string;
      clothing?: string;
      appearance_details?: string;
      location?: string;
      action_pose?: string;
    }>;
  };
}

export type SubjectType = 'person' | 'car' | 'building' | 'product' | 'furniture';

export interface PostProcessing {
  bloom: number; // 0-100
  glare: number; // 0-100
  distortion: number; // 0-100
}

export interface SavedScene {
  id: string;
  name: string;
  state: StudioState;
  createdAt: number;
}

export interface StudioState {
  camera: Coordinates;
  light: Coordinates;
  aperture: string;
  prompt: string;
  filters: string[];
  postProcessing: PostProcessing;
  subjectType: SubjectType;
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
  "Cinematic Color Grading",
  "Vignette",
  "Motion Blur",
  "Chromatic Aberration"
];
