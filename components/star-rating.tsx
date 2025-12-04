"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  maxRating?: number
}

export function StarRating({ rating, onRatingChange, maxRating = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          <Star
            className={cn(
              "h-8 w-8 transition-colors",
              star <= rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  )
}
