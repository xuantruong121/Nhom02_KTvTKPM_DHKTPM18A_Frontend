/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL API, ví dụ `/api/v1` hoặc `http://localhost:8080/api/v1` */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
