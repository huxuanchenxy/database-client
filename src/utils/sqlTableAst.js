import { parse, cstVisitor } from 'sql-parser-cst'

/**
 * 从 SQL 字符串中提取所有表名（去重）
 * @param {string} sqlText
 * @param {string} dialect  'mysql' | 'postgresql' | 'sqlite' | 'bigquery'
 * @returns {string[]}      表名数组
 */
export function pickTablesByAst(sqlText, dialect = 'postgresql') {
    if (typeof sqlText !== 'string') return []

  try {
    const cst = parse(sqlText, { dialect })
    const tables = new Set()

    cstVisitor({
      // 只要遇到标识符就当成表名收
      identifier: (node) => {
        tables.add(node.text)
      }
    })(cst)

    return Array.from(tables)
  } catch (e) {
    console.error('[sql-parser-cst] 解析失败:', e.message)
    return []
  }
}