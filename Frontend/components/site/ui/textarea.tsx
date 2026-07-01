import * as React from 'react';

import { cn } from '@/lib/utils';

/* shadcn Textarea — matches Input, vertically resizable like the original. */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full px-[0.8rem] py-[0.7rem] text-[length:var(--step-0)] text-[var(--text)] bg-[var(--bg)]',
        'border border-[var(--line)] rounded-[var(--radius)] outline-none resize-y',
        'placeholder:text-[var(--text-faint)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
