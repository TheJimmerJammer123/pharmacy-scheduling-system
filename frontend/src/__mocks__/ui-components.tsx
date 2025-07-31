import React from 'react';

// Mock Button component
export const Button = React.forwardRef<HTMLButtonElement, any>((props, ref) => {
  return React.createElement('button', {
    ref,
    ...props,
  });
});

// Mock Badge component
export const Badge = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

// Mock Card components
export const Card = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

export const CardHeader = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

export const CardTitle = React.forwardRef<HTMLHeadingElement, any>((props, ref) => {
  return React.createElement('h3', {
    ref,
    ...props,
  });
});

export const CardContent = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

// Mock Input component
export const Input = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  return React.createElement('input', {
    ref,
    ...props,
  });
});

// Mock Textarea component
export const Textarea = React.forwardRef<HTMLTextAreaElement, any>((props, ref) => {
  return React.createElement('textarea', {
    ref,
    ...props,
  });
});

// Mock Select components
export const Select = React.forwardRef<HTMLSelectElement, any>((props, ref) => {
  return React.createElement('select', {
    ref,
    ...props,
  });
});

export const SelectTrigger = React.forwardRef<HTMLButtonElement, any>((props, ref) => {
  return React.createElement('button', {
    ref,
    ...props,
  });
});

export const SelectValue = React.forwardRef<HTMLSpanElement, any>((props, ref) => {
  return React.createElement('span', {
    ref,
    ...props,
  });
});

export const SelectContent = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

export const SelectItem = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

// Mock Dialog components
export const Dialog = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

export const DialogContent = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

export const DialogHeader = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

export const DialogTitle = React.forwardRef<HTMLHeadingElement, any>((props, ref) => {
  return React.createElement('h2', {
    ref,
    ...props,
  });
});

// Mock Calendar component
export const Calendar = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});

// Mock Chart component
export const Chart = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return React.createElement('div', {
    ref,
    ...props,
  });
});