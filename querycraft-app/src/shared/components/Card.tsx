import type { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: ReactNode;
}

export function Card({
    variant = 'default',
    padding = 'md',
    className,
    children,
    ...props
}: CardProps) {
    return (
        <div
            className={clsx(
                'card',
                `card--${variant}`,
                `card--padding-${padding}`,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
