// 全局类型声明
import * as Vue from 'vue'
import * as Pinia from 'pinia'

// 扩展Window接口，添加Tauri全局对象
interface Window {
  __TAURI__?: {
    window: {
      appWindow: {
        minimize: () => Promise<void>;
        close: () => Promise<void>;
        hide: () => Promise<void>;
        show: () => Promise<void>;
      };
      // 添加Tauri v1.x的窗口管理API
      getCurrent?: () => {
        minimize: () => Promise<void>;
        hide: () => Promise<void>;
        show: () => Promise<void>;
        close: () => Promise<void>;
      };
    };
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>;
    event?: {
      listen: (event: string, callback: (...args: any[]) => void) => Promise<any>;
      emit: (event: string, payload?: any) => Promise<void>;
    };
  }
}

// 扩展类型声明以支持组件内的属性和方法
declare module 'vue' {
  interface ComponentCustomProperties {
    // 可以在这里声明全局属性和方法
  }
}

// 声明模块
declare module 'vue'
declare module 'pinia'
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 为Tauri全局对象添加类型声明
interface TauriCommand {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
}

interface TauriEvent {
  listen(event: string, callback: (...args: any[]) => void): Promise<any>;
  emit(event: string, payload?: any): Promise<void>;
}

interface TauriWindow {
  getCurrent?: () => {
    minimize: () => Promise<void>;
    hide: () => Promise<void>;
    show: () => Promise<void>;
    close: () => Promise<void>;
  };
  appWindow: {
    minimize(): Promise<void>;
    close(): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    setFocus(): Promise<void>;
    setDecorations(decorations: boolean): Promise<void>;
    setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
    setSize(size: { width: number; height: number }): Promise<void>;
    setPosition(position: { x: number; y: number }): Promise<void>;
    center(): Promise<void>;
  };
}

interface Tauri {
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
  event: TauriEvent;
  window: TauriWindow;
  command: TauriCommand;
}

// 扩展Window接口，添加Tauri全局对象
declare global {
  interface Window { 
    __TAURI__: Tauri;
  }
} 