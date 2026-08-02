import { cn } from '../../lib/utils';

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked = false, onChange, disabled = false, className }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
      className={cn(
        'w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    />
  );
}
