import React, { useState, useEffect } from 'react';
import type { AspectRatio } from '../../types';
import { generateImage, editImage, generateVideo } from '../../services/geminiService';
import { FileUploader } from '../ui/FileUploader';
import { Loader } from '../ui/Loader';

// Fix: Removed conflicting global declaration for `window.aistudio`.
// The type is expected to be provided by the ambient environment, and redeclaring it
// caused a type mismatch error.

export const CreativeSuiteDemo: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageFile, setImageFile] = useState<{ file: File, dataUrl: string } | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'gen_img' | 'edit_img' | 'gen_vid'>('gen_img');

    const [hasVeoApiKey, setHasVeoApiKey] = useState(false);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasVeoApiKey(hasKey);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectVeoKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setHasVeoApiKey(true); // Assume success to avoid race condition
        }
    };

    const handleFileSelect = (file: File, fileDataUrl: string) => {
        setImageFile({ file, dataUrl: fileDataUrl });
        setResult(null); // Clear previous result
    };
    
    const handleSubmit = async () => {
        if (!prompt && (mode !== 'gen_vid' || !imageFile)) {
             setError('A text prompt is required.');
             return;
        }
        if ((mode === 'edit_img' || (mode === 'gen_vid' && imageFile)) && !imageFile) {
            setError('Please upload an image for this operation.');
            return;
        }

        setIsLoading(true);
        setResult(null);
        setError(null);
        setLoadingMessage('Warming up the creative circuits...');

        try {
            let res;
            if (mode === 'gen_img') {
                setLoadingMessage('Generating your masterpiece...');
                res = await generateImage(prompt, aspectRatio);
            } else if (mode === 'edit_img') {
                setLoadingMessage('Applying your edits...');
                res = await editImage(prompt, imageFile!.file);
            } else if (mode === 'gen_vid') {
                if (!hasVeoApiKey) {
                    setError("Please select an API key for video generation.");
                    setIsLoading(false);
                    return;
                }
                setLoadingMessage('Animating your vision... This can take a few minutes.');
                res = await generateVideo(prompt, imageFile ? imageFile.file : null);
            }
            setResult(res || null);
        } catch (err: any) {
            console.error('Creative Suite Error:', err);
            setError(err.message || 'An unknown error occurred.');
            if (err.message.includes('Requested entity was not found')) {
                setError('API Key error. Please re-select your key.');
                setHasVeoApiKey(false);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const renderResult = () => {
        if (isLoading) return <Loader text={loadingMessage} />;
        if (error) return <p className="text-red-400 text-center">{error}</p>;
        if (!result) {
            if (mode === 'edit_img' && imageFile) {
                return <img src={imageFile.dataUrl} alt="Uploaded preview" className="rounded-lg max-h-80 mx-auto" />;
            }
             if (mode === 'gen_vid' && imageFile) {
                return <img src={imageFile.dataUrl} alt="Uploaded preview" className="rounded-lg max-h-80 mx-auto" />;
            }
            return <div className="text-center text-gray-500">Your creation will appear here.</div>;
        }
        if (mode === 'gen_vid') {
            return <video src={result} controls autoPlay loop className="rounded-lg w-full max-h-96" />;
        }
        return <img src={result} alt="Generated result" className="rounded-lg max-h-96 mx-auto" />;
    };

    const renderVeoKeyButton = () => {
        if (mode !== 'gen_vid') return null;
        if (hasVeoApiKey) {
            return <div className="text-center text-sm text-green-400">Veo API Key is ready. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">Billing info</a>.</div>;
        }
        return (
            <div className="text-center">
                <button onClick={handleSelectVeoKey} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded">
                    Select Veo API Key to Continue
                </button>
                 <p className="text-xs text-gray-400 mt-2">Video generation requires a user-selected API key. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">Billing applies</a>.</p>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
                 <div className="flex bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setMode('gen_img')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition ${mode === 'gen_img' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`}>Image Gen</button>
                    <button onClick={() => setMode('edit_img')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition ${mode === 'edit_img' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`}>Image Edit</button>
                    <button onClick={() => setMode('gen_vid')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition ${mode === 'gen_vid' ? 'bg-indigo-600' : 'hover:bg-gray-600'}`}>Video Gen</button>
                </div>

                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                        mode === 'gen_img' ? 'e.g., A futuristic city skyline at dusk, cyberpunk style' :
                        mode === 'edit_img' ? 'e.g., Add a retro filter, make it black and white' :
                        'e.g., A robot holding a red skateboard'
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 h-28 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />

                {mode === 'gen_img' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                        <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                         className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition">
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Widescreen)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="4:3">4:3 (Landscape)</option>
                            <option value="3:4">3:4 (Tall)</option>
                        </select>
                    </div>
                )}
                
                {(mode === 'edit_img' || mode === 'gen_vid') && (
                     <FileUploader onFileSelect={handleFileSelect} accept="image/*" label={ mode === 'edit_img' ? "Upload Image to Edit" : "Upload Starting Image (Optional)"} />
                )}

                {renderVeoKeyButton()}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || (mode === 'gen_vid' && !hasVeoApiKey)}
                    className="w-full bg-indigo-600 text-white font-semibold px-5 py-3 rounded-lg hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
                >
                    {isLoading ? 'Creating...' : 'Generate'}
                </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center min-h-[300px] lg:min-h-full">
                {renderResult()}
            </div>
        </div>
    );
};