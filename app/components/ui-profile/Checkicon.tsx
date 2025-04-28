import React from 'react';

interface CheckIconProps {
  className?: string;
  isChecked?: boolean;
}

export function CheckIcon({ 
  className = "h-5 w-5", 
  isChecked = false 
}: Readonly<CheckIconProps>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12L11 15L16 9"
        stroke={isChecked ? "currentColor" : "#ccc"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}