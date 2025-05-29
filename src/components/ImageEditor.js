import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

const ImageEditor = ({ 
    imageUrl, 
    processedImageUrl, 
    onImageCropped, 
    isFilterProcessing 
}) => {
  const [cropperInstance, setCropperInstance] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(NaN); // Default to free aspect ratio
  const [zoomLevel, setZoomLevel] = useState(0.1); 
  const [isCropperReady, setIsCropperReady] = useState(false);
  const cropperRef = useRef(null);

  useEffect(() => {
    if (imageUrl) {
      setIsCropping(false); 
      setIsCropperReady(false); 
      setCropperInstance(null);
      // Optionally reset aspect ratio and zoom on new image
      // setAspectRatio(NaN); 
      // setZoomLevel(0.1); 
    } else {
      setIsCropping(false);
      setIsCropperReady(false);
      setCropperInstance(null);
    }
  }, [imageUrl]);

  const handleCropChange = () => {
    if (!imageUrl) return;
    setIsCropping(true);
  };

  const handleZoomInput = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoomLevel(newZoom);
    if (cropperInstance) {
      cropperInstance.zoomTo(newZoom);
    }
  };
  
  const onCropperInitialized = useCallback(() => {
    if (cropperRef.current && cropperRef.current.cropper) {
      const cropper = cropperRef.current.cropper;
      setCropperInstance(cropper);
      cropper.setAspectRatio(aspectRatio);
      cropper.zoomTo(zoomLevel);
      setIsCropperReady(true);
    }
  }, [aspectRatio, zoomLevel]); 

  const applyCrop = useCallback(() => {
    if (!cropperInstance) return;

    const croppedCanvas = cropperInstance.getCroppedCanvas({
      minWidth: 200, 
      minHeight: 200,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });
    
    if (croppedCanvas) {
      const newCroppedImageUrl = croppedCanvas.toDataURL("image/jpeg", 0.92); 
      if (typeof onImageCropped === "function") {
        onImageCropped(newCroppedImageUrl); 
      }
    }
    setIsCropping(false);
  }, [cropperInstance, onImageCropped]);

  const cancelCrop = () => {
    setIsCropping(false);
  };

  const changeAspectRatio = (newRatio) => {
    setAspectRatio(newRatio); 
    if (cropperInstance) {
      cropperInstance.setAspectRatio(newRatio);
    }
  };

  const displayedImageWhenNotCropping = useMemo(() => {
    if (!imageUrl) return null;
    const srcToShow = processedImageUrl || imageUrl;
    return (
      <img 
        src={srcToShow} 
        alt="Photo preview" 
        className="max-h-full max-w-full rounded shadow-sm object-contain"
        style={{ maxHeight: "450px" }}
      />
    );
  }, [imageUrl, processedImageUrl]);

  const showPreviewLoader = !isCropping && isFilterProcessing && imageUrl;

  // Helper to check if a number is NaN for styling active button
  const isNaNValue = (val) => typeof val === "number" && isNaN(val);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Edit Your Photo</h2>
        <p className="text-sm text-gray-600">
          Crop and adjust your photo using the tools below.
        </p>
      </div>

      <div 
        className="relative border rounded-lg overflow-hidden bg-gray-100 mb-4 flex items-center justify-center" 
        style={{ minHeight: "300px", maxHeight: "500px" }}
      >
        {!imageUrl && !isCropping && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="48" height="48"><rect width="256" height="256" fill="none"/><rect x="32" y="48" width="192" height="160" rx="16" transform="translate(256) rotate(90)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><circle cx="128" cy="76" r="16"/></svg>
            <p className="mt-4 text-gray-500">Upload a photo to start editing</p>
          </div>
        )}

        {imageUrl && isCropping && (
          <div className="w-full h-full">
            {!isCropperReady && (
                 <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                 </div>
            )}
            <Cropper
              ref={cropperRef}
              src={imageUrl}
              style={{ height: "100%", width: "100%", visibility: isCropperReady ? "visible" : "hidden" }}
              initialAspectRatio={aspectRatio} 
              guides={true}
              viewMode={1}
              dragMode="move"
              background={false}
              responsive={true}
              autoCropArea={0.8}
              checkOrientation={false}
              movable={true}
              zoomable={true}
              zoomOnWheel={true}
              zoomOnTouch={true}
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
              ready={onCropperInitialized}
            />
            {isCropperReady && (
                <div className="p-4 bg-gray-50 border-t flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2"> 
                      <span className="text-xs text-gray-500 mr-1">Aspect:</span>
                      <button onClick={() => changeAspectRatio(NaN)} className={`px-3 py-1 text-xs rounded-full ${isNaNValue(aspectRatio) ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>Free</button>
                      <button onClick={() => changeAspectRatio(1)} className={`px-3 py-1 text-xs rounded-full ${aspectRatio === 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>1:1</button>
                      <button onClick={() => changeAspectRatio(4/3)} className={`px-3 py-1 text-xs rounded-full ${aspectRatio === 4/3 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>4:3</button>
                      <button onClick={() => changeAspectRatio(16/9)} className={`px-3 py-1 text-xs rounded-full ${aspectRatio === 16/9 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>16:9</button>
                    </div>

                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Zoom</span>
                      <input type="range" min="0.01" max="3" step="0.01" value={zoomLevel} onChange={handleZoomInput} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                    </div>

                    <div className="flex space-x-2 ml-auto">
                      <button onClick={cancelCrop} className="px-4 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100">Cancel</button>
                      <button onClick={applyCrop} className="px-4 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Apply Crop</button>
                    </div>
                </div>
            )}
          </div>
        )}

        {imageUrl && !isCropping && (
          <div className="relative flex justify-center items-center w-full h-full p-2">
            {displayedImageWhenNotCropping}
            {showPreviewLoader && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-lg z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {imageUrl && !isCropping && (
        <div className="flex flex-wrap items-center justify-start gap-2 mt-4">
          <button
            onClick={handleCropChange}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-sm transition-colors"
            disabled={isCropping || isFilterProcessing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16"><rect width="256" height="256" fill="none"/><polyline points="64 24 64 192 232 192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="24" y1="64" x2="64" y2="64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><polyline points="104 64 192 64 192 152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="192" y1="192" x2="192" y2="232" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
            <span className="ml-2">Crop Photo</span>
          </button>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Tip: Use the crop tool to focus on the most important part of your image. Adjust filters for desired effects.
        </p>
      </div>
    </div>
  );
};

export default ImageEditor;