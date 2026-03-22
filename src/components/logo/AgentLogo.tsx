"use client"

import { Bot } from "lucide-react"

interface AgentLogoProps {
  size?: number
  color?: string
  className?: string
}

export function AgentLogo({
  size = 24,
  color = "white",
  className,
}: AgentLogoProps) {
  return <Bot width={size} height={size} color={color} className={className} />
}

export default AgentLogo
