const fs=require('node:fs');
const path=require('node:path');
const spec=require('../src/config/swagger');
const schemas=require('../contracts/schemas.json');
function type(schema){
 let result;
 if(schema.$ref)result=schema.$ref.split('/').pop();
 else if(schema.enum)result=schema.enum.map(value=>JSON.stringify(value)).join(' | ');
 else if(schema.anyOf)result=schema.anyOf.map(type).join(' | ');
 else if(schema.type==='object')result=`{\n${Object.entries(schema.properties).map(([name,field])=>`  ${JSON.stringify(name)}${schema.required?.includes(name)?'':'?'}: ${type(field)};`).join('\n')}\n}`;
 else if(schema.type==='array')result=`Array<${type(schema.items)}>`;
 else if(schema.type==='integer'||schema.type==='number')result='number';
 else if(schema.type==='string'||schema.type==='boolean')result=schema.type;
 else throw new Error('Esquema no soportado por generador');
 return schema.nullable?`(${result}) | null`:result;
}
const files=[
 ['../../docs/api/openapi.json',JSON.stringify(spec,null,2)+'\n'],
 ['../../Frontend-H/app/types/generated/api.ts','// Generado con Backend-H: npm run api:generate. No editar.\n'+Object.entries(schemas).map(([name,schema])=>`export type ${name} = ${type(schema)};`).join('\n\n')+'\n']
];
for(const [relative,content] of files){
 const file=path.resolve(__dirname,relative);
 if(process.argv.includes('--check')){
  if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content){console.error(`Contrato desactualizado: ${relative}. Ejecuta npm run api:generate`);process.exitCode=1;}
 }else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
}
