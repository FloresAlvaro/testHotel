export type CsvCell = string | number | boolean | null | undefined

/** Quote every field and neutralize spreadsheet formulas only in textual cells. */
export function serializeCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map(row => row.map(value => {
    let text = value == null ? '' : String(value)
    if (typeof value === 'string' && /^[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(text)) text = `'${text}`
    // Tabs/newlines at the start can bypass formula detection in spreadsheet importers.
    else if (typeof value === 'string' && /^[\t\r\n]/u.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }).join(',')).join('\r\n')
}
