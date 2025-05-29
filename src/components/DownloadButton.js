import React, { useState } from "react";
import imageCompression from "browser-image-compression";

const DownloadButton = ({ processedImage, originalFileName = "linkedin-profile" }) => {
    const [isCompressing, setIsCompressing] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const compressImage = async (imageUrl) => {
        try {
            // Convert data URL to Blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Compression options optimized for LinkedIn profile photos
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1000,
                useWebWorker: true,
                onProgress: (progress) => {
                    setDownloadProgress(Math.round(progress * 100));
                }
            };

            // Compress the image
            const compressedBlob = await imageCompression(blob, options);
            return URL.createObjectURL(compressedBlob);
        } catch (error) {
            console.error("Error compressing image:", error);
            return imageUrl; // Fallback to original image
        }
    };

    const handleDownload = async () => {
        if (!processedImage) return;

        setIsCompressing(true);
        setDownloadProgress(0);

        try {
            // Compress the image before download
            const compressedImageUrl = await compressImage(processedImage);

            // Create download link
            const link = document.createElement("a");
            link.href = compressedImageUrl;
            link.download = `${originalFileName}-edited.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            URL.revokeObjectURL(compressedImageUrl);
        } catch (error) {
            console.error("Error during download:", error);
        } finally {
            setIsCompressing(false);
            setDownloadProgress(0);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <button
                onClick={handleDownload}
                disabled={!processedImage || isCompressing}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 ${
                    processedImage && !isCompressing
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                }`}
            >
                {isCompressing ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Optimizing... {downloadProgress}%</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><line x1="128" y1="144" x2="128" y2="32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><polyline points="216 144 216 208 40 208 40 144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><polyline points="168 104 128 144 88 104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                        <span>Download Profile Picture</span>
                    </>
                )}
            </button>

            <div className="mt-2 text-center">
                <p className="text-xs text-gray-500">
                    Your image will be optimized for LinkedIn (max 1MB)
                </p>
            </div>

            {processedImage && !isCompressing && (
                <div className="mt-4 flex items-center justify-center space-x-4">
                    <div className="text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16"><rect width="256" height="256" fill="none"/><polyline points="88 136 112 160 168 104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                        <span className="ml-1">Ready to download</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadButton;