import React, { useState, useRef, useEffect } from 'react';

const DosSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="dos-button w-full text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="absolute w-full bg-[#000080] border-2 border-white mt-1 z-10">
          {options.map((option) => (
            <div
              key={option}
              className={`dos-button cursor-pointer ${option === value ? 'bg-white text-[#000080]' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const DosNumberInput = ({ value, onChange, min, max }) => {
  const handleIncrement = () => {
    onChange(Math.min(max, value + 1));
  };

  const handleDecrement = () => {
    onChange(Math.max(min, value - 1));
  };

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="dos-input w-16 text-center"
      />
      <div className="flex flex-col ml-1">
        <button onClick={handleIncrement} className="px-0.5 py-0 text-xs">▲</button>
        <button onClick={handleDecrement} className="px-0.5 py-0 text-xs">▼</button>
      </div>
    </div>
  );
};

export const DosSlider = ({ value, onChange, min, max, step }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newValue = min + percentage * (max - min);
    onChange(Math.min(max, Math.max(min, Number(newValue.toFixed(2)))));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div 
        className="h-6 bg-[#000080] border-2 border-white relative cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div 
          className="h-full bg-white" 
          style={{ width: `${percentage}%` }}
        />
        <div 
          className="absolute top-0 h-full w-2 bg-white border-2 border-[#000080]"
          style={{ left: `calc(${percentage}% - 4px)` }}
        />
      </div>
    </div>
  );
};

export default DosSelect;