/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VEHICLE_API_KEY: string;
    readonly VITE_VEHICLE_API_URL: string;
    readonly [key: string]: string | undefined;
  };
}
