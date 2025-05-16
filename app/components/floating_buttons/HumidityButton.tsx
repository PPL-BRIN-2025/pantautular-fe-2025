"use client"

import { useMapStore } from "../../../store/store"
import { useEffect, useState } from "react"

interface HumidityButtonProps {
  onClick?: () => void
  className?: string
  size?: "sm" | "md" | "lg"
  ariaLabel?: string
}

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

export default function HumidityButton({ 
  onClick, className = "", size = "md" }
  : Readonly<HumidityButtonProps>) {
  const { mapService, activeButton, setActiveButton } = useMapStore()
  const isActive = activeButton === 'humidity'
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    const newActiveState = !isActive
    setActiveButton(newActiveState ? 'humidity' : null)
    onClick?.()
  }

  useEffect(() => {
    /* istanbul ignore next */
    if (mapService) {
      /* istanbul ignore next */
      if (isActive) mapService.showHumidityLayer()
      // else mapService.hideHumidityLayer()
      if (activeButton == null) mapService.hideAllLayers()
    }
  }, [isActive, mapService])

  return (
    <div className="relative">
      <button
        className={`relative flex items-center justify-center rounded-full transition-colors duration-300 ${
          isActive ? "bg-teal-500 text-white" : "bg-white text-teal-500 border border-gray-200"
        } ${sizeClasses[size]} ${className}`}
        style={{ width: size, height: size }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-pressed={isActive}
        aria-label="Toggle humidity map view"
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
            d="M8.00001 2.06667C7.99967 1.89309 7.93558 1.72672 7.82001 1.6C7.71851 1.48444 7.57575 1.41602 7.42668 1.41602C7.2776 1.41602 7.13484 1.48444 7.03334 1.6C6.91778 1.72672 6.85368 1.89309 6.85334 2.06667V2.93333C6.85368 3.10691 6.91778 3.27328 7.03334 3.4C7.13484 3.51556 7.2776 3.58398 7.42668 3.58398C7.57575 3.58398 7.71851 3.51556 7.82001 3.4C7.93558 3.27328 7.99967 3.10691 8.00001 2.93333V2.06667Z"
            fill={isActive ? "white" : "currentColor"}
          />
          <path
            d="M10.6667 3.33333C10.6663 3.15976 10.6022 2.99339 10.4867 2.86667C10.3852 2.75111 10.2424 2.68269 10.0933 2.68269C9.94425 2.68269 9.80149 2.75111 9.69999 2.86667C9.58443 2.99339 9.52034 3.15976 9.52 3.33333V4.2C9.52034 4.37358 9.58443 4.53995 9.69999 4.66667C9.80149 4.78223 9.94425 4.85065 10.0933 4.85065C10.2424 4.85065 10.3852 4.78223 10.4867 4.66667C10.6022 4.53995 10.6663 4.37358 10.6667 4.2V3.33333Z"
            fill={isActive ? "white" : "currentColor"}
          />
          <path
            d="M5.33334 3.33333C5.333 3.15976 5.2689 2.99339 5.15334 2.86667C5.05184 2.75111 4.90908 2.68269 4.76001 2.68269C4.61093 2.68269 4.46817 2.75111 4.36667 2.86667C4.25111 2.99339 4.18701 3.15976 4.18667 3.33333V4.2C4.18701 4.37358 4.25111 4.53995 4.36667 4.66667C4.46817 4.78223 4.61093 4.85065 4.76001 4.85065C4.90908 4.85065 5.05184 4.78223 5.15334 4.66667C5.2689 4.53995 5.333 4.37358 5.33334 4.2V3.33333Z"
            fill={isActive ? "white" : "currentColor"}
          />
          <path
            d="M13.3333 5.33333C13.333 5.15976 13.2689 4.99339 13.1533 4.86667C13.0518 4.75111 12.9091 4.68269 12.76 4.68269C12.6109 4.68269 12.4682 4.75111 12.3667 4.86667C12.2511 4.99339 12.187 5.15976 12.1867 5.33333V6.2C12.187 6.37358 12.2511 6.53995 12.3667 6.66667C12.4682 6.78223 12.6109 6.85065 12.76 6.85065C12.9091 6.85065 13.0518 6.78223 13.1533 6.66667C13.2689 6.53995 13.333 6.37358 13.3333 6.2V5.33333Z"
            fill={isActive ? "white" : "currentColor"}
          />
          <path
            d="M2.66667 5.33333C2.66633 5.15976 2.60224 4.99339 2.48667 4.86667C2.38517 4.75111 2.24241 4.68269 2.09334 4.68269C1.94426 4.68269 1.8015 4.75111 1.7 4.86667C1.58444 4.99339 1.52035 5.15976 1.52 5.33333V6.2C1.52035 6.37358 1.58444 6.53995 1.7 6.66667C1.8015 6.78223 1.94426 6.85065 2.09334 6.85065C2.24241 6.85065 2.38517 6.78223 2.48667 6.66667C2.60224 6.53995 2.66633 6.37358 2.66667 6.2V5.33333Z"
            fill={isActive ? "white" : "currentColor"}
          />
          <path
            d="M12.6667 12.6667C12.6667 13.7275 12.2452 14.7449 11.4951 15.4951C10.7449 16.2452 9.72753 16.6667 8.66668 16.6667C7.60582 16.6667 6.58844 16.2452 5.83829 15.4951C5.08815 14.7449 4.66668 13.7275 4.66668 12.6667C4.66668 11.1333 5.86668 9.06667 8.66668 6.33333C11.4667 9.06667 12.6667 11.1333 12.6667 12.6667Z"
            fill={isActive ? "white" : "currentColor"}
          />
        </svg>
      </button>
      {isHovered && (
        <div className="absolute right-0 mt-2 bg-black text-white text-xs rounded py-1 px-2 z-30 whitespace-nowrap">
          Peta Tematik: Kelembaban
        </div>
      )}
    </div>
  )
}
