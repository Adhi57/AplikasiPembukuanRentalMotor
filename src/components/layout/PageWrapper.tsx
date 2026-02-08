import { ReactNode } from "react"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"

interface PageWrapperProps {
  children: ReactNode
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <Navbar />

      {/* Main Content */}
      <main className="ml-64 pt-16 p-6 m-10">
        {children}
      </main>
    </div>
  )
}