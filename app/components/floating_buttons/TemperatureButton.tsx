"use client"

import { useEffect, useState } from "react"
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

interface TemperatureButtonProps {
  onClick?: () => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export default function TemperatureButton({ 
  onClick, 
  className = "", 
  size = "md" 
}: Readonly<TemperatureButtonProps>) {
  const { mapService, activeButton, setActiveButton } = useMapStore()
  const isActive = activeButton === 'temperature'
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    const newActiveState = !isActive
    setActiveButton(newActiveState ? 'temperature' : null)
    if (onClick) onClick()
  }

  useEffect(() => {
    /* istanbul ignore next */
    if (mapService) {
      /* istanbul ignore next */
      if (isActive) mapService.showTemperatureLayer() 
      // else mapService.hideTemperatureLayer()
      if (activeButton == null) mapService.hideAllLayers()
    }
  }, [isActive, mapService])

  return (
    <div className="relative">
      <button
        className={`relative flex items-center justify-center rounded-full transition-colors duration-300 ${
          isActive ? "bg-red-500 text-white" : "bg-white text-red-500 border border-gray-200"
        } ${sizeClasses[size]} ${className}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-pressed={isActive}
      >
        <svg
          width={iconSizes[size]}
          height={iconSizes[size]}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-colors duration-300"
        >
          <path
            d="M8 2C6.89543 2 6 2.89543 6 4V10C5.05719 10.535 4.5 11.6619 4.5 12.75C4.5 14.706 6.044 16 8 16C9.956 16 11.5 14.706 11.5 12.75C11.5 11.6619 10.9428 10.535 10 10V4C10 2.89543 9.10457 2 8 2Z"
            fill={isActive ? "white" : "currentColor"}
          />
        </svg>
      </button>
      {isHovered && (
        <div className="absolute right-0 mt-2 bg-black text-white text-xs rounded py-1 px-2 z-30 whitespace-nowrap">
          Peta Tematik: Temperatur
        </div>
      )}
    </div>
  )
}