import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const MultiSelect = ({ options, selectedValues, onChange, singleSelect = false, placeholder = 'Select drugs' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (value) => {
        if (singleSelect) {
            onChange(selectedValues.includes(value) ? [] : [value]);
        } else {
            if (selectedValues.includes(value)) {
                onChange(selectedValues.filter(item => item !== value));
            } else {
                onChange([...selectedValues, value]);
            }
        }
    };

    const displayValue = () => {
        if (selectedValues.length === 0) {
            return placeholder;
        }
        if (singleSelect) {
            return selectedValues[0];
        }
        return `${selectedValues.length} drugs selected`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
            >
                <span>{displayValue()}</span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map(option => (
                        <div
                            key={option}
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                            onClick={() => toggleOption(option)}
                        >
                            <input
                                type={singleSelect ? "radio" : "checkbox"}
                                checked={selectedValues.includes(option)}
                                onChange={() => {}}
                                className="mr-2"
                            />
                            <span>{option}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
