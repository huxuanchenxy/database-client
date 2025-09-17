import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'vxe-table/lib/style.css'
import VXETable from 'vxe-table'

import VxeUI from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'

const app = createApp(App)

/* 1️⃣ 创建 pinia 实例 */
const pinia = createPinia()
/* 2️⃣ 装持久化插件 */
pinia.use(piniaPluginPersistedstate)
/* 3️⃣ 再把同一个实例挂到应用 */
app.use(pinia)

app.use(ElementPlus)
app.use(VXETable)
app.use(VxeUI)
/* 注册图标 */
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')