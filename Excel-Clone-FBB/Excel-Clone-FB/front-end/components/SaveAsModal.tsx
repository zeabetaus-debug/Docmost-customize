import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface SaveAsModalProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  initialValue?: string;
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({ onSave, onCancel, initialValue = '' }) => {
    const [fileName, setFileName] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleSave = () => {
        if (fileName.trim()) {
            onSave(fileName.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') onCancel();
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
            <div className="bg-white rounded shadow-xl w-[400px] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-[#107c41] text-white px-4 py-3 flex items-center gap-2">
                    <Icon name="SaveAll" size={20} />
                    <span className="font-semibold text-lg">Save File</span>
                </div>
                
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
                    <div className="flex items-center border border-gray-300 rounded px-3 py-2 focus-within:ring-2 focus-within:ring-[#107c41] focus-within:border-transparent">
                        <Icon name="File" size={18} className="text-gray-400 mr-2" />
                        <input 
                            ref={inputRef}
                            className="flex-1 outline-none text-gray-800"
                            placeholder="Enter file name..."
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="text-gray-400 text-sm ml-1">.xlsx</span>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!fileName.trim()}
                        className={`px-4 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#107c41] ${fileName.trim() ? 'bg-[#107c41] hover:bg-[#0c5e31]' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
