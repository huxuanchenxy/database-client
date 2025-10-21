<template>
  <div class="database-tree">
    <div class="tree-header">
      <el-button
        type="primary"
        @click="showConnectionDialog = true"
        :icon="Plus"
      >
        连接数据库
      </el-button>



    <!-- 第二行：连接状态（带圆点） -->
    <div class="connection-info">
      <!-- 未连接时也可以显示，也可以隐藏，按你需求 -->
      <!-- <el-tag :type="currentConnection ? 'info' : 'warning'">
        <span class="dot" :class="{ green: currentConnection, yellow: !currentConnection }" />
        {{ currentConnection ? `已连接: ${currentConnection.dbHost}` : '未连接' }}
      </el-tag> -->

      <el-tag :type="currentConnection?.dbHost ? 'info' : 'warning'">
        <span
          class="dot"
          :class="{ green: currentConnection?.dbHost, yellow: !currentConnection?.dbHost }"
        />
        {{
          currentConnection?.dbHost
            ? `已连接: ${currentConnection.dbHost}`
            : '未连接'
        }}
      </el-tag>
                <!-- 断开按钮 -->
    <el-button
      v-if="currentConnection?.dbHost"
      type="danger"
      plain
      @click="handleDisconnect"
      style="margin-left:12px;height:22px; padding:0 6px; font-size:12px;"
    >
      断开连接
    </el-button>
    </div>
    </div>
        <div class="toolbar">
        <span class="title">数据库</span>
    </div>
 <div class="tree-wrapper">
  <el-tree :data="treeData"
   default-expand-all
   highlight-current
   @node-contextmenu="onContextMenu" 
   @node-click="onNodeClick"
   class="treecss"
   >
  </el-tree>
</div>
    <!-- 右键菜单 -->
  <div
    v-if="menu.show"
    class="context-menu"
    :style="{ width: menu.width + 'px', height: menu.height + 'px', left: menu.left + 'px', top: menu.top + 'px' }"
    @mouseleave="menu.show = false"
  >
    <div class="item" @click="handleCreate('table')" v-if="menu.type === 'table'">
      新建表
    </div>
    <div class="item"  v-if="menu.type === 'altertable'">
        <div class="item" @click="handleCreate('altertable')">修改表</div>
        <div class="item" @click="handleCreate('selecttable')">打开表</div>
        <div class="item" @click="handleCreate('droptable')">删除表</div>
    </div>
    <div class="item" @click="handleCreate('view')" v-if="menu.type === 'view111'">
      新建视图
    </div>
  </div>

    <!-- 连接配置对话框 -->
    <ConnectionConfig
      v-model="showConnectionDialog"
      @connection-success="handleConnectionSuccess"
    />
  </div>

   <TableDesigner ref="designer" />
</template>

<script setup>
import { ref, onMounted,watch,reactive  } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ConnectionConfig from './ConnectionConfig.vue'
import { databaseApi } from '@/api/api'
import { useConnStore } from '@/stores/conn'


import { useSqlStore } from '@/stores/sqlStore'
import { useTreeStore } from '@/stores/treeStore'
import TableDesigner from '@/components/TableDesigner.vue'
const connStore = useConnStore()
const sqlStore = useSqlStore()
const treeStore = useTreeStore()

const localData = ref({ sql: '', result: null })



const props = defineProps({
  onDatabaseSelect: Function,
  onTableSelect: Function
})

const emit = defineEmits(['database-selected', 'table-selected'])

const showConnectionDialog = ref(false)
const treeRef = ref()
const currentConnection = ref(null)
// const treeData = ref([])
const loading = ref(false)


const treeProps = {
  children: 'children',
  label: 'label'
}

// 处理连接成功
const handleConnectionSuccess = (connectionConfig) => {
  // console.log('handleConnectionSuccess conn:',connectionConfig)
  currentConnection.value = connectionConfig
  treeStore.triggerRefresh()
  loadDatabases()
}

