import React from 'react';

import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  width?: string | number;
  height?: string | number;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  width,
  height,
  fullWidth = false,
  children,
  className = '',
  style,
  ...props
}) => {
  const buttonStyle = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    ...(fullWidth && { width: '100%' }),
  };

  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      style={buttonStyle}
      {...props}
    >
      {children}
    </button>
  );
};
