"use client"

import { useState } from "react"

interface DashboardButtonProps {
  onClick?: () => void
  size?: "small" | "medium" | "large"
  label?: string
  disabled?: boolean
  className?: string
}

export default function DashboardButton({
  onClick,
  size = "medium",
  label = "Chart Button",
  disabled = false,
  className,
}: Readonly<DashboardButtonProps>) {
  const [isActive, setIsActive] = useState(false)

  // Size mapping for the button and SVG
  const sizeMap = {
    small: {
      button: "h-8 w-8",
      icon: 20,
      text: "text-xs",
    },
    medium: {
      button: "w-10 h-10",
      icon: 20,
    },
    large: {
      button: "h-16 w-16",
      icon: 28,
      text: "text-base",
    },
  }

  /* istanbul ignore next */
  const handleClick = () => {
    if (!disabled) {
      setIsActive(!isActive)
      onClick?.()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative group flex items-center justify-center rounded-full ${
        sizeMap[size].button
      } transition-colors duration-200 ${
        isActive ? "bg-blue-600" : "bg-white"
      } focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm ${className}`}
      aria-label={label}
      data-testid="dashboard-btn"
    >
      <div className="relative transition-transform duration-200 group-hover:scale-110 group-active:scale-95 flex items-center justify-center w-full h-full">
        {/* Inline SVG for Pie Chart */}
        <svg
          width={sizeMap[size].icon}
          height={sizeMap[size].icon}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-colors duration-200"
        >
          <path
            d="M19.9824 10.6248H10.2599L3.38494 17.4998C4.78839 18.738 6.51113 19.5574 8.35724 19.865C10.2033 20.1726 12.0987 19.9559 13.8278 19.2397C15.5569 18.5234 17.0502 17.3363 18.138 15.8133C19.2258 14.2904 19.8644 12.4927 19.9812 10.6248H19.9824ZM2.50119 16.6148C1.26302 15.2114 0.443548 13.4886 0.135972 11.6425C-0.171605 9.7964 0.0450613 7.90103 0.761329 6.17196C1.4776 4.44289 2.66472 2.94952 4.18767 1.86171C5.71062 0.7739 7.50828 0.135304 9.37619 0.0185547V9.74106L2.50119 16.6161V16.6148ZM10.6262 0.0185547V9.3748H19.9824C19.8301 6.94329 18.7954 4.65099 17.0727 2.92828C15.35 1.20556 13.0577 0.170907 10.6262 0.0185547Z"
            fill={isActive ? "white" : "black"}
          />
        </svg>
      </div>
    </button>
  )
}