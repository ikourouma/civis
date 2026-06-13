import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  <label ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = 'Label';

export { Label };
