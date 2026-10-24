// packages/types/src/index.ts
// purpose: shared typescript interfaces, models, and discriminated unions

// component saved in db
export interface ComponentDocument {
  id: string;
  prompt: string;
  code: string;
  title: string;
  createdAt: number;
  userId: string;
}

// generation state (discriminated union)
export type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; code: string; prompt: string }
  | { status: 'error'; message: string };

// gallery state (discriminated union)
export type GalleryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; components: ComponentDocument[] }
  | { status: 'error'; message: string };

// auth state (discriminated union)
export type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User; token: string }
  | { status: 'error'; message: string };

export interface User {
  id: string;
  email: string;
  createdAt: number;
}

// api request/response shapes
export interface SignupRequest { email: string; password: string; }
export interface SigninRequest { email: string; password: string; }
export interface AuthResponse  { token: string; user: User; }
export interface GenerateRequest  { prompt: string; }
export interface GenerateResponse { code: string; }
export interface SaveComponentRequest { prompt: string; code: string; title: string; }

// component props
export interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  onCancel?: () => void;
  isLoading: boolean;
}

export interface PreviewPanelProps {
  state: GenerationState;
  onSave: () => void;
  isSaving: boolean;
  isSaved?: boolean;
}

export interface GalleryGridProps {
  state: GalleryState;
  onRefresh: () => void;
}
