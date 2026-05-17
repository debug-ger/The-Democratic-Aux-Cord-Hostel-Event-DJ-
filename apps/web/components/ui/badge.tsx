import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-start/20 text-primary-start',
        secondary: 'border-transparent bg-zinc-800 text-zinc-300',
        positive: 'border-transparent bg-green-500/20 text-green-400',
        destructive: 'border-transparent bg-red-500/20 text-red-400',
        outline: 'border-zinc-700 text-zinc-300',
        live: 'border-transparent bg-pink-500/20 text-pink-400 animate-pulse',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
