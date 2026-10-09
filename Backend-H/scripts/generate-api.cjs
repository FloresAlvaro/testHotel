const fs = require('node:fs');
const path = require('node:path');
const spec = require('../src/config/swagger');

const main = async () => {
  const { default: openapiTS, astToString } = await import('openapi-typescript');
  const types = astToString(await openapiTS(spec));
  const outputs = [
    ['../openapi.json', `${JSON.stringify(spec, null, 2)}\n`],
    ['../src/types/api.d.ts', types],
    ['../../Frontend-H/app/types/generated/api.d.ts', types],
  ];
  for (const [file, content] of outputs) {
    const target = path.resolve(__dirname, file);
    if (process.argv.includes('--check')) {
      if (
        !fs.existsSync(target) ||
        fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== content
      ) {
        throw new Error(`Contrato desactualizado: ${file}. Ejecuta npm run api:generate`);
      }
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  }
};
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
