import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
    determinate?: boolean
  }
>(({ className, value, max = 100, determinate = true, ...props }, ref) => {
  const percentage = determinate && value != null ? (value / max) * 100 : null

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-neutral-100",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      {...props}
    >
      {determinate ? (
        <div
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - (percentage || 0)}%)` }}
        />
      ) : (
        <div className="h-full w-1/3 animate-progress-loading rounded-full bg-primary" />
      )}
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
