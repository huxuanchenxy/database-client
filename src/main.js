import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

// vxe-table 依赖
import 'xe-utils'
import VXETable from 'vxe-table'
import 'vxe-table/styles/cssvar.scss'   // ✅ 4.x 用这个

const app = createApp(App)

app.use(ElementPlus)
app.use(VXETable)
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')