import * as React from 'react';

import { cn } from '@/lib/utils';

/* shadcn Input — styled to match the original .field controls on brand tokens.
   Focus styling is handled by the global context-aware focus-visible rule. */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'w-full px-[0.8rem] py-[0.7rem] text-[length:var(--step-0)] text-[var(--text)] bg-[var(--bg)]',
        'border border-[var(--line)] rounded-[var(--radius)] outline-none',
        'placeholder:text-[var(--text-faint)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
