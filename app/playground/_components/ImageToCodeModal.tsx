'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Figma,
  CheckCircle2,
  X,
  Zap,
  Sparkles,
  Code2,
} from 'lucide-react';
import {
  convertImageToCode,
  ImageToCodeResult,
} from '@/lib/imageToCodeEngine';

interface ImageToCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedCode: (htmlCode: string) => void;
}

export default function ImageToCodeModal({
  isOpen,
  onClose,
  onApplyGeneratedCode,
}: ImageToCodeModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ImageToCodeResult | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConvert = async () => {
    if (!selectedImage && !figmaUrl) return;
    setIsConverting(true);
    const res = await convertImageToCode(selectedImage || '', figmaUrl);
    setResult(res);
    setIsConverting(false);
  };

  const handleApply = () => {
    if (result?.generatedHtml) {
      onApplyGeneratedCode(result.generatedHtml);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                AI Screenshot & Figma Image-to-Code Converter
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  Phase 19
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload UI screenshots or Figma design links to convert visuals into Tailwind CSS HTML.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 p-6 gap-6">
          {/* Left Column: Image Upload & Figma Input */}
          <div className="space-y-4 overflow-y-auto pr-2">
            {/* Upload Area */}
            <div className="p-6 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-center space-y-3 transition">
              {selectedImage ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Uploaded Mockup"
                    className="max-h-44 mx-auto rounded-lg border border-slate-800 object-contain"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Upload Screenshot Image</p>
                    <p className="text-[11px] text-slate-500">PNG, JPG, or WebP up to 10MB</p>
                  </div>
                  <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-200 font-medium rounded-xl cursor-pointer transition">
                    Browse File
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </>
              )}
            </div>

            {/* Figma Link Input */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Figma className="w-4 h-4 text-purple-400" /> Or Import from Figma URL
              </label>
              <input
                type="text"
                placeholder="https://figma.com/file/..."
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleConvert}
              disabled={isConverting || (!selectedImage && !figmaUrl)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isConverting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isConverting ? 'Analyzing Visual Layout...' : 'Convert Image to Code'}
            </button>
          </div>

          {/* Right Column: Code Output Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
            {result ? (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">Conversion Complete ({result.confidenceScore}% Match)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    {result.detectedLayout}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block">Extracted UI Components:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.extractedComponents.map((comp, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block">Generated Tailwind HTML Code:</span>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-56">
                    {result.generatedHtml}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
                <Code2 className="w-8 h-8 text-slate-700" />
                <p className="text-xs font-medium">No code generated yet.</p>
                <p className="text-[11px] max-w-xs">Upload a screenshot or Figma URL on the left and click &apos;Convert Image to Code&apos;.</p>
              </div>
            )}

            {result && (
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4" /> Insert Code into Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
