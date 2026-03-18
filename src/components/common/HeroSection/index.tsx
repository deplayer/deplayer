import { ReactNode } from 'react'

type Props = {
  backgroundImage?: string
  children: ReactNode
  className?: string
}

const HeroSection = ({ backgroundImage, children, className = '' }: Props) => {
  return (
    <div
      data-testid="hero-section"
      className={`relative w-full min-h-[280px] md:min-h-[340px] overflow-hidden ${className}`}
    >
      {/* Blurred background */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base-100/60 to-base-100" />

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 p-6 md:p-10 h-full">
        {children}
      </div>
    </div>
  )
}

export default HeroSection
