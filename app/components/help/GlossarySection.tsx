import type React from "react"

interface GlossarySectionProps {
  title: string
  children: React.ReactNode
}

export default function GlossarySection({ title, children }: GlossarySectionProps) {
  return (
    <div className="mb-12">
      <h3 className="text-xl font-bold text-green-600 mb-4">{title}</h3>
      <div className="pl-0">{children}</div>
    </div>
  )
}
