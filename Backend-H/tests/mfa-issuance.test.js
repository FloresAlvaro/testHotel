jest.mock('../src/config/database',()=>({query:jest.fn()}));
jest.mock('../src/services/mfaService',()=>({enabled:()=>true,verify:jest.fn()}));
jest.mock('../src/services/sessionService',()=>({create:jest.fn(),trustedRequest:jest.fn()}));
jest.mock('../src/models/User',()=>({findById:jest.fn()}));
jest.mock('../src/utils/jwt',()=>({createToken:jest.fn()}));
const mfa=require('../src/services/mfaService');
const User=require('../src/models/User');
const sessions=require('../src/services/sessionService');
const {createToken}=require('../src/utils/jwt');
const router=require('../src/routes/mfa');
const handler=router.stack.find(layer=>layer.route?.path==='/mfa/verify').route.stack.at(-1).handle;
const response=()=>({json:jest.fn(),cookie:jest.fn()});
beforeEach(()=>jest.clearAllMocks());
test.each([true,false])('no emite credenciales si la versión cambió después de comprobar MFA (browser=%s)',async browser=>{
 mfa.verify.mockResolvedValue({userId:12,browser,authVersion:7});
 // Password/role change commits between MFA verification and the subsequent profile read.
 User.findById.mockResolvedValue({id:12,is_active:true,role:'admin',auth_version:8});
 const res=response(),next=jest.fn();
 await handler({body:{challengeId:'a'.repeat(64),code:'123456'}},res,next);
 expect(next).toHaveBeenCalledWith(expect.objectContaining({statusCode:401}));
 expect(sessions.create).not.toHaveBeenCalled();expect(createToken).not.toHaveBeenCalled();
 expect(res.json).not.toHaveBeenCalled();expect(res.cookie).not.toHaveBeenCalled();
});
test('JWT usa exclusivamente la versión que se verificó dentro de la transacción MFA',async()=>{
 mfa.verify.mockResolvedValue({userId:12,browser:false,authVersion:7});
 User.findById.mockResolvedValue({id:12,email:'test@example.com',is_active:true,role:'admin',auth_version:7});
 createToken.mockReturnValue('signed-test-token');
 const next=jest.fn(),res=response();await handler({body:{challengeId:'a'.repeat(64),code:'123456'}},res,next);
 expect(next).not.toHaveBeenCalled();expect(createToken).toHaveBeenCalledWith(expect.objectContaining({version:7,mfa_verified:true}));
});
test('la sesión cookie conserva la versión verificada si ocurre una revocación posterior',async()=>{
 mfa.verify.mockResolvedValue({userId:12,browser:true,authVersion:7});
 User.findById.mockResolvedValue({id:12,is_active:true,role:'admin',auth_version:7});
 sessions.create.mockResolvedValue('csrf-test');
 const req={body:{challengeId:'a'.repeat(64),code:'123456'}},res=response(),next=jest.fn();
 await handler(req,res,next);expect(next).not.toHaveBeenCalled();
 expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({auth_version:7,mfa_verified:true}),req,res);
});
