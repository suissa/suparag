#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { supabase } from '../src/config/supabase';

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verificar se as variáveis essenciais estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

// Dados sintéticos para seeds (SEM áudio real)
const VOICE_TYPES = ['male', 'female', 'neutral'];
const VOICE_IDS = ['21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld', 'EXAVITQu4vr4xnSDxMaL'];
const SAMPLE_TEXTS = [
  'Olá, como posso ajudá-lo hoje?',
  'Esta é uma resposta sobre o produto X.',
  'Vou verificar isso para você.',
  'Obrigado por entrar em contato.',
  'Posso fornecer mais informações sobre isso.'
];

const SAMPLE_TRANSCRIPTS = [
  'Olá, como posso ajudá-lo hoje?',
  'Esta é uma resposta sobre o produto X.',
  'Vou verificar isso para você.',
  'Obrigado por entrar em contato.',
  'Posso fornecer mais informações sobre isso.'
];

/**
 * Limpa dados de áudio (apenas para desenvolvimento)
 */
async function cleanAudioData() {
  console.log('🧹 Limpando dados de áudio...');

  try {
    // Deletar em ordem para respeitar foreign keys
    await supabase.from('chart_explanations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('audio_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('interactions').update({ 
      transcript: null, 
      audio_path: null, 
      audio_duration: null, 
      transcript_confidence: null, 
      is_audio: false 
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Limpar campos de áudio dos customers
    await supabase.from('customers').update({
      preferred_voice_type: null,
      preferred_voice_id: null,
      wants_audio_summary: 'no',
      wants_summary_format: 'text',
      incoming_audio_behavior: 'transcribe',
      outgoing_preference: 'text',
      persona_voice_profile: null
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ Dados de áudio limpos com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao limpar dados:', error.message);
    throw error;
  }
}

/**
 * Cria customers com preferências de áudio
 */
async function seedCustomers() {
  console.log('👥 Criando customers com preferências de áudio...');

  try {
    // Buscar customers existentes
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!existingCustomers || existingCustomers.length === 0) {
      console.log('⚠️  Nenhum customer encontrado. Criando customers básicos...');
      // Criar alguns customers básicos
      const newCustomers = [];
      for (let i = 0; i < 10; i++) {
        newCustomers.push({
          name: `Customer Audio ${i + 1}`,
          email: `customer.audio${i + 1}@example.com`,
          phone: `+551199999${String(i).padStart(4, '0')}`
        });
      }

      const { data: created, error: createError } = await supabase
        .from('customers')
        .insert(newCustomers)
        .select('id');

      if (createError) {
        throw createError;
      }

      existingCustomers.push(...(created || []));
    }

    // Atualizar customers com preferências de áudio
    const updates = existingCustomers.slice(0, 10).map((customer, index) => ({
      id: customer.id,
      preferred_voice_type: VOICE_TYPES[index % VOICE_TYPES.length],
      preferred_voice_id: VOICE_IDS[index % VOICE_IDS.length],
      wants_audio_summary: index % 3 === 0 ? 'yes' : 'no',
      wants_summary_format: index % 3 === 0 ? 'audio' : index % 3 === 1 ? 'both' : 'text',
      incoming_audio_behavior: index % 3 === 0 ? 'transcribe' : index % 3 === 1 ? 'store' : 'both',
      outgoing_preference: index % 3 === 0 ? 'audio' : index % 3 === 1 ? 'both' : 'text',
      persona_voice_profile: {
        speed: 1.0 + (index % 3) * 0.1,
        pitch: 0.5 + (index % 3) * 0.1,
        style: ['professional', 'friendly', 'casual'][index % 3]
      }
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('customers')
        .update({
          preferred_voice_type: update.preferred_voice_type,
          preferred_voice_id: update.preferred_voice_id,
          wants_audio_summary: update.wants_audio_summary,
          wants_summary_format: update.wants_summary_format,
          incoming_audio_behavior: update.incoming_audio_behavior,
          outgoing_preference: update.outgoing_preference,
          persona_voice_profile: update.persona_voice_profile
        })
        .eq('id', update.id);

      if (error) {
        console.warn(`⚠️  Erro ao atualizar customer ${update.id}:`, error.message);
      }
    }

    console.log(`✅ ${updates.length} customers atualizados com preferências de áudio`);
  } catch (error: any) {
    console.error('❌ Erro ao criar customers:', error.message);
    throw error;
  }
}

/**
 * Cria interactions com metadados de áudio (SEM arquivos reais)
 */
async function seedInteractions() {
  console.log('💬 Criando interactions com metadados de áudio...');

  try {
    // Buscar customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .limit(10);

    if (customerError || !customers || customers.length === 0) {
      throw new Error('Nenhum customer encontrado');
    }

    // Buscar interactions existentes
    const { data: existingInteractions, error: fetchError } = await supabase
      .from('interactions')
      .select('id, customer_id')
      .limit(30);

    if (fetchError) {
      throw fetchError;
    }

    const interactions = [];
    const totalInteractions = existingInteractions?.length || 0;
    const targetCount = 30;

    // Criar novas interactions se necessário
    if (totalInteractions < targetCount) {
      for (let i = totalInteractions; i < targetCount; i++) {
        interactions.push({
          customer_id: customers[i % customers.length].id,
          channel: 'whatsapp',
          message: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
          text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
          // Metadados de áudio (sem arquivo real)
          is_audio: i % 3 === 0, // 1/3 são áudio
          transcript: i % 3 === 0 ? SAMPLE_TRANSCRIPTS[i % SAMPLE_TRANSCRIPTS.length] : null,
          transcript_confidence: i % 3 === 0 ? 0.85 + (i % 10) * 0.01 : null,
          audio_duration: i % 3 === 0 ? 5 + (i % 10) : null,
          source_channel: 'whatsapp'
        });
      }

      const { error: insertError } = await supabase
        .from('interactions')
        .insert(interactions);

      if (insertError) {
        throw insertError;
      }

      console.log(`✅ ${interactions.length} interactions criadas`);
    }

    // Atualizar interactions existentes com metadados de áudio
    if (existingInteractions && existingInteractions.length > 0) {
      const updates = existingInteractions.slice(0, 20).map((interaction, index) => ({
        id: interaction.id,
        is_audio: index % 3 === 0,
        transcript: index % 3 === 0 ? SAMPLE_TRANSCRIPTS[index % SAMPLE_TRANSCRIPTS.length] : null,
        transcript_confidence: index % 3 === 0 ? 0.85 + (index % 10) * 0.01 : null,
        audio_duration: index % 3 === 0 ? 5 + (index % 10) : null,
        source_channel: 'whatsapp'
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('interactions')
          .update({
            is_audio: update.is_audio,
            transcript: update.transcript,
            transcript_confidence: update.transcript_confidence,
            audio_duration: update.audio_duration,
            source_channel: update.source_channel,
            text: update.transcript || SAMPLE_TEXTS[0]
          })
          .eq('id', update.id);

        if (error) {
          console.warn(`⚠️  Erro ao atualizar interaction ${update.id}:`, error.message);
        }
      }

      console.log(`✅ ${updates.length} interactions atualizadas com metadados de áudio`);
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar interactions:', error.message);
    throw error;
  }
}

/**
 * Cria audio_jobs com status variados (SEM arquivos reais)
 */
async function seedAudioJobs() {
  console.log('🎵 Criando audio_jobs com status variados...');

  try {
    // Buscar customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .limit(10);

    if (customerError || !customers || customers.length === 0) {
      throw new Error('Nenhum customer encontrado');
    }

    const jobs = [];
    const statuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = ['pending', 'processing', 'completed', 'failed'];
    const jobTypes: Array<'tts' | 'asr' | 'transcribe' | 'synthesize'> = ['tts', 'asr', 'transcribe', 'synthesize'];
    const engines = ['elevenlabs', 'whisper', 'assemblyai'];

    for (let i = 0; i < 10; i++) {
      const status = statuses[i % statuses.length];
      const jobType = jobTypes[i % jobTypes.length];
      const engine = engines[i % engines.length];

      jobs.push({
        customer_id: customers[i % customers.length].id,
        job_type: jobType,
        engine: engine,
        input_text: jobType === 'tts' ? SAMPLE_TEXTS[i % SAMPLE_TEXTS.length] : null,
        input_audio_path: jobType === 'asr' ? `https://example.com/audio/${i}.mp3` : null,
        output_audio_path: status === 'completed' && jobType === 'tts' ? `https://example.com/output/${i}.mp3` : null,
        output_transcript: status === 'completed' && jobType === 'asr' ? SAMPLE_TRANSCRIPTS[i % SAMPLE_TRANSCRIPTS.length] : null,
        duration: status === 'completed' ? 5 + (i % 10) : null,
        status: status,
        error_message: status === 'failed' ? 'Erro simulado para teste' : null,
        metadata: {
          voiceId: jobType === 'tts' ? VOICE_IDS[i % VOICE_IDS.length] : null,
          model: engine === 'elevenlabs' ? 'eleven_multilingual_v2' : engine === 'whisper' ? 'whisper-1' : 'assemblyai_v2',
          confidence: jobType === 'asr' ? 0.85 + (i % 10) * 0.01 : null
        }
      });
    }

    const { error: insertError } = await supabase
      .from('audio_jobs')
      .insert(jobs);

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ ${jobs.length} audio_jobs criados`);
  } catch (error: any) {
    console.error('❌ Erro ao criar audio_jobs:', error.message);
    throw error;
  }
}

/**
 * Cria chart_explanations com snapshots reais (SEM arquivos de áudio)
 */
async function seedChartExplanations() {
  console.log('📊 Criando chart_explanations...');

  try {
    // Buscar customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .limit(5);

    if (customerError || !customers || customers.length === 0) {
      throw new Error('Nenhum customer encontrado');
    }

    const explanations = [];

    for (let i = 0; i < 5; i++) {
      const metrics = {
        sales: 1000 + i * 100,
        revenue: 5000 + i * 500,
        customers: 50 + i * 5,
        growth: 10 + i * 2
      };

      explanations.push({
        user_id: customers[i % customers.length].id,
        chart_id: `chart-${i + 1}`,
        metric_snapshot: metrics,
        auto_explanation_text: `Este gráfico mostra ${Object.keys(metrics).length} métricas principais. A métrica "sales" apresenta o valor de ${metrics.sales}, enquanto "revenue" está em ${metrics.revenue}.`,
        // SEM arquivo de áudio real - apenas metadados
        auto_explanation_audio_path: null,
        user_comment_audio_path: null,
        user_comment_duration: null
      });
    }

    const { error: insertError } = await supabase
      .from('chart_explanations')
      .insert(explanations);

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ ${explanations.length} chart_explanations criados`);
  } catch (error: any) {
    console.error('❌ Erro ao criar chart_explanations:', error.message);
    throw error;
  }
}

/**
 * Função principal
 */
async function generate() {
  console.log('🎵 Iniciando seed de dados de áudio (SEM arquivos sintéticos)...\n');

  try {
    await seedCustomers();
    await seedInteractions();
    await seedAudioJobs();
    await seedChartExplanations();

    console.log('\n✅ Seed de áudio concluído com sucesso!');
    console.log('📝 IMPORTANTE: Nenhum arquivo de áudio foi gerado - apenas metadados.');
  } catch (error: any) {
    console.error('\n❌ Erro durante o seed:', error.message);
    process.exit(1);
  }
}

// CLI
const program = new Command();

program
  .name('seed-audio')
  .description('Seed de dados de áudio (sem arquivos sintéticos)')
  .version('1.0.0');

program
  .command('generate')
  .description('Gera dados sintéticos de áudio')
  .action(generate);

program
  .command('clean')
  .description('Limpa dados de áudio')
  .action(async () => {
    try {
      await cleanAudioData();
    } catch (error: any) {
      console.error('❌ Erro ao limpar dados:', error.message);
      process.exit(1);
    }
  });

program.parse();
