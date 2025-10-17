'use client'

import { useNavigationProgress } from '@/hooks/useNavigationProgress'

export function ProgressBar() {
  const { isLoading, progress } = useNavigationProgress()

  if (!isLoading) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] z-50">
      {/* Background track */}
      <div className="absolute inset-0 bg-gray-800/10" />
      
      {/* Progress bar with glow */}
      <div className="relative h-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 transition-all duration-200 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.5), 0 0 45px rgba(168, 85, 247, 0.3)',
            filter: 'brightness(1.2)'
          }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
        </div>
      </div>
    </div>
  )
}