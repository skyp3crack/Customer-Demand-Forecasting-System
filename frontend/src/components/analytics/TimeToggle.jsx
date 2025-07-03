import React from 'react';
import PropTypes from 'prop-types';

const TimeToggle = ({ value, onChange, options = ['daily', 'monthly', 'yearly'] }) => {
    return (
        <div className="flex border rounded-md overflow-hidden">
            {options.map(option => (
                <button
                    key={option}
                    className={`px-3 py-2 text-sm ${
                        value === option 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => onChange(option)}
                >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
            ))}
        </div>
    );
};

TimeToggle.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.string)
};

export default TimeToggle;
