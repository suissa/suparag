import { useState, useEffect } from 'react';
import { Save, Key, Brain, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { settingsAPI } from '../services/api';

interface SettingsState {
  openrouter_api_key: string;
  model: string;
  system_prompt: string;
}

const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.5 Flash Lite Preview', provider: 'Google' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', provider: 'Meta' },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B', provider: 'Meta' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral AI' },
];

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge base. 
Answer questions based on the provided context from documents.
If you don't know the answer, say so clearly.
Always cite the source documents when possible.`;

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    openrouter_api_key: '',
    model: 'openai/gpt-4-turbo',
    system_prompt: DEFAULT_SYSTEM_PROMPT,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.list();
      const loadedSettings = response.data.settings || {};
      
      setSettings({
        openrouter_api_key: loadedSettings.openrouter_api_key || '',
        model: loadedSettings.model || 'openai/gpt-4-turbo',
        system_prompt: loadedSettings.system_prompt || DEFAULT_SYSTEM_PROMPT,
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      // Salvar todas as configurações
      await Promise.all([
        settingsAPI.update('openrouter_api_key', settings.openrouter_api_key),
        settingsAPI.update('model', settings.model),
        settingsAPI.update('system_prompt', settings.system_prompt),
      ]);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
            RAG Configuration
          </h1>
          <p className="text-gray-500 dark:text-[#92b7c9] text-base font-normal leading-normal mt-2">
            Configure your AI model and system settings
          </p>
        </div>

        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            saveStatus === 'success' 
              ? 'bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30' 
              : 'bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30'
          }`}>
            {saveStatus === 'success' ? (
              <>
                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                <p className="text-green-800 dark:text-green-300 font-medium">
                  Settings saved successfully!
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                <p className="text-red-800 dark:text-red-300 font-medium">
                  Failed to save settings. Please try again.
                </p>
              </>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* API Key Section */}
          <div className="bg-white dark:bg-[#111c22] rounded-lg border border-gray-200 dark:border-[#325567] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Key className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-white text-lg font-bold">OpenRouter API Key</h2>
                <p className="text-gray-500 dark:text-[#92b7c9] text-sm">
                  Get your API key from{' '}
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    openrouter.ai/keys
                  </a>
                </p>
              </div>
            </div>
            <input
              type="password"
              value={settings.openrouter_api_key}
              onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#233c48] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Model Selection */}
          <div className="bg-white dark:bg-[#111c22] rounded-lg border border-gray-200 dark:border-[#325567] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Brain className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-white text-lg font-bold">AI Model</h2>
                <p className="text-gray-500 dark:text-[#92b7c9] text-sm">
                  Choose the language model for RAG responses
                </p>
              </div>
            </div>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#233c48] text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt */}
          <div className="bg-white dark:bg-[#111c22] rounded-lg border border-gray-200 dark:border-[#325567] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 dark:bg-primary/20">
                <MessageSquare className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-white text-lg font-bold">System Prompt</h2>
                <p className="text-gray-500 dark:text-[#92b7c9] text-sm">
                  Define how the AI should behave and respond
                </p>
              </div>
            </div>
            <textarea
              value={settings.system_prompt}
              onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#233c48] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-sm"
              placeholder="Enter your system prompt..."
            />
            <button
              onClick={() => setSettings({ ...settings, system_prompt: DEFAULT_SYSTEM_PROMPT })}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Reset to default
            </button>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition-colors"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
