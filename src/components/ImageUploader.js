import React, { useState, useRef, useCallback, useEffect } from "react";

const ImageUploader = ({ onImageUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const debounceTimeoutRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return; // Important to prevent default to allow drop
    };

    const validateFile = (file) => {
        if (!file) {
            setError("No file selected.");
            return false;
        }
        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            setError("Invalid file type. Please upload a JPG, JPEG, or PNG image.");
            return false;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError("Image size is too large. Please upload an image smaller than 10MB.");
            return false;
        }
        return true;
    };

    const processFile = useCallback((file) => {
        if (isLoading) {
            // Optionally, provide feedback that an upload is in progress
            // For now, just preventing multiple concurrent uploads from this instance
            return;
        }

        if (!validateFile(file)) {
            if (fileInputRef.current) {
                fileInputRef.current.value = null; // Allow re-selection of the same file after error
            }
            return; 
        }

        setIsLoading(true);
        setError(""); 

        const reader = new FileReader();

        reader.onload = (e) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = setTimeout(() => {
                if (onImageUpload && typeof onImageUpload === "function") {
                    onImageUpload(e.target.result, file.name);
                }
                setIsLoading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                }
            }, 300); // Debounce duration: 300ms
        };

        reader.onerror = () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            setError("Failed to read the file. It might be corrupted or an unsupported format. Please try a different file.");
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        };

        reader.onabort = () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            setError("File reading was aborted. Please try again.");
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        };
        
        try {
            reader.readAsDataURL(file);
        } catch (err) {
             if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            setError("An unexpected error occurred while trying to read the file. Please ensure the file is valid.");
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
            console.error("Error during readAsDataURL:", err);
        }

    }, [isLoading, onImageUpload]);

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        setIsDragging(false);
        
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        } else {
            setError("No file was dropped or the file could not be accessed.");
        }
    };

    const handleFileInput = (e) => {
        if (isLoading) return;
        const file = e.target.files && e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const handleClick = () => {
        if (isLoading) return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    useEffect(() => {
        // Cleanup debounce timer on component unmount
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="w-full max-w-xl mx-auto p-6">
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                    ${isLoading ? "cursor-wait bg-gray-100 border-gray-300" : 
                    isDragging ? "border-blue-500 bg-blue-50 cursor-copy" : 
                    "border-gray-300 hover:border-gray-400 bg-white cursor-pointer"}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
                role="button"
                tabIndex={isLoading ? -1 : 0}
                aria-disabled={isLoading}
                onKeyDown={(e) => { if (!isLoading && (e.key === "Enter" || e.key === " ")) handleClick();}}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileInput}
                    disabled={isLoading}
                />
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                        <p className="text-lg font-semibold text-gray-700">Processing Image...</p>
                        <p className="text-sm text-gray-500">Please wait a moment.</p>
                    </div>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="48" height="48"><rect width="256" height="256" fill="none"/><path d="M100,208H72A56,56,0,1,1,85.92,97.74" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><polyline points="124 160 156 128 188 160" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="156" y1="208" x2="156" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M80,128a80,80,0,1,1,156,25.05" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                        <h3 className="mt-4 text-lg font-semibold text-gray-700">
                            Drop your image here
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            or click to select a file
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                            Supports: JPG, PNG (max 10MB)
                        </p>
                    </>
                )}
                
                {error && !isLoading && (
                    <div className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-300">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUploader;