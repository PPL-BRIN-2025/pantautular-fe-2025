"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import SeverityButton from "./SeverityButton"
import TemperatureButton from "./TemperatureButton"
import HumidityButton from "./HumidityButton"
import RainButton from "./RainButton"
import { useAuth } from "../../../app/auth/hooks/useAuth"

interface MapButtonProps {
  className?: string
  size?: "small" | "medium" | "large"
}

export const MapButton = ({ 
  className = "", 
  size = "medium"
 }: Readonly<MapButtonProps>) => {
  const pathname = usePathname()
  const router = useRouter()
  const [showAdditionalButtons, setShowAdditionalButtons] = useState(false)
  const isActive = pathname === "/map"
  const { user } = useAuth()

  // Size mapping for the button and SVG
  const sizeMap = {
    small: {
      button: "w-8 h-8",
      icon: 16,
    },
    medium: {
      button: "w-10 h-10",
      icon: 20,
    },
    large: {
      button: "w-16 h-16",
      icon: 24,
    },
  }

  const handleClick = () => {
    setShowAdditionalButtons(true)
    router.push("/map")
  }

  return (
    <div className="relative flex flex-col items-center">
      <button
        aria-label="Map"
        className={`relative group rounded-full flex items-center justify-center transition-colors duration-200 ${
          isActive || showAdditionalButtons ? "bg-blue-600" : "bg-white"
        } ${sizeMap[size].button} ${className}`}
        onClick={handleClick}
        aria-pressed={isActive || showAdditionalButtons}
      >
        <svg
          width={sizeMap[size].icon}
          height={Math.floor(sizeMap[size].icon * 1.5)} // Maintain the original aspect ratio
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-colors duration-200"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20 0.624623C19.9999 0.532191 19.9794 0.440922 19.9398 0.357391C19.9002 0.273861 19.8426 0.200148 19.7711 0.141565C19.6996 0.0829815 19.616 0.0409853 19.5264 0.0186021C19.4367 -0.00378112 19.3431 -0.0059941 19.2525 0.0121226L13.125 1.23712L6.9975 0.0121226C6.91663 -0.00404083 6.83337 -0.00404083 6.7525 0.0121226L0.5025 1.26212C0.360869 1.29043 0.233413 1.36692 0.141804 1.47858C0.0501951 1.59025 8.72276e-05 1.73019 0 1.87462L0 19.3746C5.58159e-05 19.4671 0.0206127 19.5583 0.0601897 19.6419C0.0997667 19.7254 0.157378 19.7991 0.228874 19.8577C0.30037 19.9163 0.38397 19.9583 0.473651 19.9806C0.563332 20.003 0.656861 20.0052 0.7475 19.9871L6.875 18.7621L13.0025 19.9871C13.0834 20.0032 13.1666 20.0032 13.2475 19.9871L19.4975 18.7371C19.6391 18.7088 19.7666 18.6323 19.8582 18.5207C19.9498 18.409 19.9999 18.2691 20 18.1246V0.624623ZM6.25 17.6121V1.38712L6.875 1.26212L7.5 1.38712V17.6121L6.9975 17.5121C6.91664 17.4959 6.83336 17.4959 6.7525 17.5121L6.25 17.6121ZM12.5 18.6121V2.38712L13.0025 2.48712C13.0834 2.50329 13.1666 2.50329 13.2475 2.48712L13.75 2.38712V18.6121L13.125 18.7371L12.5 18.6121Z"
            fill={isActive || showAdditionalButtons ? "white" : "black"}
          />
        </svg>
        {/* Tooltip on hover */}
        <span
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 shadow-lg"
        >
          Peta Umum
        </span>
      </button>

      {showAdditionalButtons && user && (
        <div
          className="absolute top-[3.5rem] flex flex-col gap-2 items-center"
        >
          <SeverityButton size="sm" />
          <TemperatureButton size="sm" />
          <HumidityButton size="sm" />
          <RainButton size="sm" />
        </div>
      )}
    </div>
  )
}
