import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import './Toggle.css';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export function Toggle({ label, className, ...props }: ToggleProps) {
    return (
        <label className={clsx('toggle-wrapper', className)}>
            <input type="checkbox" className="toggle-input" {...props} />
            <span className="toggle-slider" />
            {label && <span className="toggle-label">{label}</span>}
        </label>
    );
}
