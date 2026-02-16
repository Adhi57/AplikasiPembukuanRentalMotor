import { ReactNode } from "react"

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  width?: string
  align?: "left" | "center" | "right"
  render?: (value: any, row: T) => ReactNode
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  className?: string
  hoverable?: boolean
  striped?: boolean
}

export default function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "Tidak ada data",
  className = "",
  hoverable = true,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-400 animate-pulse">Memuat data...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr className="border-t border-b border-slate-700 bg-slate-900/50">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-${column.align || "left"}`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-slate-700/50">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                ${hoverable ? "hover:bg-slate-700/30 transition" : ""}
              `}
            >
              {columns.map((column, colIndex) => {
                let cellValue: any

                if (typeof column.accessor === "function") {
                  cellValue = column.accessor(row)
                } else {
                  cellValue = row[column.accessor]
                }

                const renderedValue = column.render
                  ? column.render(cellValue, row)
                  : cellValue

                return (
                  <td
                    key={colIndex}
                    className={`px-4 py-3 whitespace-nowrap text-sm text-slate-200 text-${column.align || "left"}`}
                  >
                    {renderedValue}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}