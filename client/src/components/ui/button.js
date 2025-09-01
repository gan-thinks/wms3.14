export const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "",
  ...props 
}) => {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
