jest.mock('../src/config/database',()=>({transaction:jest.fn()}));
const {schema}=require('../src/validators/listValidator');
const {buildFilter,definitions}=require('../src/services/tableListService');
describe('Listados globales y filtros',()=>{
 test.each([{pageSize:101},{page:-1},{startDate:'2026-02-30'},{startDate:'2026-11-01',endDate:'2026-10-01'},{q:'a'.repeat(201)},{status:'otro'}])('rechaza filtros inválidos %j',query=>expect(schema(['confirmed']).validate(query).error).toBeDefined());
 test('fechas de un día y filtros válidos conservan el mismo período',()=>expect(schema(['confirmed']).validate({startDate:'2026-10-19',endDate:'2026-10-19',q:' María ',page:2}).value).toMatchObject({page:2,q:'María',startDate:'2026-10-19',endDate:'2026-10-19'}));
 test('búsqueda literal y valores parametrizados no se interpolan en SQL',()=>{
  const {where,params}=buildFilter(definitions.payments,{q:"50%_O'Reilly",method:'cash',startDate:'2026-10-01',endDate:'2026-10-31'});
  expect(where).not.toContain("O'Reilly");expect(params).toEqual(["%50\\%\\_O'Reilly%",'cash','2026-10-01','2026-10-31']);
  expect(where).toContain('p.created_at::date >=');expect(where).toContain('p.created_at::date <=');
 });
});
