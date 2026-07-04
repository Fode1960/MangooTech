/// <reference types="vite/client" />

declare global {
  interface Window {
    __mangoo_main_loaded?: boolean;
    __mangootech_main_started__?: number;
    __mangootech_app_rendered__?: number;
    wsConnection?: WebSocket;
    webkitAudioContext?: typeof AudioContext;
  }

  interface HTMLAudioElement {
    playsInline?: boolean;
  }

  interface NotificationOptions {
    vibrate?: number[];
  }

  interface MediaTrackConstraintSet {
    latency?: number | ConstrainDouble;
    cursor?: ConstrainDOMString;
    displaySurface?: ConstrainDOMString;
  }
}

export {};
