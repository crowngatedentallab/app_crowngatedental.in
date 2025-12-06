
import React from 'react';

interface LogoProps {
  className?: string;
}

import logoUrl from '../logo.png';

const LOGO_URL = logoUrl;

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <img
      src={LOGO_URL}
      alt="Crowngate Logo"
      className={`${className} object-contain`}
    />
  );
};
