import React from 'react';

interface MuliaLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export const MuliaLogo: React.FC<MuliaLogoProps> = ({
  className = 'h-14',
  showSubtitle = true,
}) => {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Fallback to stylized vector logo matching the 41 Mulia logo from image_2aafb878 */}
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 100 80"
          className="h-10 w-auto flex-shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized Red / Orange Triangles */}
          <polygon points="10,65 40,15 50,65" fill="#DC2626" />
          <polygon points="35,65 55,30 65,65" fill="#EA580C" />
          <polygon points="50,65 70,38 80,65" fill="#F97316" />
        </svg>

        <div className="flex flex-col justify-center">
          <div className="flex items-baseline leading-none">
            <span className="text-2xl font-black text-red-600 tracking-tight mr-1">41</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Mulia</span>
          </div>
          {showSubtitle && (
            <span className="text-[8px] font-semibold tracking-wider text-slate-700 uppercase mt-0.5">
              Integrated Warehouse Solutions
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
