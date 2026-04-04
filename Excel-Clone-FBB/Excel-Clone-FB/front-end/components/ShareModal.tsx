// components/ShareModal.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface ShareModalProps {
  link: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ link, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
      navigator.clipboard.writeText(link);
    }
  }, [link]);

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[1000] bg-white rounded-lg shadow-2xl p-5 w-96 border border-gray-200 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Icon name="Share2" size={20} className="text-[#107c41]" />
          Share this sheet
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800"
        >
          <Icon name="X" size={20} />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Anyone with this link can view and edit the sheet.
      </p>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={link}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#107c41]"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            alert("Link copied!");
          }}
          className="bg-[#107c41] hover:bg-[#0c5e31] text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="Copy" size={16} />
          Copy link
        </button>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  );
};