const {cookieOptions,readCookie,validCsrf,trustedRequest}=require('../src/utils/sessionCookies');
describe('Credenciales de sesión del navegador',()=>{
 const previous=process.env.APP_URL;
 afterEach(()=>{if(previous===undefined)delete process.env.APP_URL;else process.env.APP_URL=previous;});
 test('cookie segura en HTTPS, HttpOnly y alcance al host',()=>{
  process.env.APP_URL='https://hotel.example';
  expect(cookieOptions()).toEqual({httpOnly:true,secure:true,sameSite:'lax',path:'/'});
  expect(cookieOptions().domain).toBeUndefined();
  process.env.APP_URL='http://localhost:3001';expect(cookieOptions().secure).toBe(false);
 });
 test('no acepta cookies ni CSRF malformados',()=>{
  const csrf_token='a'.repeat(64);
  expect(readCookie({headers:{cookie:'hotel_session=not-a-token'}})).toBeNull();
  expect(readCookie({headers:{cookie:`other=x; hotel_session=${csrf_token}`}})).toBe(csrf_token);
  expect(validCsrf({headers:{'x-hotel-csrf':'á'.repeat(64)}},{csrf_token})).toBe(false);
  expect(validCsrf({headers:{'x-hotel-csrf':csrf_token}},{csrf_token})).toBe(true);
 });
 test('bloquea login sin cabecera propia y origen ajeno',()=>{
  process.env.APP_URL='https://hotel.example';
  const res={status:jest.fn().mockReturnThis(),json:jest.fn()},next=jest.fn();
  trustedRequest({headers:{}},res,next);expect(res.status).toHaveBeenCalledWith(403);expect(next).not.toHaveBeenCalled();
  trustedRequest({headers:{'x-hotel-request':'1',origin:'https://otro.example'}},res,next);expect(next).not.toHaveBeenCalled();
  trustedRequest({headers:{'x-hotel-request':'1',origin:'https://hotel.example'}},res,next);expect(next).toHaveBeenCalledTimes(1);
 });
});
