import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

/* shadcn Card — the "lit block in the city grid". The root reproduces the
   original .card (bg, hairline border, large radius, lift on hover) on the same
   tokens. Components with their own internal layout simply pass extra classes
   (e.g. <Card className="book">), and their CSS still overrides the padding.
   `asChild` lets a card keep a semantic element such as <article>. */
function Card({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot="card"
      className={cn(
        'bg-[var(--bg)] border border-[var(--line)] rounded-[var(--radius-lg)] p-[var(--space-md)]',
        'transition-[transform,border-color,box-shadow] [transition-duration:var(--dur-2)] [transition-timing-function:var(--ease-rise)]',
        'hover:-translate-y-[3px] hover:border-[var(--accent-ink)] hover:shadow-[var(--shadow-lift)]',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('font-semibold leading-none', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-[var(--text-soft)] text-[length:var(--step--1)]', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
