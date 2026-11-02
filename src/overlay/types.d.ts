/// <reference types="vite/client" />

interface Window {
    __SHOT_DATA__: import('./store.js').ScreenshotData | null;
    __BOOTSTRAP__: ((data: import('./store.js').ScreenshotData) => void) | null;
}
