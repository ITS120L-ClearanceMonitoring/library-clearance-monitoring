/**
 * Modern Button Component with Mapuan Colors
 * Variants: primary (red), secondary (yellow), ghost
 */
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style = {}
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;
