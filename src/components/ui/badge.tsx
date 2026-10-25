import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl px-2.5 py-[3px] text-[12px] font-bold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-pink-soft text-pink-deep",
        secondary: "bg-muted text-pink-deep",
        success:
          "bg-[color-mix(in_srgb,var(--mint)_55%,transparent)] text-[color-mix(in_srgb,#1d6b50_70%,var(--ink))]",
        warning: "bg-butter text-[#6b4a00]",
        destructive: "bg-pink-soft text-pink-deep",
        outline: "border border-border bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
