import * as fs from 'fs/promises';
import * as path from 'path';

export async function readJsonFiles(folderPath: string): Promise<any[]> {
  try {
    console.log(`📂 Lendo arquivos de: ${folderPath}`);

    // Verificar se o diretório existe
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      throw new Error(`${folderPath} não é um diretório válido`);
    }

    // Ler todos os arquivos do diretório
    const files = await fs.readdir(folderPath);
    
    // Filtrar apenas arquivos .json
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    console.log(`📄 Encontrados ${jsonFiles.length} arquivos JSON`);

    // Ler e parsear cada arquivo
    const results = [];
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(folderPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        results.push({
          fileName: file,
          filePath: filePath,
          data: data
        });

        console.log(`✅ Arquivo lido: ${file}`);
      } catch (error) {
        console.error(`❌ Erro ao ler arquivo ${file}:`, error);
        // Continuar com os próximos arquivos
      }
    }

    return results;

  } catch (error) {
    console.error('❌ Erro ao ler diretório:', error);
    throw error;
  }
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error);
    throw error;
  }
}

export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Arquivo salvo: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erro ao salvar arquivo ${filePath}:`, error);
    throw error;
  }
}
