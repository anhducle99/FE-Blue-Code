/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ZALO_MINI_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
