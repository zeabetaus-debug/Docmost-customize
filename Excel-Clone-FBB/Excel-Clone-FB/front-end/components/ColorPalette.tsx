import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ColorPaletteProps {
  onSelect: (color: string | undefined) => void;
  onClose: () => void;
  showNoColor?: boolean;
  triggerRect: DOMRect | null;
  align?: 'bottom' | 'side';
}

const THEME_COLORS = [
  ['#FFFFFF', '#000000', '#E7E6E6', '#44546A', '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'],
  ['#F2F2F2', '#7F7F7F', '#D0CECE', '#D6DCE4', '#D9E1F2', '#FCE4D6', '#EDEDED', '#FFF2CC', '#DDEBF7', '#E2EFDA'],
  ['#D8D8D8', '#595959', '#AEAAAA', '#ADB9CA', '#B4C6E7', '#F8CBAD', '#DBDBDB', '#FFE699', '#BDD7EE', '#C6E0B4'],
  ['#BFBFBF', '#3F3F3F', '#757171', '#8497B0', '#8EA9DB', '#F4B084', '#C9C9C9', '#FFD966', '#9BC2E6', '#A9D08E'],
  ['#A5A5A5', '#262626', '#3A3838', '#333F4F', '#305496', '#C65911', '#7B7B7B', '#BF9000', '#2F75B5', '#548235'],
  ['#7F7F7F', '#0C0C0C', '#161616', '#222B35', '#1F3763', '#833C0C', '#525252', '#806000', '#1F4E78', '#375623'],
];

const STANDARD_COLORS = [
  '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0'
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({ 
  onSelect, onClose, showNoColor, triggerRect, align = 'bottom' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, position: 'fixed', zIndex: 9999 });

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the palette
      if (containerRef.current && containerRef.current.contains(event.target as Node)) {
        return;
      }
      // If clicking strictly outside, close. 
      onClose();
    };
    
    // Capture to ensure we handle it before other conflicting handlers if any
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (!triggerRect || !containerRef.current) return;

    const palette = containerRef.current;
    const { height, width } = palette.getBoundingClientRect();
    const { top, left, bottom, right } = triggerRect;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalTop = bottom;
    let finalLeft = left;

    if (align === 'side') {
        // Attempt to place to the LEFT of the trigger
        finalLeft = left - width;
        finalTop = top;

        // If it goes off-screen to the left (e.g. negative or less than 10px padding), flip to RIGHT
        if (finalLeft < 10) {
            finalLeft = right;
        }
    } else {
        // Default 'bottom' alignment logic
        if (bottom + height > viewportHeight && top > height) {
          finalTop = top - height;
        }
    }

    // Horizontal Constrainment (keep within viewport)
    if (finalLeft + width > viewportWidth) {
        finalLeft = viewportWidth - width - 10;
    }
    if (finalLeft < 10) finalLeft = 10;

    // Vertical Constrainment
    if (finalTop + height > viewportHeight) {
        finalTop = viewportHeight - height - 10;
    }
    if (finalTop < 10) finalTop = 10;

    setStyle({
        position: 'fixed',
        top: finalTop,
        left: finalLeft,
        zIndex: 9999,
        opacity: 1
    });

  }, [triggerRect, align]);

  const handleMoreColorsClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent parent menu from closing
      inputRef.current?.click(); // Trigger hidden input
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // This fires when the user confirms the selection in the system picker
      onSelect(e.target.value);
      onClose();
  };

  return createPortal(
    <div 
      ref={containerRef}
      data-portal="color-palette"
      style={style}
      className="bg-white border border-gray-400 shadow-xl p-3 w-[240px] select-none text-left cursor-default"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {showNoColor && (
        <div 
          className="flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-300 mb-2 rounded-sm"
          onClick={() => { onSelect(undefined); onClose(); }}
        >
          <div className="w-5 h-5 border border-gray-300 bg-white relative">
            <div className="absolute top-0 left-0 w-full h-full border-t border-red-500 rotate-45 transform origin-top-left translate-y-[2px]"></div>
          </div>
          <span className="text-xs">No Fill</span>
        </div>
      )}

      <div className="mb-2">
        <div className="text-[11px] font-semibold text-gray-500 mb-1">Theme Colors</div>
        <div className="grid grid-cols-10 gap-[1px]">
          {THEME_COLORS.map((row, rIdx) => (
             row.map((c, cIdx) => (
               <div 
                 key={`${rIdx}-${cIdx}`}
                 className="w-5 h-5 cursor-pointer hover:outline hover:outline-1 hover:outline-orange-400 hover:z-10 border border-gray-200"
                 style={{ backgroundColor: c }}
                 onClick={() => { onSelect(c); onClose(); }}
                 title={c}
               />
             ))
          ))}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-[11px] font-semibold text-gray-500 mb-1">Standard Colors</div>
        <div className="grid grid-cols-10 gap-[1px]">
          {STANDARD_COLORS.map((c) => (
             <div 
               key={c}
               className="w-5 h-5 cursor-pointer hover:outline hover:outline-1 hover:outline-orange-400 hover:z-10 border border-gray-200"
               style={{ backgroundColor: c }}
               onClick={() => { onSelect(c); onClose(); }}
               title={c}
             />
          ))}
        </div>
      </div>

      <div 
        className="pt-2 border-t border-gray-200 mt-1"
      >
        <div 
          className="flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-100 rounded-sm"
          onClick={handleMoreColorsClick}
        >
          <span className="text-xs font-medium text-gray-700">More Colors...</span>
          <input 
            ref={inputRef}
            type="color" 
            className="w-0 h-0 opacity-0 absolute pointer-events-none"
            onChange={handleColorChange}
            onClick={e => e.stopPropagation()} // Stop propagation from input click as well
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
