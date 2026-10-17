const db=require('../config/database');
const fail=require('../utils/businessError');
const edit=(id,data)=>db.transaction(async c=>{
 // Todas las rutas de permisos/activación comparten este bloqueo.
 await c.query('SELECT pg_advisory_xact_lock(724001)');
 const user=(await c.query('SELECT id,name,email,role,is_active FROM "user" WHERE id=$1 FOR UPDATE',[id])).rows[0];
 if(!user)throw fail('Usuario no encontrado',404);
 if(user.role==='customer')throw fail('Administra esta cuenta desde la ficha del huésped',409);
 const next={...user,...data};
 if(user.role==='admin'&&user.is_active&&(next.role!=='admin'||!next.is_active)){
  const result=await c.query(`SELECT COUNT(*)::int AS count FROM "user" WHERE role='admin' AND is_active`);
  if(result.rows[0].count<=1)throw fail('No se puede desactivar ni cambiar el rol del último administrador activo',409);
 }
 return (await c.query(`UPDATE "user" SET name=$1,email=$2,role=$3,is_active=$4,
 auth_version=auth_version+CASE WHEN role<>$3::user_role OR is_active<>$4 THEN 1 ELSE 0 END,updated_at=now()
 WHERE id=$5 RETURNING id,name,email,role,is_active,created_at,updated_at`,[next.name,next.email,next.role,next.is_active,id])).rows[0];
});
module.exports={edit};
