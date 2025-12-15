import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', fullWidth = false, className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={clsx(
                    'btn',
                    `btn--${variant}`,
                    `btn--${size}`,
                    fullWidth && 'btn--full-width',
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
