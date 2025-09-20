// src/vite-env.d.ts - ADD CSS SUPPORT
/// <reference types="vite/client" />

// ✅ Add this line to fix the red line
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// Your existing Vite environment types
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}