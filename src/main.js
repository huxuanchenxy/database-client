import { h } from 'vue'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'vxe-table/lib/style.css'
import VXETable from 'vxe-table'
import { ElDatePicker, ElTimePicker } from 'element-plus'
import VxeUI from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
/* 统一封装创建函数 */
function createElementRender(Component, defaultType = 'date') {
  return {
    renderEdit(renderOpts, params) {
      const { row, column } = params
      const props = renderOpts.props || {}
      return h(Component, {
        modelValue: row[column.field],
        type: props.type || defaultType,
        format: props.format,
        'value-format': props.valueFormat,
        // 关键：用官方约定的 update 事件
        'onUpdate:modelValue': val => (row[column.field] = val)
      })
    },
    renderCell(renderOpts, params) {
      const { row, column } = params
      return h('span', {}, row[column.field] ?? '')
    }
  }
}

VxeUI.renderer.add('ElDatePicker', createElementRender(ElDatePicker, 'date'))
VxeUI.renderer.add('ElTimePicker', createElementRender(ElTimePicker, 'time'))
const app = createApp(App)

/* 1️⃣ 创建 pinia 实例 */
const pinia = createPinia()
/* 2️⃣ 装持久化插件 */
pinia.use(piniaPluginPersistedstate)
/* 3️⃣ 再把同一个实例挂到应用 */
app.use(pinia)


app.use(ElementPlus, { locale: zhCn })
app.use(VXETable)
app.use(VxeUI)
/* 注册图标 */
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')