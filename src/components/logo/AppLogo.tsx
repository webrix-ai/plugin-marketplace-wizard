"use client"

interface AppLogoProps {
  color?: string
  className?: string
}

const AppLogo: React.FC<AppLogoProps> = ({
  color = "currentColor",
  className,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 234 178"
      fill="none"
      className={className}
    >
      <g opacity="0.9">
        <path
          d="M81.8726 7L129.705 88.5791L82.166 171.039L34.3337 88.5791L81.8726 7Z"
          fill={color}
        />
        <path
          d="M179.232 2.99988H83.6995C82.605 2.99988 81.5874 3.58289 81.0429 4.53443L33.2792 87.2683C32.7292 88.2199 32.7292 89.3914 33.2792 90.3375L81.0429 173.071C81.5929 174.023 82.605 174.606 83.6995 174.606H179.232C180.327 174.606 181.344 174.023 181.889 173.071L229.653 90.3375C230.203 89.3859 230.203 88.2144 229.653 87.2683L181.889 4.53443C181.339 3.58289 180.327 2.99988 179.232 2.99988Z"
          stroke={color}
          strokeWidth="10"
          strokeMiterlimit="10"
        />
        <path
          d="M131.744 88.5268L81.9675 3.54883"
          stroke={color}
          strokeWidth="10"
          strokeMiterlimit="10"
        />
        <path
          d="M132.018 88.5267H229.921"
          stroke={color}
          strokeWidth="10"
          strokeMiterlimit="10"
        />
        <path
          d="M82.2422 174.33L131.744 88.5267"
          stroke={color}
          strokeWidth="10"
          strokeMiterlimit="10"
        />
      </g>
    </svg>
  )
}

export default AppLogo
