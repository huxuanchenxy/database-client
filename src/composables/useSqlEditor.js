import { ref, computed } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState } from '@codemirror/state'

export function useSqlEditor() {
  const sqlCode = ref('')
  const editorView = ref(null)
  const isDarkTheme = ref(false)

  // 初始化编辑器
  const initEditor = (editorElement) => {
    if (!editorElement) return

    const extensions = [
      basicSetup,
      sql(),
      EditorState.readOnly.of(false),
    ]

    if (isDarkTheme.value) {
      extensions.push(oneDark)
    }

    editorView.value = new EditorView({
      state: EditorState.create({
        doc: sqlCode.value,
        extensions: extensions
      }),
      parent: editorElement
    })

    // 监听内容变化
    editorView.value.state.doc.forEach((_, change) => {
      sqlCode.value = editorView.value.state.doc.toString()
    })
  }

  // 更新SQL代码
  const updateSqlCode = (newCode) => {
    sqlCode.value = newCode
    if (editorView.value) {
      const transaction = editorView.value.state.update({
        changes: {
          from: 0,
          to: editorView.value.state.doc.length,
          insert: newCode
        }
      })
      editorView.value.dispatch(transaction)
    }
  }

  // 切换主题
  const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    // 这里可以重新初始化编辑器来切换主题
    if (editorView.value) {
      const currentCode = editorView.value.state.doc.toString()
      initEditor(editorView.value.dom.parentNode)
      updateSqlCode(currentCode)
    }
  }

  // 清空SQL
  const clearSql = () => {
    sqlCode.value = ''
    if (editorView.value) {
      const transaction = editorView.value.state.update({
        changes: {
          from: 0,
          to: editorView.value.state.doc.length,
          insert: ''
        }
      })
      editorView.value.dispatch(transaction)
    }
  }

  return {
    sqlCode,
    editorView,
    initEditor,
    updateSqlCode,
    toggleTheme,
    clearSql,
    isDarkTheme
  }
}