

import React from 'react';

// FIX: Extend with HTMLAttributes to allow passing standard div props like onClick.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm dark:bg-hin-blue-800 dark:border-hin-blue-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-hin-blue-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-50 px-4 py-3 sm:px-6 dark:bg-hin-blue-900/50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;