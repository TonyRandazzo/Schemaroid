import { forwardRef } from 'react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  dangerSolid: 'btn-danger-solid',
  success: 'btn-success',
  ghost: 'btn-ghost',
};

const Button = forwardRef(function Button(
  { children, variant = 'primary', size, className = '', ...props },
  ref
) {
  const classes = [
    'btn',
    VARIANTS[variant] ?? VARIANTS.primary,
    size === 'sm' ? 'btn-sm' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});

export default Button;
