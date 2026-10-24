// src/types.ts
export type {
  ComponentDocument,
  GenerationState,
  GalleryState,
  AuthState,
  User,
  SignupRequest,
  SigninRequest,
  AuthResponse,
  GenerateRequest,
  GenerateResponse,
  SaveComponentRequest,
  PromptInputProps,
  PreviewPanelProps,
  GalleryGridProps,
} from '@repo/types';

import type { ComponentDocument, PromptInputProps } from '@repo/types';

export interface SidebarProps extends PromptInputProps {
  savedComponents?: ComponentDocument[];
  isLoadingSaved?: boolean;
  savedError?: string | null;
  onSelectComponent?: (comp: ComponentDocument) => void;
  onDeleteComponent?: (id: string) => void;
  onRefreshSaved?: () => void;
  selectedComponentId?: string | null;
}
