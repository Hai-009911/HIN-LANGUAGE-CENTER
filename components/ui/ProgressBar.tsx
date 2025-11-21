import React from 'react';

type Color = 'blue' | 'green' | 'indigo' | 'red' | 'yellow' | 'orange';

interface ProgressBarProps {
    value: number; // 0 to 100
    color?: Color;
    className?: string;
}

const colorClasses: Record<Color, string> = {
    blue: 'bg-hin-blue-500',
    green: 'bg-hin-green-500',
    indigo: 'bg-hin-blue-600',
    red: 'bg-red-500',
    yellow: 'bg-hin-orange-400',
    orange: 'bg-hin-orange-500',
}


const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = 'indigo', className = '' }) => {
    const progress = Math.max(0, Math.min(100, value)); // Clamp value between 0 and 100

    return (
        <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
            <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${colorClasses[color]}`} 
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;