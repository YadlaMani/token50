'use client'

import { cn } from "@/lib/utils"
import { useState } from "react"

type Props = {
  imageUrl: string
  caption: string
  className?: string
  children?: React.ReactNode
  fallbackImageUrl?: string
}

export default function ImageCard({ 
  imageUrl, 
  caption, 
  className, 
  children,
  fallbackImageUrl = "/favicon.ico"
}: Props) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl)

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
    if (currentImageUrl !== fallbackImageUrl) {
      setCurrentImageUrl(fallbackImageUrl)
    }
  }

  return (
    <article
      className={cn(
        "group relative w-full max-w-sm overflow-hidden rounded-base border-4 border-border bg-main font-base shadow-shadow transition-all duration-200 hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
        className,
      )}
    >
      {/* Image Container with Loading State */}
      <div className="relative aspect-square overflow-hidden bg-secondary-background">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-transparent"></div>
          </div>
        )}
        
        <img 
          className={cn(
            "h-full w-full object-cover transition-all duration-300",
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110",
            "group-hover:scale-105"
          )}
          src={currentImageUrl} 
          alt={caption}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>
      
      {/* Header with token name */}
      <div className="border-t-4 border-border bg-main p-4">
        <h3 className="font-heading text-lg text-main-foreground line-clamp-1">
          {caption}
        </h3>
      </div>
      
      {/* Content area */}
      {children && (
        <div className="border-t-2 border-border bg-secondary-background p-4">
          {children}
        </div>
      )}
    </article>
  )
}
