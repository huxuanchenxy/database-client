<template>
  <div class="equipment-tree">
    <!-- 顶部工具栏（可选） -->
    <div class="toolbar">
        <span class="title">设备列表</span>
    </div>
<div class="tree-wrapper">
    <!-- 树本体 -->
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="defaultProps"
      :filter-node-method="filterNode"
      node-key="id"
      highlight-current
      default-expand-all
      @node-contextmenu="onContextMenu" 
      @node-click="onNodeClick"
      :expand-on-click-node="false"
      class="treecss"
    >
      <!-- 自定义节点图标 -->
      <template #default="{ node, data }">
        <span class="custom-node">
          <!-- <el-icon :size="16" class="node-icon">
            <component :is="data.icon" />
          </el-icon> -->
          <span>{{ data.label }}</span>
        </span>
      </template>
    </el-tree>
    </div>
  </div>

      <!-- 右键菜单 -->
  <div
v-if="menu.show"
    class="context-menu"
    :style="{ width: menu.width + 'px', height: menu.height + 'px', left: menu.left + 'px', top: menu.top + 'px' }"
    @mouseleave="menu.show = false"
  >
    <div class="item" @click="handleCreate('device')" v-if="menu.type === 'device111'">
      打开表
    </div>
    <div class="item"  v-if="menu.type === 'storage'">
        <div class="item" @click="handleCreate('selecttable')">打开表</div>
    </div>
  </div>

   <DataGridDialog
   ref="childRef"
   v-model:visible="datashow" :extra="currentNode" />
</template>

<script setup>
import { onMounted, ref, watch,reactive,nextTick  } from 'vue'
import { ElTree, ElInput, ElButton, ElIcon } from 'element-plus'
import { Folder, Monitor, Cpu } from '@element-plus/icons-vue'
import { useConnStore } from '@/stores/conn'
import { ElMessage,ElMessageBox } from 'element-plus'
import { databaseApi } from '@/api/api'
import { useTreeStore } from '@/stores/treeStore'
import DataGridDialog from '@/components/DataGridDialog.vue'

const datashow = ref(false)
const treeStore = useTreeStore()
/* ===== 响应式变量 ===== */
const filterText = ref('')
const treeRef = ref(null)
const connStore = useConnStore()
/* ===== 树形数据 ===== */
const treeData = ref(null)
const emit = defineEmits(['root-selected', 'children-selected'])
/* ===== 配置项 ===== */
const defaultProps = {
  children: 'children',
  label: 'label'
}

const childRef = ref(null)

/* --------------------- 右键菜单 --------------------- */
// 右键菜单状态
const menu = reactive({
show: false,
left: 0,
top: 0,
type: null,
height:38,
width:80,
})

function onNodeClick(data, node) {
  emit('root-selected', data)
}

const currentNode = ref(null)
// 节点右键事件
function onContextMenu(event, data, node) {
    // console.log('node',node)
    // console.log('data',data)
    event.preventDefault(); // 阻止默认右键菜单
    currentNode.value = node;
    // 使用鼠标事件的实际坐标
    menu.left = event.clientX;
    menu.top = event.clientY;
    menu.show = true;
    
    if (data.type === 'device') {
        menu.type = 'device';
    } else if (data.type === 'storage') {
        menu.type = 'storage';
    } else {
        menu.type = null;
        menu.show = false;
    }
    // emit('table-selected', data)
}
/* ===== 搜索过滤 ===== */
watch(filterText, val => treeRef.value?.filter(val))
function filterNode(value, data) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

/* ===== 工具函数 ===== */
function expandAll() {
  const nodes = treeRef.value?.store._getAllNodes()
  nodes?.forEach(node => node.expand())
}

onMounted(() => {
  loadData()
})

const buildTree = (apiData) => {
  const tree = []
  apiData.data.forEach(dev => {
    // 设备节点
    const deviceNode = {
      id: `dev_${dev.deviceid}`,
      label: dev.devicename,
      type:'device',
      children: []
    }

    dev.lsConfig.forEach(cfg => {
      // 配置节点
      const cfgNode = {
        id: `cfg_${cfg.configid}`,
        // label: `${cfg.configname}（刷新间隔 ${cfg.refreshinterval}s）`,
        label: `${cfg.configname}`,
        type:'storage',
        children: []
      }

    //   cfg.lsRegisters.forEach(reg => {
    //     // 寄存器节点
    //     cfgNode.children.push({
    //       id: `reg_${reg.registersid}`,
    //       label: reg.pointname
    //     })
    //   })

      deviceNode.children.push(cfgNode)
    })
    tree.push(deviceNode)
  })
  return tree
}
const loadData = async () => {

  //todo: 获取连接信息如果失败则把connStore.conn变null
  // console.log('eqp connStore.conn',connStore.conn)
  // if (!currentConnection.value) return
  if (!connStore.conn.dbHost)
  {
    treeData.value = null
    return
  } 

  try {
    const res = await databaseApi.getallconfiginfo(connStore.conn)
    // console.log('eqptree:',res)
  // 假设 res.data 就是 { databases:[], tableList:[], viewList:[] }
    if(res.code === 200) {
      treeData.value = buildTree(res)
    }else
    {
      
      ElMessage.error(JSON.stringify(res))
    }
  } catch (e) {
    console.error(e)
    // ElMessage.error('连接失败:'+e)
  } finally {
  }
}


function handleCreate(type) {
  console.log('handleCreate',type)
  menu.show = false
  console.log('currentNode',currentNode.value)
  if (type === 'selecttable') {
    console.log('打开横向点位表')
    // nextTick(() => {
    //   childRef.value.loadData()
    // })
    datashow.value = true
  }
}
watch(
  () => treeStore.refreshTrigger,
  () => {
    console.log('进设备tree了')
    loadData() // ✅ 触发刷新
  }
)

</script>

<style scoped>
.equipment-tree {
  /* width: 300px; */
  /* padding: 12px; */
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  height: 350px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
  overflow: auto;         /* 超出时出现滚动条 */
}

.tree-wrapper {
  height: 350px;          /* 想要多高就写多少 */
  overflow: auto;         /* 超出时出现滚动条 */
  border: 1px solid #dcdfe6; /* 可选，美观 */
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.custom-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.node-icon {
  color: #409eff;
}


.context-menu {
position: absolute;
z-index: 9999;
}


.context-menu .item {
  cursor: pointer;
  background: #faf9f9;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
  height: 30px;
  line-height: 30px;
  text-align: center;
}


.context-menu .item:hover {
  background-color: #f0f0f0;
}

.context-menu .item:last-child {
  border-bottom: none;
}

.title{
  left:3%;
  position: relative;
}

.treecss
{
  --el-tree-node-hover-bg-color: #DCE7FF;   /* 悬停 */
  --el-tree-node-current-bg-color: #bae7ff; /* 当前选中 */
}
</style>