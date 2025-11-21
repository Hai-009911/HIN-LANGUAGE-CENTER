import React from 'react';

const DefaultAvatarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

interface AvatarProps {
  src?: string;
  alt: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, className = 'h-10 w-10' }) => {
  const isVideo = src?.startsWith('data:video');

  return (
    <div className={`${className} rounded-full overflow-hidden bg-hin-blue-100 text-hin-blue-400 flex-shrink-0 flex items-center justify-center`}>
      {!src ? (
        <DefaultAvatarIcon />
      ) : isVideo ? (
        <video src={src} className="h-full w-full object-cover" autoPlay loop muted playsInline />
      ) : (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      )}
    </div>
  );
};

export default Avatar;