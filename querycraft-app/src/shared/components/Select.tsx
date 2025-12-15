import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import './Select.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, fullWidth = false, className, ...props }, ref) => {
        return (
            <div className={clsx('select-wrapper', fullWidth && 'select-wrapper--full-width')}>
                {label && <label className="select-label">{label}</label>}
                <select
                    ref={ref}
                    className={clsx('select', error && 'select--error', className)}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <span className="select-error">{error}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';
