export const Avatar = ({ src, alt, className = "" }) => (
  <div className={`inline-block h-10 w-10 rounded-full overflow-hidden ${className}`}>
    {src ? (
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    ) : (
      <div className="h-full w-full bg-gray-300 flex items-center justify-center">
        <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    )}
  </div>
);

export const AvatarImage = ({ src, alt, className = "" }) => (
  <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />
);

export const AvatarFallback = ({ children, className = "" }) => (
  <div className={`h-full w-full bg-gray-300 flex items-center justify-center text-gray-600 ${className}`}>
    {children}
  </div>
);
