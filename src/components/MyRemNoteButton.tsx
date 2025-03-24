import React from 'react';

interface MyRemNoteButtonProps {
  img?: string; // SVG path string
  text: string; // Button label
  onClick: () => void; // Click handler
  active?: boolean;
}

const MyRemNoteButton: React.FC<MyRemNoteButtonProps> = ({ img, text, onClick, active = true}) => {
  return (
    <button
      //className="py-1.5 px-3 h-8 hover:bg-gray-5 rn-clr-background-primary text-gray-100 inline-flex items-center rounded-md border-0"
      className={`py-1.5 px-3 h-8 rn-clr-background-primary inline-flex items-center rounded-md border-0 ${
        active
          ? 'hover:bg-gray-5 text-gray-100'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      onClick={onClick}
    >
      {img && (
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: '8px' }}>
          <svg
            fill="currentColor"
            viewBox="0 0 16 16"
            style={{ width: '16px', minWidth: '16px', height: '16px', minHeight: '16px' }}
          >
            <path d={img} />
          </svg>
        </div>
      )}
      <span className="text-black">{text}</span>
    </button>
  );
};

export default MyRemNoteButton;