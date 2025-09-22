import { parse, cstVisitor } from 'sql-parser-cst'

/**
 * 从 SQL 字符串中提取所有表名（去重）
 * @param {string} sqlText
 * @param {string} dialect  'mysql' | 'postgresql' | 'sqlite' | 'bigquery'
 * @returns {string[]}      表名数组
 */
export function pickTablesByAst(sqlText, dialect = "postgresql") {
  if (typeof sqlText !== "string") return [];

  try {
    const cst = parse(sqlText, { dialect });
    const tables = new Set();

    for (const stmt of cst.statements || []) {
      for (const clause of stmt.clauses || []) {
        if (clause.type === "from_clause" && clause.expr?.type === "identifier") {
          tables.add(clause.expr.text);
        }
      }
    }

    return Array.from(tables);
  } catch (e) {
    console.error("[sql-parser-cst] 解析失败:", e.message);
    return [];
  }
}