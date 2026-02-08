
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className={`bg-slate-800 rounded-xl shadow-lg w-full max-w-lg relative ${className}`}
          onClick={(e) => e.stopPropagation()} // mencegah click overlay menutup
        >
          {/* Header */}
          {title && (
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-100 transition"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  )
}
