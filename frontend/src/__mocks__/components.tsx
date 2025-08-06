import React from 'react';

// Mock all UI components
export const Button = React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>{children}</button>
));
Button.displayName = 'Button';

export const Card = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
Card.displayName = 'Card';

export const CardContent = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
CardContent.displayName = 'CardContent';

export const CardHeader = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, any>(({ children, ...props }, ref) => (
  <h3 ref={ref} {...props}>{children}</h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, any>(({ children, ...props }, ref) => (
  <p ref={ref} {...props}>{children}</p>
));
CardDescription.displayName = 'CardDescription';

export const Input = React.forwardRef<HTMLInputElement, any>(({ ...props }, ref) => (
  <input ref={ref} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(({ ...props }, ref) => (
  <textarea ref={ref} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, any>(({ children, ...props }, ref) => (
  <select ref={ref} {...props}>{children}</select>
));
Select.displayName = 'Select';

export const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>{children}</button>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
SelectItem.displayName = 'SelectItem';

export const SelectValue = React.forwardRef<HTMLSpanElement, any>(({ children, ...props }, ref) => (
  <span ref={ref} {...props}>{children}</span>
));
SelectValue.displayName = 'SelectValue';

export const Dialog = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
Dialog.displayName = 'Dialog';

export const DialogContent = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
DialogHeader.displayName = 'DialogHeader';

export const DialogTitle = React.forwardRef<HTMLHeadingElement, any>(({ children, ...props }, ref) => (
  <h2 ref={ref} {...props}>{children}</h2>
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<HTMLParagraphElement, any>(({ children, ...props }, ref) => (
  <p ref={ref} {...props}>{children}</p>
));
DialogDescription.displayName = 'DialogDescription';

export const DialogTrigger = React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
  <button ref={ref} {...props}>{children}</button>
));
DialogTrigger.displayName = 'DialogTrigger';

export const Separator = React.forwardRef<HTMLDivElement, any>(({ ...props }, ref) => (
  <hr ref={ref} {...props} />
));
Separator.displayName = 'Separator';

export const Badge = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <span ref={ref} {...props}>{children}</span>
));
Badge.displayName = 'Badge';

export const ScrollArea = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
ScrollArea.displayName = 'ScrollArea';

export const Label = React.forwardRef<HTMLLabelElement, any>(({ children, ...props }, ref) => (
  <label ref={ref} {...props}>{children}</label>
));
Label.displayName = 'Label';

export const Switch = React.forwardRef<HTMLButtonElement, any>(({ ...props }, ref) => (
  <button ref={ref} {...props} />
));
Switch.displayName = 'Switch';

export const Tooltip = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
Tooltip.displayName = 'Tooltip';

export const TooltipContent = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
TooltipContent.displayName = 'TooltipContent';

export const TooltipTrigger = React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
TooltipTrigger.displayName = 'TooltipTrigger';