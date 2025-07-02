import React from 'react'
import { Globe, Shield, Lock } from 'lucide-react'

interface DomainVaultLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon-only'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16',
  xl: 'h-20 w-20'
}

const DomainVaultLogo: React.FC<DomainVaultLogoProps> = ({ 
  size = 'md', 
  variant = 'full',
  className = '' 
}) => {
  const iconSize = sizeClasses[size]
  
  const LogoIcon = () => (
    <div className={`relative ${iconSize} ${className}`}>
      {/* Outer ring with gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 p-0.5">
        <div className="h-full w-full rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          {/* Inner content */}
          <div className="relative">
            {/* Globe base */}
            <Globe className="h-6 w-6 text-white" />
            {/* Shield overlay */}
            <Shield className="absolute -top-1 -right-1 h-4 w-4 text-cyan-300" />
            {/* Lock accent */}
            <Lock className="absolute -bottom-0.5 -left-0.5 h-3 w-3 text-purple-300" />
          </div>
        </div>
      </div>
      
      {/* Animated pulse ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 opacity-20 animate-pulse"></div>
    </div>
  )

  if (variant === 'icon-only') {
    return <LogoIcon />
  }

  return (
    <div className={`flex items-center ${className}`}>
      <LogoIcon />
      {size !== 'sm' && (
        <span className="ml-3 text-white font-bold text-2xl">DomainVault</span>
      )}
    </div>
  )
}

export default DomainVaultLogo