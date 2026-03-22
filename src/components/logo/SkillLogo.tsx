"use client"

interface SkillLogoProps {
  size?: number
  color?: string
  className?: string
}

export function SkillLogo({
  size = 24,
  color = "white",
  className,
}: SkillLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <polygon
        points="50 5 90 27.5 90 72.5 50 95 10 72.5 10 27.5"
        fill="none"
        stroke={color}
        strokeWidth="6"
      />
      <polygon
        points="50 22 75 36.5 75 63.5 50 78 25 63.5 25 36.5"
        fill="none"
        stroke={color}
        strokeWidth="6"
      />
    </svg>
  )
}

export default SkillLogo
