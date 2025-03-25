import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 导入样式
import './index.css'
import './assets/styles/variables.scss'

// 创建 pinia 实例
const pinia = createPinia()

// 创建 Vue 应用实例
const app = createApp(App)

// 注册 pinia
app.use(pinia)

// 挂载应用
app.mount('#app')

// 开发环境提示
console.log('科幻便签应用已启动 🚀') 