import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-4xl whitespace-nowrap no-underline transition-[transform,box-shadow,background-color,color] duration-150 outline-none select-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        // Miru's chunky pink button.
        default:
          "btn-chunky border-2 border-transparent bg-primary font-bold text-primary-foreground [--edge:var(--pink-edge)] [--glow:0_10px_24px_-8px_var(--pink-glow)] hover:-translate-y-0.5 active:translate-y-[3px] active:[--glow:0_0_#0000] active:[--lift:1px]",
        // Chunky, but on the surface colour.
        outline:
          "btn-chunky border-2 border-border bg-card font-bold text-foreground [--edge:var(--line)] hover:-translate-y-0.5 active:translate-y-[3px] active:[--lift:1px]",
        // For the pink call-to-action band.
        light:
          "btn-chunky border-2 border-transparent bg-white font-bold text-[#d6417f] [--edge:rgb(120_20_70/0.35)] hover:-translate-y-0.5 active:translate-y-[3px] active:[--lift:1px]",
        "light-outline":
          "border-2 border-white/70 bg-transparent font-bold text-white hover:-translate-y-0.5 active:translate-y-[3px]",
        // Flat, bordered controls: theme toggle, menus.
        secondary:
          "border border-border bg-card font-semibold text-ink-soft hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        // Pill-shaped nav links.
        ghost: "font-semibold text-ink-soft hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        link: "font-semibold text-pink-deep underline underline-offset-3",
        destructive: "font-semibold text-ink-soft underline underline-offset-3 hover:text-destructive",
      },
      size: {
        default: "px-6 py-3.5 text-[16px]",
        sm: "px-[18px] py-[9px] text-[15px] [--lift:3px] [--glow:0_0_#0000]",
        nav: "px-3.5 py-2 text-[15px]",
        inline: "p-0 text-[14px] leading-[normal]",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-[19px]",
      },
    },
    compoundVariants: [
      // The bordered small button keeps the full-height edge.
      { variant: "outline", size: "sm", className: "[--lift:4px]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
