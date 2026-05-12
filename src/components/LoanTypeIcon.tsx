import React from 'react';

interface LoanTypeIconProps {
  type: 'personal' | 'bike' | 'car' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoanTypeIcon: React.FC<LoanTypeIconProps> = ({ type, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const icons = {
    personal: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M14 2V8H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 13H8M16 17H8M10 9H8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    bike: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="18" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2" />
        <circle cx="19" cy="18" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2" />
        <path
          d="M8 18H16M12 18V14M12 14L15 8H17M12 14L9 8H7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 8H19L20 6H18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    car: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5 11L7 6H17L19 11M5 11V17H19V11M5 11H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          opacity="0.2"
        />
        <circle cx="7.5" cy="15.5" r="1.5" fill="currentColor" />
        <circle cx="16.5" cy="15.5" r="1.5" fill="currentColor" />
        <path
          d="M3 11H21M5 17V18C5 18.5523 5.44772 19 6 19H7M19 17V18C19 18.5523 18.5523 19 18 19H17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    gold: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          opacity="0.3"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          opacity="0.2"
        />
        <circle cx="12" cy="7" r="1.5" fill="currentColor" />
      </svg>
    )
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {icons[type]}
    </div>
  );
};

export default LoanTypeIcon;
