// Vue组件类型声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 模块声明
declare module 'vue' {
  export interface GlobalComponents {
    // 这里可以添加全局组件
  }
}

// 声明全局属性
declare global {
  interface Window {
    // 可以在这里添加全局窗口属性
  }
} 