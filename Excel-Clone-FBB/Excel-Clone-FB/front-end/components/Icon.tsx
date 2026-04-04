import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, className, onClick }) => {
  const LucideIcon = Icons[name] as React.ElementType;
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} onClick={onClick} />;
};
