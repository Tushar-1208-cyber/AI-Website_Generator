import React from 'react'
import { Settings2, Palette, Bot, Monitor, X } from 'lucide-react'

interface SettingsProps {
  selectedModel?: string
  onSelectModel?: (model: string) => void
  selectedTheme?: string
  onSelectTheme?: (theme: string) => void
  model?: string
  onModelChange?: (model: string) => void
  theme?: string
  onThemeChange?: (theme: string) => void
  onClose?: () => void
}

const AI_MODELS = [
  { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', desc: 'Ultra Fast & High Performance (Default)' },
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', desc: 'Low Latency & High Stability' },
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', desc: 'Lightweight & High Availability' },
]

const COLOR_THEMES = [
  { value: 'blue', label: 'Blue', color: '#3B82F6' },
  { value: 'purple', label: 'Purple', color: '#8B5CF6' },
  { value: 'green', label: 'Green', color: '#10B981' },
  { value: 'red', label: 'Red', color: '#EF4444' },
  { value: 'orange', label: 'Orange', color: '#F97316' },
  { value: 'pink', label: 'Pink', color: '#EC4899' },
]

function Settings({
  selectedModel,
  onSelectModel,
  selectedTheme,
  onSelectTheme,
  model = 'gemini-3.6-flash',
  onModelChange,
  theme = 'blue',
  onThemeChange,
  onClose,
}: SettingsProps) {
  const currentModel = selectedModel || model;
  const currentTheme = selectedTheme || theme;

  const handleModelSelect = (val: string) => {
    if (onSelectModel) onSelectModel(val);
    if (onModelChange) onModelChange(val);
  };

  const handleThemeSelect = (val: string) => {
    if (onSelectTheme) onSelectTheme(val);
    if (onThemeChange) onThemeChange(val);
  };

  return (
    <div className='p-5 w-80 shadow h-[90vh] overflow-y-auto border-r bg-white absolute right-0 top-14 z-50'>

      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-2'>
          <Settings2 className='size-5 text-gray-600' />
          <h2 className='font-semibold text-gray-800 text-lg'>Settings</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className='p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition'
          >
            <X className='size-5' />
          </button>
        )}
      </div>

      {/* AI Model Selection */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 mb-3'>
          <Bot className='size-4 text-gray-500' />
          <h3 className='font-medium text-sm text-gray-700'>AI Model</h3>
        </div>
        <div className='flex flex-col gap-2'>
          {AI_MODELS.map((m) => (
            <button
              key={m.value}
              onClick={() => handleModelSelect(m.value)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                currentModel === m.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className='font-medium'>{m.label}</div>
              <div className='text-xs text-gray-400 mt-0.5'>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Theme */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 mb-3'>
          <Palette className='size-4 text-gray-500' />
          <h3 className='font-medium text-sm text-gray-700'>Primary Color Theme</h3>
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {COLOR_THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleThemeSelect(t.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                currentTheme === t.value
                  ? 'border-gray-800 bg-gray-50 font-semibold'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className='size-3 rounded-full shrink-0'
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Mode */}
      <div className='mb-6'>
        <div className='flex items-center gap-2 mb-3'>
          <Monitor className='size-4 text-gray-500' />
          <h3 className='font-medium text-sm text-gray-700'>Preview Mode</h3>
        </div>
        <div className='flex gap-2'>
          {['Desktop', 'Tablet', 'Mobile'].map((mode) => (
            <button
              key={mode}
              className='flex-1 py-2 rounded-lg border border-gray-200 text-xs hover:border-gray-400 transition-all text-gray-600'
            >
              {mode}
            </button>
          ))}
        </div>
        <p className='text-xs text-gray-400 mt-2'>Coming soon — preview at different screen sizes</p>
      </div>

      {/* Info Box */}
      <div className='bg-blue-50 rounded-lg p-3 border border-blue-100'>
        <p className='text-xs text-blue-700 font-medium'>💡 Tip</p>
        <p className='text-xs text-blue-600 mt-1'>
          Select a color theme and AI model before generating. The AI will use your theme color.
        </p>
      </div>
    </div>
  )
}

export default Settings
