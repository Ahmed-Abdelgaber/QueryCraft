import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import './Badge.css';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
}

export function Badge({
    variant = 'default',
    size = 'md',
    className,
    children,
    ...props
}: BadgeProps) {
    return (
        <span
            className={clsx(
                'badge',
                `badge--${variant}`,
                `badge--${size}`,
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
