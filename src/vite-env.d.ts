/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue' {
  export function ref<T>(value: T): { value: T }
  export function reactive<T>(object: T): T
  export function provide(key: string | symbol, value: any): void
  export function onMounted(callback: () => void): void
  export function onUnmounted(callback: () => void): void
  export function watch<T>(source: any, callback: (value: T, oldValue: T) => void): void
  export function nextTick(callback?: () => void): Promise<void>
  export function computed<T>(getter: () => T): { value: T }
}

declare module 'pinia' {
  export function createPinia(): any
}

// Tauri API 接口定义
interface TauriWindow {
  appWindow: {
    hide(): Promise<void>;
    show(): Promise<void>;
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    unmaximize(): Promise<void>;
    isMaximized(): Promise<boolean>;
    setTitle(title: string): Promise<void>;
    setFocus(): Promise<void>;
  };
}

interface TauriEvent {
  listen(eventName: string, handler: (event: any) => void): Promise<() => void>;
}

interface TauriAPI {
  tauri: any;
  window: TauriWindow;
  event: TauriEvent;
  invoke<T>(command: string, args?: any): Promise<T>;
}

interface Window {
  __TAURI__?: TauriAPI;
} 