<template>
  <div class="equipment-tree">
    <!-- 顶部工具栏（可选） -->
    <!-- <div class="toolbar">
      <el-input
        v-model="filterText"
        placeholder="输入关键字过滤"
        prefix-icon="Search"
        clearable
      />
      <el-button type="primary" text icon="Refresh" @click="expandAll">
        全部展开
      </el-button>
    </div> -->

    <!-- 树本体 -->
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="defaultProps"
      :filter-node-method="filterNode"
      node-key="id"
      highlight-current
      default-expand-all
      :expand-on-click-node="false"
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
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElTree, ElInput, ElButton, ElIcon } from 'element-plus'
import { Folder, Monitor, Cpu } from '@element-plus/icons-vue'

/* ===== 响应式变量 ===== */
const filterText = ref('')
const treeRef = ref(null)

/* ===== 树形数据 ===== */
const treeData = ref([
  {
    id: 1,
    label: '设备列表',
    icon: Folder,
    children: [
      {
        id: 11,
        label: 'PLC-A',
        icon: Cpu,
        children: [{ id: 111, label: 'plc_data', icon: Monitor }]
      },
      { id: 12, label: 'PLC-B', icon: Cpu },
      { id: 13, label: '其他设备', icon: Monitor }
    ]
  }
])

/* ===== 配置项 ===== */
const defaultProps = {
  children: 'children',
  label: 'label'
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
</script>

<style scoped>
.equipment-tree {
  width: 300px;
  /* padding: 12px; */
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  height: 300px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
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
</style>