import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, id, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`w-full h-12 px-4 border border-gray-200 rounded-xl shadow-none
          bg-white text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          transition-colors ${className}`}
        {...props}
      />
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
