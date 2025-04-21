"use client"

import * as React from "react"

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none
        ${variant === 'default' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
        ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"