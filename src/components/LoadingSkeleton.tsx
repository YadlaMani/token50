export default function LoadingSkeleton() {
  return (
    <div className="brutalism-card animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-border/20"></div>
      
      {/* Header skeleton */}
      <div className="border-t-4 border-border bg-main p-4">
        <div className="h-6 bg-main-foreground/20 rounded w-3/4"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="border-t-2 border-border bg-secondary-background p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-border/20 rounded w-12"></div>
          <div className="h-4 bg-border/20 rounded w-16"></div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-border/20 rounded w-20"></div>
            <div className="h-3 bg-border/20 rounded w-12"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-border/20 rounded w-16"></div>
            <div className="h-3 bg-border/20 rounded w-14"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-border/20 rounded w-18"></div>
            <div className="h-3 bg-border/20 rounded w-12"></div>
          </div>
        </div>
        
        <div className="border-t-2 border-border pt-2">
          <div className="h-3 bg-border/20 rounded w-16 mb-1"></div>
          <div className="h-3 bg-border/20 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}
