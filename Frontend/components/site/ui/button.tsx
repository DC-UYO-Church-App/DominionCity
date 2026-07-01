import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* shadcn Button — variants reproduce the original .btn system exactly, on the
   same design tokens:
     default → the dark "active voice" button (.btn)
     gold    → the primary gold CTA (.btn--gold)
     ghost   → the outlined button (.btn--ghost), context-adaptive so it stays
               legible on both cream and indigo surfaces via currentColor. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[0.6em] min-h-12 px-[1.5em] py-[0.9em] font-semibold tracking-[0.005em] no-underline rounded-[var(--radius)] border border-transparent cursor-pointer transition-[transform,box-shadow,background-color] [transition-duration:var(--dur-1)] [transition-timing-function:var(--ease-out)] hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-[var(--bg-invert)] text-[var(--text-invert)] hover:shadow-[var(--shadow-lift)]',
        gold: 'bg-[var(--accent)] text-[var(--c-nightfall)] hover:shadow-[var(--shadow-glow)]',
        ghost:
          'bg-transparent text-inherit border-[color-mix(in_oklab,currentColor_16%,transparent)] hover:bg-[color-mix(in_oklab,currentColor_8%,transparent)] hover:shadow-[var(--shadow-lift)]',
      },
      size: {
        default: 'text-[length:var(--step-0)]',
        sm: 'min-h-10 px-4 py-2 text-[length:var(--step--1)]',
        lg: 'min-h-14 px-8 text-[length:var(--step-1)]',
        icon: 'min-h-12 w-12 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
