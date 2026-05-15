import React from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, label, description, disabled = false }: SwitchProps) {
  return (
    <label className="relative inline-flex items-start">
      <div className="flex items-center h-6 cursor-pointer">
        <input
          type="checkbox"
          checked={checked || false}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`
          relative w-11 h-6 bg-gray-200 rounded-full peer 
          peer-focus:ring-4 peer-focus:ring-[#00665C]/20
          peer-checked:after:translate-x-full peer-checked:after:border-white 
          after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
          after:bg-white after:border-gray-300 after:border after:rounded-full 
          after:h-5 after:w-5 after:transition-all
          peer-checked:bg-[#00665C]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `} />
      </div>
      {(label || description) && (
        <div className="ml-3 cursor-pointer">
          {label && (
            <span className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
              {label}
            </span>
          )}
          {description && (
            <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
}