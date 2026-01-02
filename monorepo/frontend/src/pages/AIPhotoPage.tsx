import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ChevronLeft, RefreshCw, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIPhotoPage: React.FC = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Nepodařilo se spustit kameru. Zkontrolujte prosím oprávnění.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setPhoto(dataUrl);
                // Stop camera stream after taking photo to save battery/resources
                // but we might want to keep it running if we want a "retake" that is instant
                // For now, let's keep it simple and maybe pause? 
                // Actually, UX-wise, freezing the last frame is good enough, but we have the photo in state now.
            }
        }
    };

    const retakePhoto = () => {
        setPhoto(null);
        // Ensure camera is running if it was stopped (though we didn't stop it in takePhoto)
        if (!stream) {
            startCamera();
        }
    };

    const handleConfirm = () => {
        // Placeholder for future logic (AI analysis)
        alert("Fotografie uložena! (Zatím jen jako demo)");
        navigate('/ai-assistant');
    };

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header / Top Bar */}
            <div className="p-4 flex justify-between items-center z-10 sticky top-0 bg-gradient-to-b from-black/50 to-transparent">
                <Button
                    variant="secondary"
                    onClick={() => navigate('/ai-assistant')}
                    className="!p-2 bg-white/20 backdrop-blur-md border-white/10 text-white hover:bg-white/30"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-white font-medium text-lg drop-shadow-md">Vyfoťte lednici</h1>
                <div className="w-10"></div> {/* Spacer for alignment */}
            </div>

            {/* Main Camera Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900">
                {error ? (
                    <div className="text-white p-6 text-center">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Button onClick={startCamera} variant="primary">Zkusit znovu</Button>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className={`w-full h-full object-cover ${photo ? 'hidden' : 'block'}`}
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {photo && (
                            <img
                                src={photo}
                                alt="Captured fridge"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </>
                )}
            </div>

            {/* Controls / Bottom Bar */}
            <div className="p-8 pb-12 bg-black flex justify-center items-center gap-8">
                {!photo ? (
                    <button
                        onClick={takePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 focus:outline-none hover:scale-105 transition-transform"
                    >
                        <div className="w-full h-full bg-white rounded-full"></div>
                    </button>
                ) : (
                    <>
                        <Button
                            onClick={retakePhoto}
                            variant="secondary"
                            className="flex flex-col h-auto py-3 gap-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                            <RefreshCw className="w-6 h-6" />
                            <span className="text-xs">Znovu</span>
                        </Button>

                        <Button
                            onClick={handleConfirm}
                            variant="primary"
                            className="flex-1 py-4 text-lg bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                        >
                            <Check className="w-6 h-6 mr-2" />
                            Použít fotku
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
