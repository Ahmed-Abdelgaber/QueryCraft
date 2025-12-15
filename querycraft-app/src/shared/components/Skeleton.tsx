import { clsx } from 'clsx';
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular';
    className?: string;
}

export function Skeleton({
    width,
    height,
    variant = 'rectangular',
    className
}: SkeletonProps) {
    return (
        <div
            className={clsx('skeleton', `skeleton--${variant}`, className)}
            style={{ width, height }}
        />
    );
}
