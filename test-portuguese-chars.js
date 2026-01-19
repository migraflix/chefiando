// Teste de caracteres portugueses
console.log('🧪 TESTE DE CARACTERES PORTUGUESES');
console.log('='.repeat(50));

const testStrings = [
  'Teste com ã (a com til)',
  'Texto com õ (o com til)',
  'Palavra com ç (cedilha)',
  'Acentos agudos: á, é, í, ó, ú',
  'Acentos graves: à, è, ò',
  'Acentos circunflexos: â, ê, ô',
  'Combinação: São Paulo, Paraná, Açúcar',
  'Frases: Ação rápida, Organização, Avaliação'
];

testStrings.forEach((str, index) => {
  console.log(`\nTeste ${index + 1}:`);
  console.log(`Original: ${str}`);

  // Teste JSON
  try {
    const json = JSON.stringify({ text: str });
    console.log(`✅ JSON válido: ${json}`);
  } catch (error) {
    console.log(`❌ JSON inválido: ${error.message}`);
  }

  // Teste sanitização básica
  try {
    const sanitized = str.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
    console.log(`✅ Sanitizado: ${sanitized}`);
    console.log(`✅ Mantém acentos: ${/[ãõçáéíóúàèòâêô]/.test(sanitized) ? 'SIM' : 'NÃO'}`);
  } catch (error) {
    console.log(`❌ Erro na sanitização: ${error.message}`);
  }
});

console.log('\n🎉 TESTE CONCLUÍDO');