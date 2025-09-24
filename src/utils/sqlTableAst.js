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


export function isSelectStatement(sqlText, dialect = 'postgresql') {
  if (typeof sqlText !== 'string') return false;

  try {
    const cst = parse(sqlText, { dialect });

    // 最外层语句节点类型如果是 'select_stmt' 就认为是 SELECT
    return cst.statements.some(st => st.type === 'select_stmt');
  } catch (e) {
    // 解析失败就当它不是 SELECT
    return false;
  }
}

export function isSelectStatementV2(sqlText, dialect = 'postgresql') {
  if (typeof sqlText !== 'string') return false;

  try {
    const cst = parse(sqlText, { dialect });

    return cst.statements.some(st => {
      // 1. 顶层必须是 select_stmt
      if (st.type !== 'select_stmt') return false;

      // 2. 必须带 FROM 子句（真正查表）
      return (st.clauses || []).some(c => c.type === 'from_clause');
    });
  } catch (e) {
    return false;
  }
}


/**
 * 判断 SQL 语句中是否存在 LIMIT 子句
 * @param {string} sqlText
 * @param {string} dialect  'mysql' | 'postgresql' | 'sqlite' | 'bigquery'
 * @returns {boolean}
 */
export function hasLimitClause(sqlText, dialect = 'postgresql') {
  if (typeof sqlText !== 'string') return false;

  try {
    const cst = parse(sqlText, { dialect });

    // 递归访问函数
    function visit(node) {
      if (node && typeof node === 'object') {
        // 如果节点类型就是 limit_clause（不同方言关键字统一映射）
        if (node.type === 'limit_clause') return true;

        // 深度优先遍历所有子属性
        for (const key in node) {
          const child = node[key];
          if (Array.isArray(child)) {
            if (child.some(visit)) return true;
          } else if (visit(child)) {
            return true;
          }
        }
      }
      return false;
    }

    return cst.statements.some(visit);
  } catch (e) {
    // 解析失败默认当作无 LIMIT
    return false;
  }
}