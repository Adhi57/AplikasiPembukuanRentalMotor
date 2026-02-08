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
  striped = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-800">
          <div className="p-8 text-center text-slate-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-gradient-to-t from-neutral-900 to-zinc-900 rounded-lg overflow-hidden border border-slate-800">
          <div className="p-8 text-center text-slate-200">
            <svg
              className="mx-auto h-12 w-12 text-slate-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-2">{emptyMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full overflow-x-auto p-2 ${className}`}>
      <div className=" bg-zinc-800 rounded-lg overflow-hidden border border-slate-600">
        <table className="min-w-full divide-y divide-slate-200">
          {/* Header */}
          <thead className="bg-gray-900 border-b border-slate-600 text-left">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-3 text-${column.align || "left"} text-xs font-medium text-slate-200 uppercase tracking-wider`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  ${hoverable ? "hover:bg-slate-700 border-b border-slate-600 transition-colors" : ""}
                  ${striped && rowIndex % 2 === 0 ? "bg-slate-50/50" : ""}
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
                      className={`px-6 py-4 whitespace-nowrap text-sm text-slate-100 text-${column.align || "left"}`}
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
    </div>
  )
}