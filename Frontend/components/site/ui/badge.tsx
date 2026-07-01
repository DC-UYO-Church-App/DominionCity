import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* shadcn Badge — a small status pill on brand tokens. Available as a primitive
   for status/labels; the signature components keep their bespoke positioned
   badges. */
const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-[length:var(--step--1)] font-semibold tracking-[0.04em] w-fit shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-[var(--c-nightfall)]',
        muted: 'bg-[var(--bg-soft)] text-[var(--text-soft)]',
        outline: 'border border-[var(--line)] text-[var(--text)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
