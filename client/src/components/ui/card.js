export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);