// 加载数据库列表
const loadDatabases = async () => {

  //todo: 获取连接信息如果失败则把connStore.conn变null
  // console.log('loadDatabases connStore.conn',connStore.conn)
  currentConnection.value = connStore.conn
  // console.log('loadDatabases currentConnection.value',currentConnection.value)
  // if (!currentConnection.value) return
  if (!connStore.conn.dbHost) return

  try {
    const res = await databaseApi.getDatabases(connStore.conn)
  // 假设 res.data 就是 { databases:[], tableList:[], viewList:[] }
    if(res.code === 200) {
      // treeData.value = buildTree(res.data
      // console.log('tree res.data:', res.data)
      let tmpdb = []
      tmpdb.push(res.data.dbName)
      let dbdata = { databases: tmpdb, tableList: res.data.tableList, viewList: res.data.viewList }
      treeData.value = buildTree(dbdata)
    }else
    {
      currentConnection.value = null
      ElMessage.error(JSON.stringify(res))
    }
  } catch (e) {
    console.error(e)
    currentConnection.value = null
    ElMessage.error('连接失败:'+e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
  loadDatabases()
})

/* 1. 先给空数组，树第一次渲染不会报错 */
const treeData = ref([])

/* 2. 把后端数据 -> el-tree 结构 */
function buildTree({ databases, tableList, viewList }) {
  return [
    {
      label: databases[0],
      children: [
        {
          label: '表',
          type: 'table',
          children: tableList.map(t => ({ label: t.tableName,type: 'altertable' }))
        },
        {
          label: '视图',
          type: 'view',
          children: viewList.map(v => ({ label: v.tableName }))
        }
      ]
    }
  ]
}

watch(
  () => treeStore.refreshTrigger,
  () => {
    // console.log('进tree了')
    loadDatabases() // ✅ 触发刷新
  }
)

defineExpose({
  loadDatabases
})


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

const currentNode = ref(null)
// 节点右键事件
function onContextMenu(event, data, node) {
    event.preventDefault(); // 阻止默认右键菜单
    currentNode.value = node;
    // 使用鼠标事件的实际坐标
    menu.left = event.clientX;
    menu.top = event.clientY - 50;
    menu.show = true;
    
    if (data.type === 'table') {
        menu.type = 'table';
    } else if (data.type === 'view') {
        menu.type = 'view';
    } else if (data.type === 'altertable') {
        menu.type = 'altertable';
    } else {
        menu.type = null;
        menu.show = false;
    }
    emit('table-selected', data)
}

function onNodeClick(data, node) {

  emit('table-selected', data)
  // console.log('emit table-selected data:', data)
  // if (data.type === 'table') {
    
  // } else if (data.type === 'database') {
  //   emit('database-selected', data)
  // }
}

// 点击空白处关闭菜单
document.addEventListener('click', () => (menu.show = false))

/* --------------------- 业务动作 --------------------- */
function handleCreate(type) {
  menu.show = false
  if (type === 'table') {
    // console.log('新建表逻辑')
    createTable()
  } else if (type === 'view') {
    console.log('新建视图逻辑')
  }else if(type === 'altertable'){
    // console.log('修改表结构逻辑')
    alterTable();
  }else if(type === 'selecttable'){
    // console.log('打开表逻辑')
    selectTable();
  }else if(type === 'droptable'){
    // console.log('删除表逻辑')
    dropTable();
  }

}


// 2. 拿到子组件实例
const designer = ref(null)

// 3. 调用暴露出来的方法
function createTable() {
  designer.value.openDialog() // 不传参 = 新建
}

function alterTable() {
  let currrenttable = currentNode.value.data.label
  designer.value.openDialog(currrenttable) 
}


const dropTable = async()=> {
  try {
    let currrenttable = currentNode.value.data.label
    await ElMessageBox.confirm(
      '确定要删除这张表 ('+ currrenttable+') 吗？此操作不可恢复！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    // console.log('执行删除表逻辑')
    
    let sql = `DROP TABLE ${currrenttable}`
    const parm = {
      ...connStore.conn,
      oprationString: sql, // 确保 cleanedSql 是 DROP TABLE xxx
    }
    // console.log('parm:', parm)
    const res = await databaseApi.executeSqlWithText(parm)

    if (res.code === 200) {
      ElMessage.success('删除表成功')
      await loadDatabases() // 刷新树
    } else {
      ElMessage.error('删除失败：' + res.message)
    }
  } catch {
    // ✅ 用户点击“取消”
    console.log('取消删除')
  }
}


const selectTable = async()=> {
  let currrenttable = currentNode.value.data.label
  let sql = ' SELECT * FROM ' + currrenttable + '  '
  sqlStore.setResult(sql, currrenttable)
}

function editTable() {
  // 模拟“后端”查到的旧结构
  const oldTable = {
    name: 'user',
    comment: '用户表',
    fields: [
      { name: 'id', type: 'bigint', length: '0', notNull: true, primary: true, comment: '主键' },
      { name: 'username', type: 'varchar', length: '50', notNull: true, primary: false, comment: '账号' }
    ]
  }
  designer.value.openDialog(oldTable) // 传参 = 修改
}


const handleDisconnect = () => {
  connStore.clearConn()          // 1. 清空持久化数据
  currentConnection.value = null // 2. 清空本地响应式状态
  treeData.value = []            // 3. 清空左侧树
  treeStore.triggerRefresh()
  ElMessage.success('已断开数据库连接')
}

</script>

<style scoped>
.database-tree {
  height: 510px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.tree-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0px;
    padding-top: 10px;
}

.connection-info {
line-height: 1;
margin-top: 8px;
}

/* 圆点公共样式 */
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.green  { background: #67c23a; }   
.yellow { background: #e6a23c; }   

.database-tree-view {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  max-height: calc(100vh - 120px); /* 减去顶部按钮和间距 */
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
}


.database-tree {
position: relative;
}


.context-menu {
position: absolute;
z-index: 9999;
}


.context-menu .item {
  cursor: pointer;
  background: #f0e9e9;
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

.tree-wrapper {
  height: 400px;          /* 想要多高就写多少 */
  overflow: auto;         /* 超出时出现滚动条 */
  border: 1px solid #dcdfe6; /* 可选，美观 */
}

.toolbar {
  display: flex;
  top:0px;
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
