const { query } = require('../src/lib/dm-helper');

async function main() {
  await query('UPDATE "SYSDBA"."model_configs" SET model = ? WHERE id = 1', ['MiniMax-M2.5']);
  console.log('✅ Model updated to MiniMax-M2.5');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });