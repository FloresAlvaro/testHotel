const db = require('../config/database');
const fail = require('../utils/businessError');
const Room = require('../models/Room');

const settingsColumns='id,hotel_name,city,email,phone,address,check_in_time,check_out_time,currency,timezone,version,updated_at';
const getSettings = async () => (await db.query(`SELECT ${settingsColumns} FROM hotel_settings WHERE id=1`)).rows[0];
const saveSettings = (data) => db.transaction(async client => {
  const current = (await client.query('SELECT * FROM hotel_settings WHERE id=1 FOR UPDATE')).rows[0];
  if (current.version !== data.version) throw fail('La configuración cambió. Recarga los datos antes de guardar.');
  try { new Intl.DateTimeFormat('es-BO', {timeZone:data.timezone}).format(new Date()); } catch { throw fail('Zona horaria no válida',400); }
  if (!(await client.query('SELECT 1 FROM pg_timezone_names WHERE name=$1', [data.timezone])).rowCount) throw fail('Zona horaria no válida', 400);
  if (data.currency !== current.currency && (await client.query('SELECT 1 FROM reservation UNION ALL SELECT 1 FROM cash_shift LIMIT 1')).rowCount) throw fail('La moneda no se puede cambiar cuando existen reservas.');
  const fields = ['hotel_name','city','email','phone','address','check_in_time','check_out_time','currency','timezone'];
  return (await client.query(`UPDATE hotel_settings SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(',')}, version=version+1,updated_at=now() WHERE id=1 RETURNING ${settingsColumns}`, fields.map(f=>data[f]))).rows[0];
});
const shiftTotals = async (client, id) => (await client.query(`SELECT method, COALESCE(SUM(amount),0)::text AS total, COUNT(*)::int AS movements FROM cash_movement WHERE shift_id=$1 GROUP BY method ORDER BY method`, [id])).rows;
const listShifts = async user => {
  const shifts = (await db.query(`SELECT s.*,u.name AS user_name FROM cash_shift s JOIN "user" u ON u.id=s.user_id WHERE ($1::boolean OR s.user_id=$2) ORDER BY (s.user_id=$2 AND s.closed_at IS NULL) DESC,s.closed_at IS NULL DESC,s.id DESC LIMIT 100`, [user.role!=='receptionist',user.id])).rows;
  return Promise.all(shifts.map(async s=>({...s, totals:s.summary || await shiftTotals(db,s.id)})));
};
const openShift = (user, data) => db.transaction(async client => (await client.query(`INSERT INTO cash_shift(user_id,opening_amount,currency,notes) SELECT $1,$2,currency,$3 FROM hotel_settings WHERE id=1 RETURNING *`, [user.id,data.opening_amount,data.notes])).rows[0]);
const closeShift = (user,id,data) => db.transaction(async client => {
  const shift=(await client.query('SELECT * FROM cash_shift WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!shift) throw fail('Turno no encontrado',404);
  if(shift.user_id!==user.id && user.role==='receptionist') throw fail('No puedes cerrar este turno',403);
  if(shift.closed_at) throw fail('El turno ya está cerrado');
  const totals=await shiftTotals(client,id);
  return (await client.query(`UPDATE cash_shift SET closed_at=now(),counted_amount=$1,expected_amount=opening_amount+COALESCE((SELECT SUM(amount) FROM cash_movement WHERE shift_id=$2 AND method='cash'),0),closed_by=$3,summary=$4,notes=$5 WHERE id=$2 RETURNING *`,[data.counted_amount,id,user.id,JSON.stringify(totals),data.notes])).rows[0];
});
const createTask = (user,data) => db.transaction(async client=> {
  const room=await Room.findById(data.room_id,client,true);
  if(!room) throw fail('Habitación no encontrada',404);
  if(data.assigned_to && !(await client.query(`SELECT 1 FROM "user" WHERE id=$1 AND is_active=true AND role<>'customer'`,[data.assigned_to])).rowCount) throw fail('Responsable no disponible',400);
  const task=(await client.query(`INSERT INTO housekeeping_task(room_id,kind,title,notes,assigned_to,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[data.room_id,data.kind,data.title,data.notes,data.assigned_to,user.id])).rows[0];
  if(room.status!=='occupied') await Room.updateStatus(room.id,'maintenance',client);
  return task;
});
const updateTask = (user,id,data) => db.transaction(async client=>{
  const snapshot=(await client.query('SELECT room_id FROM housekeeping_task WHERE id=$1',[id])).rows[0];
  if(!snapshot) throw fail('Tarea no encontrada',404);
  await Room.findById(snapshot.room_id,client,true);
  const task=(await client.query('SELECT * FROM housekeeping_task WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(user.role==='receptionist' && task.assigned_to!==user.id) throw fail('Solo el responsable puede actualizar esta tarea',403);
  if(task.status==='completed') throw fail('La tarea ya está finalizada');
  if(data.assigned_to!==undefined && user.role==='receptionist') throw fail('No puedes reasignar tareas',403);
  if(data.assigned_to && !(await client.query(`SELECT 1 FROM "user" WHERE id=$1 AND is_active=true AND role<>'customer'`,[data.assigned_to])).rowCount) throw fail('Responsable no disponible',400);
  const updated=(await client.query(`UPDATE housekeeping_task SET status=$1::varchar,notes=$2,assigned_to=$3,completed_at=CASE WHEN $1::varchar='completed' THEN now() ELSE NULL END WHERE id=$4 RETURNING *`,[data.status||task.status,data.notes??task.notes,data.assigned_to===undefined?task.assigned_to:data.assigned_to,id])).rows[0];
  if(updated.status==='completed' && !(await client.query("SELECT 1 FROM housekeeping_task WHERE room_id=$1 AND status<>'completed'",[task.room_id])).rowCount){
    await Room.updateStatus(task.room_id,'available',client);
    await Room.syncReservationStatus(task.room_id,client);
  }
  return updated;
});
module.exports={getSettings,saveSettings,listShifts,openShift,closeShift,createTask,updateTask};
