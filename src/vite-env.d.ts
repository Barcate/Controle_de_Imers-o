/// <reference types="vite/client" />

import type { ElectronApi } from "./types/machine";

declare global {
  interface Window {
    electronApi?: ElectronApi;
  }
}
