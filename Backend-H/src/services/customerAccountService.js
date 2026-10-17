const db = require('../config/database');
const User = require('../models/User');
const fail = require('../utils/businessError');

const findAccount = async (clientId, connection = db) => (
  await connection.query(`SELECT id,name,email,is_active,created_at FROM "user" WHERE client_id=$1 AND role='customer'`, [clientId])
).rows[0] || null;

const createAccount = (clientId, data) => db.transaction(async connection => {
  const guest = (await connection.query('SELECT id,name,is_active FROM client WHERE id=$1 FOR UPDATE', [clientId])).rows[0];
  if (!guest) throw fail('Huésped no encontrado', 404);
  if (!guest.is_active) throw fail('Activa la ficha del huésped antes de crear su acceso');
  if (await findAccount(clientId, connection)) throw fail('Este huésped ya tiene una cuenta');
  if ((await connection.query('SELECT 1 FROM "user" WHERE lower(email)=lower($1)', [data.email])).rowCount) throw fail('El correo ya tiene una cuenta');
  return User.create({ name: guest.name, email: data.email, password: data.password, role: 'customer', client_id: guest.id }, connection);
});

const changeAccess = async (clientId, isActive) => {
  const result = await db.query(`UPDATE "user" SET is_active=$1 WHERE client_id=$2 AND role='customer' RETURNING id,name,email,is_active,created_at`, [isActive,clientId]);
  if (!result.rowCount) throw fail('Cuenta del huésped no encontrada',404);
  return result.rows[0];
};
module.exports = { findAccount, createAccount, changeAccess };
