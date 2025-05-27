"use client"

import { MapPin } from "lucide-react"
import type { ButtonHTMLAttributes } from "react"
import { useState } from "react"

interface LocationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
  size?: "sm" | "md" | "lg"
}

export default function LocationButton({
  onClick,
  className = "",
  variant = "default",
  size = "md",
  disabled,
  ...props
}: Readonly<LocationButtonProps>) {
  // Size mappings with fixed width and height like WarningButton
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }
  const [isHovered, setIsHovered] = useState(false)


  const variantClasses = {
    default: "bg-white hover:bg-gray-100 text-black shadow-sm",
    outline: "border border-gray-300 hover:bg-gray-50 text-black"
  }

  let iconSize: string;
  switch (size) {
    case "sm":
      iconSize = "w-4 h-4";
      break;
    case "md":
      iconSize = "w-6 h-6";
      break;
    case "lg":
      iconSize = "w-8 h-8";
      break;
  }

  return (
    <div className="relative">
    <button
      aria-label="Location"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      <MapPin className={`text-primary ${iconSize}`} />
    </button>
    {isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 bg-black text-white text-xs rounded py-1 px-2 z-30 whitespace-nowrap">
          Temukan Lokasi Saya
        </div>
      )}
    </div>
  )
}