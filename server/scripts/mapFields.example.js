/**
 * Exemplo de função de mapeamento customizada
 * 
 * Esta função recebe os campos brutos do JSON e retorna
 * um objeto padronizado com os campos necessários
 */

module.exports = function mapFields(fields) {
  return {
    phone: fields.phone || fields.phoneNumber || fields.numero,
    message: fields.text || fields.message || fields.mensagem || fields.content,
    timestamp: fields.timestamp || fields.date || fields.data || new Date().toISOString(),
    from: fields.from || fields.sender || fields.remetente || 'unknown'
  };
};

// Ou usando export default (ES6)
// export default function mapFields(fields) { ... }
