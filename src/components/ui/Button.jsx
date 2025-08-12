import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-orange-500 text-white shadow-sm hover:bg-orange-600 focus-visible:ring-orange-500',
        destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500',
        outline: 'border border-orange-500 bg-transparent text-orange-500 hover:bg-orange-50 focus-visible:ring-orange-500',
        secondary: 'bg-green-700 text-white shadow-sm hover:bg-green-800 focus-visible:ring-green-500',
        ghost: 'text-green-600 hover:bg-green-50 hover:text-green-700 focus-visible:ring-green-500',
        link: 'text-orange-500 underline-offset-4 hover:underline focus-visible:ring-orange-500',
        gradient: 'bg-orange-500 text-white shadow-sm hover:bg-orange-600 focus-visible:ring-orange-500',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 py-1.5 text-xs',
        lg: 'h-12 px-8 py-3 text-base',
        xl: 'h-14 px-10 py-4 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, children, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export { Button, buttonVariants }
export default Button