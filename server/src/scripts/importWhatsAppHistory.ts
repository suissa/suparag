import { createClient } from '@supabase/supabase-js';
import { readJsonFiles } from '../utils/files';
import { generateRealEmbedding, generateSyntheticEmbedding } from '../utils/embeddings';
import { analyzeSentiment } from '../utils/sentiment';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface WhatsAppMessage {
  from: string;
  text: string;
  timestamp: string;
}

interface WhatsAppHistory {
  phone: string;
  messages: WhatsAppMessage[];
}

interface MappingFunction {
  (fields: any): {
    phone: string;
    message: string;
    timestamp: string;
    from: string;
  };
}

export async function importWhatsAppHistory(
  folderPath: string,
  mappingFn: MappingFunction
) {
  console.log(`📂 Iniciando importação de históricos do WhatsApp de: ${folderPath}`);
  
  try {
    // 1. Ler todos os arquivos JSON do diretório
    const files = await readJsonFiles(folderPath);
    console.log(`📄 Encontrados ${files.length} arquivos para processar`);

    let totalMessages = 0;
    let totalCustomers = 0;
    let errors = 0;

    // 2. Processar cada arquivo
    for (const fileData of files) {
      try {
        const history: WhatsAppHistory = fileData.data;
        const phone = history.phone;

        console.log(`\n📱 Processando histórico do telefone: ${phone}`);

        // 3. Verificar/criar cliente
        let customer = await findOrCreateCustomer(phone);
        if (!customer) {
          console.error(`❌ Erro ao criar/buscar cliente: ${phone}`);
          errors++;
          continue;
        }

        totalCustomers++;

        // 4. Processar mensagens
        const interactions = [];
        for (const msg of history.messages) {
          try {
            // Aplicar função de mapeamento
            const mapped = mappingFn({
              phone: history.phone,
              from: msg.from,
              text: msg.text,
              timestamp: msg.timestamp
            });

            // Gerar embedding real (com fallback para sintético)
            const embedding = await generateRealEmbedding(mapped.message);

            // Analisar sentimento
            const sentiment = analyzeSentiment(mapped.message);

            interactions.push({
              customer_id: customer.id,
              channel: 'whatsapp',
              content: mapped.message,
              sentiment: sentiment,
              embedding: embedding,
              created_at: mapped.timestamp,
              metadata: {
                from: mapped.from,
                phone: mapped.phone
              }
            });

            totalMessages++;
          } catch (msgError) {
            console.error(`❌ Erro ao processar mensagem:`, msgError);
            errors++;
          }
        }

        // 5. Inserir interações em batch
        if (interactions.length > 0) {
          const { error } = await supabase
            .from('interactions')
            .insert(interactions);

          if (error) {
            console.error(`❌ Erro ao inserir interações para ${phone}:`, error);
            errors++;
          } else {
            console.log(`✅ ${interactions.length} mensagens importadas para ${phone}`);
          }
        }

      } catch (fileError) {
        console.error(`❌ Erro ao processar arquivo:`, fileError);
        errors++;
      }
    }

    // 6. Log final
    console.log(`\n📊 Importação concluída!`);
    console.log(`✅ Total de clientes processados: ${totalCustomers}`);
    console.log(`✅ Total de mensagens importadas: ${totalMessages}`);
    console.log(`❌ Total de erros: ${errors}`);

    return {
      success: true,
      totalCustomers,
      totalMessages,
      errors
    };

  } catch (error) {
    console.error('❌ Erro fatal na importação:', error);
    throw error;
  }
}

async function findOrCreateCustomer(phone: string) {
  try {
    // Buscar cliente existente
    const { data: existing, error: searchError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existing) {
      console.log(`👤 Cliente encontrado: ${phone}`);
      return existing;
    }

    // Criar novo cliente
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        name: `Cliente ${phone}`,
        phone: phone,
        email: `${phone}@whatsapp.temp`,
        company: 'WhatsApp Import',
        position: 'Lead'
      })
      .select()
      .single();

    if (createError) {
      console.error(`❌ Erro ao criar cliente ${phone}:`, createError);
      return null;
    }

    console.log(`✨ Novo cliente criado: ${phone}`);
    return newCustomer;

  } catch (error) {
    console.error(`❌ Erro ao buscar/criar cliente:`, error);
    return null;
  }
}
