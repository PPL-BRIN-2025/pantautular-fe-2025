"use client"

import { useEffect } from "react"
import { useMapStore } from "../../../store/store"

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
}

interface RainButtonProps {
  onClick?: () => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export default function RainButton({ 
  onClick, 
  className = "", 
  size = "md" 
}: Readonly<RainButtonProps>) {
  const { mapService, activeButton, setActiveButton } = useMapStore()
  const isActive = activeButton === 'rain'

  const handleClick = () => {
    const newActiveState = !isActive
    setActiveButton(newActiveState ? 'rain' : null)
    if (onClick) onClick()
  }

  useEffect(() => {
    /* istanbul ignore next */
    if (mapService) {
      /* istanbul ignore next */
      if (isActive) mapService.showPrecipitationLayer()
      else mapService.hidePrecipitationLayer()
    }
  }, [isActive, mapService])

  return (
    <button
      className={`relative flex items-center justify-center rounded-full transition-colors duration-300 ${
        isActive ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-gray-200"
      } ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      aria-pressed={isActive}
    >
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 12 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-colors duration-300"
      >
        <path
          d="M6 14C7.39239 14 8.72774 13.4469 9.71231 12.4623C10.6969 11.4777 11.25 10.1424 11.25 8.75C11.25 7.30188 10.2682 6.209 9.122 4.93325C7.97225 3.654 6.65625 2.19012 6 0C6 0 0.75 4.97525 0.75 8.75C0.75 10.1424 1.30312 11.4777 2.28769 12.4623C3.27226 13.4469 4.60761 14 6 14Z"
          fill={isActive ? "white" : "currentColor"}
        />
      </svg>
    </button>
  )
}