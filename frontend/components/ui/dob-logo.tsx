interface DOBLogoProps {
  className?: string;
}

export default function DOBLogo({ className = "h-16 w-16" }: DOBLogoProps) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#gradient)"
          stroke="#059669"
          strokeWidth="2"
        />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        
        {/* DOB Text */}
        <text
          x="50"
          y="35"
          textAnchor="middle"
          className="fill-gray-800 font-bold text-lg"
          fontSize="16"
        >
          DOB
        </text>
        
        {/* Dreams of Bangladesh */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          className="fill-gray-600 text-xs"
          fontSize="6"
        >
          Dreams of
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          className="fill-gray-600 text-xs"
          fontSize="6"
        >
          Bangladesh
        </text>
        
        {/* Decorative Elements */}
        <circle cx="25" cy="25" r="3" fill="#10b981" opacity="0.6" />
        <circle cx="75" cy="25" r="3" fill="#ef4444" opacity="0.6" />
        <circle cx="25" cy="75" r="3" fill="#ef4444" opacity="0.6" />
        <circle cx="75" cy="75" r="3" fill="#10b981" opacity="0.6" />
      </svg>
    </div>
  )
}
