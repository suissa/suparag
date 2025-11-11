-- Criar tabela settings
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca por data
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON public.settings(updated_at DESC);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_settings_updated_at ON public.settings;
CREATE TRIGGER trigger_update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

-- Adicionar comentários
COMMENT ON TABLE public.settings IS 'Tabela de configurações do sistema (chave-valor)';
COMMENT ON COLUMN public.settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN public.settings.value IS 'Valor da configuração';
COMMENT ON COLUMN public.settings.created_at IS 'Data de criação da configuração';
COMMENT ON COLUMN public.settings.updated_at IS 'Data da última atualização';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública
CREATE POLICY "Enable read access for all users" ON public.settings
    FOR SELECT USING (true);

-- Criar política para permitir insert/update/delete para usuários autenticados
CREATE POLICY "Enable insert for authenticated users only" ON public.settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.settings
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.settings
    FOR DELETE USING (true);

-- Inserir configurações padrão
INSERT INTO public.settings (key, value) VALUES
  ('openrouter_api_key', ''),
  ('selected_model', 'gpt-4'),
  ('system_prompt', 'Você é um assistente útil e prestativo.')
ON CONFLICT (key) DO NOTHING;
