import { useState, useEffect, useCallback, useMemo } from "react";

// Define default filter values outside the hook for stable reference
// These represent the neutral state for each filter, suitable for general photo editing.
const defaultFilters = {
  smoothing: 0,    // 0 = off, 1 = max smoothing
  brightness: 0,   // 0 = no change (100%), -0.5 = 50%, 0.5 = 150%
  contrast: 0,     // 0 = no change (100%), -0.5 = 50%, 0.5 = 150%
  blur: 0,         // 0 = off, 0.5 = max blur (e.g., 4px if scaled by 8)
  saturation: 0,   // 0 = no change (100%), -1 = 0% (grayscale), 1 = 200%
  backgroundBlur: 0, // 0 = off, 1 = max background blur
};

const useImageFilters = () => {
  const [internalFilters, setInternalFilters] = useState({ ...defaultFilters });
  const [originalImage, setOriginalImage] = useState(null); // HTMLImageElement
  const [processedImage, setProcessedImage] = useState(null); // Data URL
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized filters object: its reference only changes if its content changes.
  const filters = useMemo(() => internalFilters, [internalFilters]);

  const setupCanvas = useCallback((imageElement) => {
    if (!imageElement || !(imageElement instanceof HTMLImageElement) || !imageElement.complete || imageElement.naturalWidth === 0) {
        console.error("setupCanvas received an invalid, unloaded, or zero-dimension image element.");
        setOriginalImage(null);
        setProcessedImage(null); 
        setIsProcessing(false); // Ensure processing is false if setup fails
        return;
    }
    setOriginalImage(imageElement);
    // Setting originalImage will trigger the main useEffect (via processImage dependency) to process it.
  }, []);

  const applyFilter = useCallback((ctx, filterType, value) => {
    // Initial check to see if filter should be skipped based on value
    // For non-additive/non-subtractive filters (like smoothing, blur, backgroundBlur), skip if value is negligible.
    if (filterType !== "brightness" && filterType !== "contrast" && filterType !== "saturation" && Math.abs(value) < 0.01) {
        return; 
    }
    // For additive/subtractive filters (brightness, contrast, saturation), skip if value is exactly neutral (0).
    if ((filterType === "brightness" || filterType === "contrast" || filterType === "saturation") && value === 0) {
        return;
    }
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    let tempCanvas, tempCtx; // Declare here for helper function scope

    const applyCssFilterAndRedraw = (filterString) => {
        tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx = tempCanvas.getContext("2d");
        
        if (!tempCtx) {
            console.error("Failed to get 2D context for temporary canvas in applyCssFilterAndRedraw.");
            return; 
        }
        
        // Draw current main canvas content to temp
        tempCtx.drawImage(ctx.canvas, 0, 0); 
        
        // Apply CSS filter on temp canvas
        tempCtx.filter = filterString; 
        tempCtx.drawImage(tempCanvas, 0, 0); // Redraw with filter applied (itself to itself)
        
        // Clear main canvas and draw filtered temp canvas back
        ctx.clearRect(0, 0, width, height); 
        ctx.filter = "none"; // Reset main context filter before drawing back
        ctx.drawImage(tempCanvas, 0, 0); 
    };

    switch (filterType) {
      case "smoothing":
        if (value > 0) { // Only apply if value is positive
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          // Strength (1-6): lower is finer. value (0-1) maps to strength.
          const strength = Math.max(1, Math.floor(value * 5) + 1); 
          
          for (let i = 0; i < data.length; i += 4) {
            for (let j = 0; j < 3; j++) { // R, G, B channels
              let sum = 0;
              let count = 0;
              const currentPixelY = Math.floor(i / (width * 4));
              const currentPixelX = Math.floor((i % (width * 4)) / 4);

              for (let y = -strength; y <= strength; y++) {
                for (let x = -strength; x <= strength; x++) {
                  const sampleY = currentPixelY + y;
                  const sampleX = currentPixelX + x;
                  if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
                    const sampleIndex = (sampleY * width + sampleX) * 4 + j;
                    sum += data[sampleIndex];
                    count++;
                  }
                }
              }
              if (count > 0) {
                const originalWeight = Math.max(0.05, 1 - (value * 0.9)); // Blend smoothed with original
                const smoothWeight = 1 - originalWeight;
                data[i + j] = Math.round((data[i + j] * originalWeight) + ((sum / count) * smoothWeight));
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        break;
      case "brightness":
        applyCssFilterAndRedraw(`brightness(${1 + value})`);
        break;
      case "contrast":
        applyCssFilterAndRedraw(`contrast(${1 + value})`);
        break;
      case "blur":
        if (value > 0) { // Only apply if value is positive
          applyCssFilterAndRedraw(`blur(${value * 8}px)`); // Map 0-1 to 0-8px blur (e.g. if slider max is 0.5 -> 4px)
        }
        break;
      case "saturation":
        applyCssFilterAndRedraw(`saturate(${1 + value})`); // value from -1 (grayscale) to 1 (double saturation)
        break;
      case "backgroundBlur":
        if (value > 0) { // Only apply if value is positive
          const centerX = width / 2;
          const centerY = height / 2;
          const focusRadius = Math.min(width, height) * 0.35; // Area to keep in focus

          const currentContent = document.createElement("canvas");
          currentContent.width = width;
          currentContent.height = height;
          const currentContentCtx = currentContent.getContext("2d");
          if (!currentContentCtx) { console.error("Failed to get context for currentContent canvas."); return; }
          currentContentCtx.drawImage(ctx.canvas, 0, 0);

          const blurredCanvas = document.createElement("canvas");
          blurredCanvas.width = width;
          blurredCanvas.height = height;
          const blurredCtx = blurredCanvas.getContext("2d");
          if (!blurredCtx) { console.error("Failed to get context for blurredCanvas."); return; }
          blurredCtx.drawImage(currentContent, 0, 0);
          blurredCtx.filter = `blur(${value * 10}px)`; // Background blur strength
          blurredCtx.drawImage(blurredCanvas, 0, 0); 
          blurredCtx.filter = "none";

          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(blurredCanvas, 0, 0); // Main context now has fully blurred image

          const sharpMask = document.createElement("canvas");
          sharpMask.width = width;
          sharpMask.height = height;
          const sharpMaskCtx = sharpMask.getContext("2d");
          if (!sharpMaskCtx) { console.error("Failed to get context for sharpMask canvas."); return; }
          const gradient = sharpMaskCtx.createRadialGradient(
            centerX, centerY, focusRadius * 0.6, // Inner radius of sharp area
            centerX, centerY, focusRadius * 1.4  // Outer radius where it becomes fully transparent
          );
          gradient.addColorStop(0, "rgba(255,255,255,1)"); 
          gradient.addColorStop(0.7, "rgba(255,255,255,1)");
          gradient.addColorStop(1, "rgba(255,255,255,0)"); 
          sharpMaskCtx.fillStyle = gradient;
          sharpMaskCtx.fillRect(0, 0, width, height);
          
          const sharpFocusLayer = document.createElement("canvas");
          sharpFocusLayer.width = width;
          sharpFocusLayer.height = height;
          const sflCtx = sharpFocusLayer.getContext("2d");
          if (!sflCtx) { console.error("Failed to get context for sharpFocusLayer canvas."); return; }
          sflCtx.drawImage(currentContent, 0, 0); // Original (pre-blur) content
          sflCtx.globalCompositeOperation = "destination-in";
          sflCtx.drawImage(sharpMask, 0, 0); // Apply mask: keeps original content only where mask is opaque

          ctx.globalCompositeOperation = "source-over"; // Reset composite operation
          ctx.drawImage(sharpFocusLayer, 0, 0); // Draw sharp focused layer on top
        }
        break;
      default:
        console.warn(`Unknown filter type: ${filterType}`);
    }
    ctx.globalCompositeOperation = "source-over"; // Ensure composite operation is reset
  }, []); // applyFilter is stable as it operates on arguments and has no closure over hook state.

  const processImage = useCallback(() => {
    if (!originalImage || originalImage.naturalWidth === 0) {
      setProcessedImage(null); // Clear output if no valid source
      setIsProcessing(false);  // Ensure processing state is false
      return;
    }

    setIsProcessing(true); // Set processing true at the beginning of actual work
    
    // Using a microtask (Promise.resolve) to allow UI updates before heavy canvas operations.
    Promise.resolve().then(() => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = originalImage.naturalWidth;
            canvas.height = originalImage.naturalHeight;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                console.error("Failed to get 2D context for processing canvas.");
                setProcessedImage(null); 
                // setIsProcessing(false) will be called in the finally block
                return; 
            }
            
            // Draw the original image onto the canvas first
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            
            // Sequentially apply all filters from the current 'filters' state object
            Object.entries(filters).forEach(([filterType, value]) => {
               applyFilter(ctx, filterType, value);
            });
            
            const dataUrl = canvas.toDataURL("image/jpeg", 0.92); // Use JPEG for general photos
            setProcessedImage(dataUrl);
        } catch (error) {
            console.error("Error during image processing:", error);
            setProcessedImage(null); // Clear processed image on error
        } finally {
            setIsProcessing(false); // Set processing false when done or if an error occurs
        }
    });
  }, [originalImage, filters, applyFilter]); // `processImage` is recreated if `originalImage` or `filters` change. `applyFilter` is stable.

  const updateFilter = useCallback((filterType, value) => {
    setInternalFilters(prevFilters => {
      const newNumericValue = Number(value);
      // Check if the value has actually changed to avoid unnecessary state updates
      if (prevFilters.hasOwnProperty(filterType) && prevFilters[filterType] === newNumericValue) {
        return prevFilters; // No change, return the same object reference
      }
      // Value changed, return a new object reference to trigger re-renders and effects
      return {
        ...prevFilters,
        [filterType]: newNumericValue,
      };
    });
  }, []); // `updateFilter` itself is stable.

  const resetFilters = useCallback(() => {
    setInternalFilters({ ...defaultFilters }); // Reset to defaults, creates a new object
  }, []); // `resetFilters` is stable.


  // useEffect to manage debounced image processing when originalImage or filter-dependent processImage function changes.
  useEffect(() => {
    let debounceTimerId;

    if (originalImage && originalImage.naturalWidth > 0) {
      // A valid original image is present.
      // `processImage` function reference changes if `originalImage` or `filters` state changes.
      // This effect will run, clearing any previous timer and setting a new one.
      // `isProcessing` state is managed by `processImage` itself.
      debounceTimerId = setTimeout(() => {
        processImage();
      }, 150); // Debounce duration: 150ms
    } else {
      // No valid original image, or it became invalid.
      // Clear any processed image and ensure processing state is false.
      setProcessedImage(null);
      setIsProcessing(false); 
    }
    
    return () => {
      // Cleanup function: clear the timeout if the component unmounts or dependencies change
      // before the timeout fires.
      if (debounceTimerId) {
        clearTimeout(debounceTimerId);
      }
    };
  }, [originalImage, processImage]); // Effect dependencies: `originalImage` and `processImage`.
                                     // `processImage`'s identity changes when `filters` or `originalImage` change.

  return {
    filters,        // The current filter values (memoized)
    updateFilter,   // Function to update a specific filter
    resetFilters,   // Function to reset all filters to default
    setupCanvas,    // Function to initialize with an HTMLImageElement
    processedImage, // Data URL of the image after filters are applied
    isProcessing,   // Boolean indicating if filters are currently being applied
  };
};

export default useImageFilters;