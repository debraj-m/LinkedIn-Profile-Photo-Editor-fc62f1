import React, { useState, useCallback, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageEditor from "./components/ImageEditor";
import FilterControls from "./components/FilterControls";
import DownloadButton from "./components/DownloadButton";
import useImageFilters from "./hooks/useImageFilters"; 

// Simple ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 my-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md">
          <h2 className="text-lg font-semibold">Oops! Something went wrong.</h2>
          <p className="mt-2">
            We encountered an issue. Please try refreshing the page or using a different image.
          </p>
          {process.env.NODE_ENV === "development" && this.state.errorInfo && (
            <details className="mt-2 text-sm whitespace-pre-wrap">
              <summary>Error Details (Development Only)</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}


const App = () => {
    // `sourceImage` is the original uploaded image (Data URL)
    const [sourceImage, setSourceImage] = useState(null);
    const [originalFileName, setOriginalFileName] = useState("");
    
    // `imageForFiltering` is the image (Data URL) that filters should be applied to.
    // This could be the `sourceImage` or a cropped version of it.
    const [imageForFiltering, setImageForFiltering] = useState(null);

    // State to track if the underlying HTMLImageElement for `imageForFiltering` is loading.
    const [isBaseImageElementLoading, setIsBaseImageElementLoading] = useState(false);

    const {
        filters,             // Current filter values from the hook
        updateFilter,        // Function to update a specific filter
        resetFilters,        // Function to reset all filters
        setupCanvas,         // Function to provide an HTMLImageElement to the hook
        processedImage,      // Data URL of the image after filters are applied by the hook
        isProcessing: isFilterProcessing // Boolean indicating if filters are currently being applied by the hook
    } = useImageFilters();

    // Effect to load `imageForFiltering` into an HTMLImageElement and then pass it to `useImageFilters` via `setupCanvas`.
    useEffect(() => {
        let didCancel = false;
        if (imageForFiltering) {
            setIsBaseImageElementLoading(true);
            const img = new Image();
            img.onload = () => {
                if (!didCancel) {
                    setupCanvas(img); // Provide the loaded image element to the filter hook
                    setIsBaseImageElementLoading(false);
                }
            };
            img.onerror = () => {
                if (!didCancel) {
                    console.error("Failed to load image for filtering.");
                    setupCanvas(null); // Clear canvas in hook if image load fails
                    setIsBaseImageElementLoading(false);
                    // Optionally, set an app-level error state here
                }
            };
            img.src = imageForFiltering;

            return () => { // Cleanup
                didCancel = true;
                img.onload = null;
                img.onerror = null;
            };
        } else {
            setupCanvas(null); // No image for filtering, so clear canvas in hook
            setIsBaseImageElementLoading(false); // Ensure loading state is reset
        }
        return () => { didCancel = true; }; // General cleanup for the effect itself
    }, [imageForFiltering, setupCanvas]); // Re-run when imageForFiltering or setupCanvas changes


    const handleImageUpload = useCallback((imageDataUrl, fileName = "") => {
        setSourceImage(imageDataUrl);          // This is the image given to Cropper
        setImageForFiltering(imageDataUrl);    // Initially, the uploaded image is also the one to filter
        setOriginalFileName(fileName || "edited-photo"); // Provide a generic fallback
        resetFilters(); // Reset filters when a new image is uploaded
    }, [resetFilters]);

    // Callback from ImageEditor when a crop is applied.
    // `croppedImageDataUrl` is the Data URL of the newly cropped image.
    const handleImageCropped = useCallback((croppedImageDataUrl) => {
        setImageForFiltering(croppedImageDataUrl); // Set the cropped image as the new base for filters.
                                                 // The useEffect above will then call setupCanvas with this.
    }, []);
    
    // Overall loading state for the main editor and filter controls area.
    // Show loader if the base image for filtering is loading OR if filters are being processed.
    const isEditingAreaLoading = isBaseImageElementLoading || isFilterProcessing;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <header className="max-w-4xl mx-auto text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="48" height="48"><rect width="256" height="256" fill="none"/><path d="M128,128V24a64,64,0,0,1,50,104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M128,128H24A64,64,0,0,1,128,78" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M128,128V232A64,64,0,0,1,78,128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M128,128H232a64,64,0,0,1-104,50" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Online Photo Editor
                </h1>
                <p className="text-lg text-gray-600">
                    Easily edit, enhance, and transform your photos
                </p>
            </header>

            <main className="max-w-6xl mx-auto">
                {!sourceImage ? ( // If no source image uploaded yet, show uploader
                    <ImageUploader onImageUpload={handleImageUpload} />
                ) : (
                    <ErrorBoundary>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left/Main Column: Editor */}
                            <div className="lg:col-span-2">
                                <ImageEditor
                                    imageUrl={sourceImage} // Image for Cropper to use (original or last explicitly set one)
                                    processedImageUrl={processedImage} // Final filtered image from hook, for display when not cropping
                                    onImageCropped={handleImageCropped} // Callback after crop is applied
                                    isFilterProcessing={isFilterProcessing} // Pass down filter processing state
                                />
                            </div>

                            {/* Right Column: Controls and Download */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Only show FilterControls and DownloadButton if there's an image active for filtering */}
                                {imageForFiltering && ( 
                                    <>
                                    <FilterControls
                                        filters={filters} // Current filter values from the hook
                                        onUpdateFilter={updateFilter} // Function to update a filter
                                        onResetFilters={resetFilters} // Function to reset all filters
                                        disabled={isEditingAreaLoading} // Disable controls if base image loading or filters processing
                                    />
                                    <DownloadButton
                                        processedImage={processedImage} // Final image from the hook to download
                                        originalFileName={originalFileName || "edited-photo"} // Ensure generic fallback
                                        disabled={isEditingAreaLoading || !processedImage} // Disable if loading or no processed image
                                    />
                                    </>
                                )}
                                 {isEditingAreaLoading && imageForFiltering && ( // Show a loader if controls are disabled due to loading
                                    <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow text-gray-500">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                                        Processing...
                                    </div>
                                )}
                            </div>
                        </div>
                    </ErrorBoundary>
                )}

                {!sourceImage && ( // Show tips section if no image is uploaded yet
                     <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Tips for Enhancing Your Photos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-start space-x-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><rect width="256" height="256" fill="none"/><line x1="88" y1="232" x2="168" y2="232" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><path d="M78.7,167A79.87,79.87,0,0,1,48,104.45C47.76,61.09,82.72,25,126.07,24a80,80,0,0,1,51.34,142.9A24.3,24.3,0,0,0,168,186v2a8,8,0,0,1-8,8H96a8,8,0,0,1-8-8v-2A24.11,24.11,0,0,0,78.7,167Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><path d="M140,70a36.39,36.39,0,0,1,24,30" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
                                <div>
                                    <h3 className="font-medium text-gray-900">Good Lighting</h3>
                                    <p className="text-sm text-gray-600">Use natural light or face a window for even illumination.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><rect width="256" height="256" fill="none"/><line x1="128" y1="104" x2="128" y2="168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="96" y1="136" x2="160" y2="136" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M80,64,93.63,43.56A8,8,0,0,1,100.28,40h55.44a8,8,0,0,1,6.65,3.56L176,64h32a16,16,0,0,1,16,16V192a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V80A16,16,0,0,1,48,64Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                                <div>
                                    <h3 className="font-medium text-gray-900">Focus on Subject</h3>
                                    <p className="text-sm text-gray-600">Ensure your main subject is clear and well-defined in the photo.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><rect width="256" height="256" fill="none"/><rect x="48" y="48" width="160" height="160" rx="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="128" y1="48" x2="128" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="48" y1="128" x2="208" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                                <div>
                                    <h3 className="font-medium text-gray-900">Good Composition</h3>
                                    <p className="text-sm text-gray-600">Apply rules like the rule of thirds for a balanced image.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-12 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Online Photo Editor. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;