import React, { useEffect, useState } from "react";

// Default values for filters to ensure the component always has a valid structure to work with
const defaultFilterSettings = {
  smoothing: 0,
  brightness: 0,
  contrast: 0,
  blur: 0,
  saturation: 0,
  backgroundBlur: 0,
};

const FilterControls = ({ filters: filtersFromProps, onUpdateFilter, onResetFilters, disabled = false }) => {
  // Merge provided filters with defaults.
  const filters = { ...defaultFilterSettings, ...(filtersFromProps || {}) };

  const [expanded, setExpanded] = useState({
    adjustments: true,
    refinements: false,
    focusEffects: false,
  });

  // State to track if any *incoming* filters (from props) are active (non-zero)
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  useEffect(() => {
    let isActive = false;
    if (filtersFromProps) { 
      for (const key in defaultFilterSettings) {
        if (
          filtersFromProps.hasOwnProperty(key) &&
          typeof filtersFromProps[key] === "number" &&
          // Check against the default value for that specific filter key.
          // (The original check was `filtersFromProps[key] !== 0`, which is fine as all defaults are 0)
          filtersFromProps[key] !== defaultFilterSettings[key] 
        ) {
          isActive = true;
          break;
        }
      }
    }
    setHasActiveFilters(isActive);
  }, [filtersFromProps]); 

  const handleSliderChange = (filterName, value) => {
    if (typeof onUpdateFilter === "function" && !disabled) {
      onUpdateFilter(filterName, parseFloat(value));
    }
  };

  const handleResetFiltersClick = () => {
    if (typeof onResetFilters === "function" && !disabled) {
      onResetFilters();
    }
  };

  const toggleSection = (section) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [section]: !prevExpanded[section],
    }));
  };

  const formatValue = (value, isPercentage = true) => {
    const numericValue = typeof value === "number" ? value : 0; 
    if (isPercentage) {
      const percentage = Math.round(numericValue * 100);
      return `${percentage}%`;
    }
    return numericValue.toFixed(2); // For values not typically expressed as %
  };

  return (
    <div className={`w-full max-w-md bg-white rounded-lg shadow-md p-5 mb-5 ${disabled ? "opacity-75 cursor-not-allowed" : ""}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Photo Adjustments
      </h2>

      {hasActiveFilters && (
        <button
          onClick={handleResetFiltersClick}
          disabled={disabled}
          className="mb-4 text-sm flex items-center text-blue-600 hover:text-blue-800 transition-colors disabled:text-gray-400 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" fill="currentColor"><rect width="256" height="256" fill="none"/><path d="M131.42,198.66A8,8,0,0,1,120,200H48a8,8,0,0,1-8-8V120a8,8,0,0,1,16,0v64H120A8,8,0,0,1,131.42,198.66ZM208,136V72H144a8,8,0,0,0-6.53,12.35L151,104H136a8,8,0,0,0,0,16h24.34l-11.17,14.89A8,8,0,1,0,161.6,141.1L176,121.48V136a8,8,0,0,0,16,0Zm0-80a8,8,0,0,0-8-8H136a8,8,0,0,0,0,16h64V120a8,8,0,0,0,16,0V56A8,8,0,0,0,208,48ZM112,56V48a8,8,0,0,0-8-8H48a8,8,0,0,0-8,8V72a8,8,0,0,0,16,0V56Z"/></svg>
          <span className="ml-1">Reset All</span>
        </button>
      )}

      {/* Adjustments Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("adjustments")}
          disabled={disabled}
          className="w-full flex items-center justify-between text-left text-lg font-medium text-gray-700 py-2 disabled:text-gray-400"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><circle cx="104" cy="80" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><circle cx="168" cy="176" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="128" y1="80" x2="216" y2="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="40" y1="80" x2="80" y2="80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="192" y1="176" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="40" y1="176" x2="144" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
            <span className="ml-2">Light & Color</span>
          </div>
          <span className="text-gray-400">
            {expanded.adjustments ? "−" : "+"}
          </span>
        </button>
        
        {expanded.adjustments && (
          <div className="pl-2 mt-2 space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Brightness</label>
                <span className="text-sm font-medium text-gray-700">
                  {formatValue(filters.brightness)}
                </span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={filters.brightness}
                onChange={(e) => handleSliderChange("brightness", e.target.value)}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Darker</span>
                <span>Brighter</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Contrast</label>
                <span className="text-sm font-medium text-gray-700">
                  {formatValue(filters.contrast)}
                </span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={filters.contrast}
                onChange={(e) => handleSliderChange("contrast", e.target.value)}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Less</span>
                <span>More</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Saturation</label>
                <span className="text-sm font-medium text-gray-700">
                  {formatValue(filters.saturation)}
                </span>
              </div>
              <input
                type="range"
                min="-1" 
                max="1"  
                step="0.01"
                value={filters.saturation}
                onChange={(e) => handleSliderChange("saturation", e.target.value)}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Grayscale</span>
                <span>Vivid</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Refinements Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("refinements")}
          disabled={disabled}
          className="w-full flex items-center justify-between text-left text-lg font-medium text-gray-700 py-2 disabled:text-gray-400"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><line x1="216" y1="128" x2="216" y2="176" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="192" y1="152" x2="240" y2="152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="80" y1="40" x2="80" y2="88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="56" y1="64" x2="104" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="168" y1="184" x2="168" y2="216" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="152" y1="200" x2="184" y2="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="144" y1="80" x2="176" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><rect x="21.49" y="105.37" width="213.02" height="45.25" rx="8" transform="translate(-53.02 128) rotate(-45)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
            <span className="ml-2">Detail & Texture</span>
          </div>
          <span className="text-gray-400">
            {expanded.refinements ? "−" : "+"}
          </span>
        </button>
        
        {expanded.refinements && (
          <div className="pl-2 mt-2 space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Smoothing</label>
                <span className="text-sm font-medium text-gray-700">
                  {formatValue(filters.smoothing)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={filters.smoothing}
                onChange={(e) => handleSliderChange("smoothing", e.target.value)}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Off</span>
                <span>Max</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Overall Blur</label>
                <span className="text-sm font-medium text-gray-700">
                  {formatValue(filters.blur, false)} {/* Assuming blur is not a percentage */}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5" 
                step="0.01"
                value={filters.blur}
                onChange={(e) => handleSliderChange("blur", e.target.value)}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>None</span>
                <span>Subtle</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Focus Effects Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("focusEffects")}
          disabled={disabled}
          className="w-full flex items-center justify-between text-left text-lg font-medium text-gray-700 py-2 disabled:text-gray-400"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="128" y1="32" x2="164.68" y2="134.7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="44.86" y1="80" x2="152.14" y2="99.58" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="44.86" y1="176" x2="115.46" y2="92.89" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="128" y1="224" x2="91.32" y2="121.3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="211.14" y1="176" x2="103.86" y2="156.42" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="211.14" y1="80" x2="140.54" y2="163.11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
            <span className="ml-2">Focus Effects</span>
          </div>
          <span className="text-gray-400">
            {expanded.focusEffects ? "−" : "+"}
          </span>
        </button>
        
        {expanded.focusEffects && (
          <div className="pl-2 mt-2 space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Background Blur</label>
                <span className="text-sm font-medium text-gray-700">
                  {formatValue(filters.backgroundBlur)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={filters.backgroundBlur}
                onChange={(e) => handleSliderChange("backgroundBlur", e.target.value)}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>None</span>
                <span>Strong</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Tip: Experiment with different combinations of filters to achieve your desired look. Subtle changes often have the best results.
        </p>
      </div>
    </div>
  );
};

export default FilterControls;