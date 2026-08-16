export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const header = columns.join(',')
  const lines = rows.map((row) => columns.map((col) => escape(row[col])).join(','))
  return [header, ...lines].join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
