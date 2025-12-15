import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, fullWidth = false, className, ...props }, ref) => {
        return (
            <div className={clsx('input-wrapper', fullWidth && 'input-wrapper--full-width')}>
                {label && <label className="input-label">{label}</label>}
                <input
                    ref={ref}
                    className={clsx('input', error && 'input--error', className)}
                    {...props}
                />
                {error && <span className="input-error">{error}</span>}
                {helperText && !error && <span className="input-helper">{helperText}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
