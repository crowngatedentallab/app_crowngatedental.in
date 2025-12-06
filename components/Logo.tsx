
import React from 'react';

interface LogoProps {
  className?: string;
}

// Converted Google Drive View Link to Direct Image Source
// File ID: 1fLLtv101NWIUmZYZXm4vU_4CUmxNgEuM
const LOGO_URL = "https://drive.google.com/uc?export=view&id=1fLLtv101NWIUmZYZXm4vU_4CUmxNgEuM";

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <img 
      src={LOGO_URL} 
      alt="Crowngate Logo" 
      className={`${className} object-contain`} 
    />
  );
};
