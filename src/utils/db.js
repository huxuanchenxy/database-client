/**
 * 无脑给任意标识符加双引号
 * @param {string} col
 * @returns {string}
 */
export function quoteId(col) {
  return `"${col}"`
}