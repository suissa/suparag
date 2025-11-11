import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { settingsAPI } from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.list();
      setSettings(response.data.settings || {});
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    try {
      await settingsAPI.update(key, value);
      alert('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
          <p className="text-gray-600 mt-1">Configure o sistema</p>
        </div>
        <button
          onClick={loadSettings}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {key.replace(/_/g, ' ').toUpperCase()}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleSave(key, settings[key])}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
