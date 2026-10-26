const db = require('../config/database');

// Los identificadores SQL proceden exclusivamente de estas definiciones internas.
const definitions = {
  rooms: { from: 'room rm JOIN room_type rt ON rt.id=rm.room_type_id', select: 'rm.*, rt.name AS room_type_name, rt.price', order: 'rm.floor,rm.number,rm.id', search: ['rm.number','rt.name'], date: 'rm.created_at::date', status: 'rm.status', floor: 'rm.floor' },
  roomTypes: { from: 'room_type rt', select: 'rt.*', active: 'rt.is_active=true', order: 'rt.name,rt.id', search: ['rt.name'], date: 'rt.created_at::date' },
  users: { from: '"user" u', select: 'u.id,u.name,u.email,u.role,u.is_active,u.created_at,u.updated_at', order: 'u.created_at DESC,u.id DESC', active: "u.role <> 'customer'", search: ['u.name','u.email'], date: 'u.created_at::date' },
  clients: { from: 'client c', select: 'c.*', order: 'c.created_at DESC, c.id DESC', active: 'c.is_active = true', search: ['c.name', 'c.document', 'c.email', 'c.phone'], date: 'c.created_at::date' },
  reservations: { from: 'reservation r JOIN client c ON c.id=r.client_id JOIN room rm ON rm.id=r.room_id JOIN room_type rt ON rt.id=rm.room_type_id', select: 'r.*, c.name AS client_name, c.email AS client_email, c.phone AS client_phone, c.document AS client_document, rm.number AS room_number, rt.name AS room_type_name', order: 'r.check_in DESC, r.id DESC', search: ['c.name', 'rm.number', 'r.id::text'], date: 'r.check_in', status: 'r.status' },
  payments: { from: 'payment p JOIN reservation r ON r.id=p.reservation_id JOIN client c ON c.id=r.client_id', select: 'p.*, c.name AS client_name, r.check_in', order: 'p.created_at DESC, p.id DESC', search: ['c.name', 'p.reservation_id::text', 'p.id::text'], date: 'p.created_at::date', status: 'p.status', method: 'p.method' },
  onlinePayments: { from: 'online_payment p JOIN reservation r ON r.id=p.reservation_id JOIN client c ON c.id=r.client_id', select: 'p.id, p.reservation_id, p.provider, p.amount, p.currency, p.status, p.created_at, p.expires_at, c.name AS client_name', order: 'p.created_at DESC, p.id DESC', search: ['c.name', 'p.reservation_id::text', 'p.id::text'], date: 'p.created_at::date', status: 'p.status' },
  requests: { from: 'reservation_request q JOIN client c ON c.id=q.client_id JOIN reservation r ON r.id=q.reservation_id', select: "q.*,to_char(q.check_in,'YYYY-MM-DD') AS check_in,to_char(q.check_out,'YYYY-MM-DD') AS check_out,c.name AS client_name,r.total_price,r.status AS reservation_status", order: 'q.id DESC', search: ['c.name','q.reservation_id::text'], date: 'q.created_at::date', status: 'q.status' },
  mail: { from: 'email_outbox m', select: 'm.id, m.recipient, m.subject, m.attempts, m.sent_at, m.last_error, m.created_at', order: 'm.created_at DESC, m.id DESC', search: ['m.recipient', 'm.subject'], date: 'm.created_at::date' },
};

const buildFilter = (definition, filters) => {
  const params = [], clauses = [];
  const bind = value => { params.push(value); return `$${params.length}`; };
  if (definition.active) clauses.push(definition.active);
  if (filters.q) {
    const token = bind(`%${filters.q.replace(/[\\%_]/g, '\\$&')}%`);
    clauses.push(`(${definition.search.map(field => `${field} ILIKE ${token}`).join(' OR ')})`);
  }
  if (filters.status && definition.status) clauses.push(`${definition.status} = ${bind(filters.status)}`);
  if (filters.floor !== undefined && definition.floor) clauses.push(`${definition.floor} = ${bind(filters.floor)}`);
  if (filters.method && definition.method) clauses.push(`${definition.method} = ${bind(filters.method)}`);
  if (filters.startDate) clauses.push(`${definition.date} >= ${bind(filters.startDate)}::date`);
  if (filters.endDate) clauses.push(`${definition.date} <= ${bind(filters.endDate)}::date`);
  if (filters.clientId && definition.from.startsWith('reservation')) clauses.push(`r.client_id = ${bind(filters.clientId)}`);
  if (definition.from === '"user" u' && filters.role) clauses.push(`u.role = ${bind(filters.role)}`);
  if (definition.from === '"user" u' && filters.status) clauses.push(`u.is_active = ${bind(filters.status === 'active')}`);
  if (definition.from === 'email_outbox m' && filters.status) {
    clauses.push(filters.status === 'sent' ? 'm.sent_at IS NOT NULL' : filters.status === 'failed' ? 'm.sent_at IS NULL AND m.last_error IS NOT NULL' : 'm.sent_at IS NULL AND m.last_error IS NULL');
  }
  return { where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', params };
};

const list = async (entity, filters) => {
  const definition = definitions[entity];
  if (!definition) throw new Error('Listado no disponible');
  const { where, params } = buildFilter(definition, filters);
  const page = Number(filters.page || 1), pageSize = Number(filters.pageSize || 10);
  // Un snapshot de solo lectura mantiene coherentes filas, total y estadísticas.
  return db.transaction(async client => {
    const summarySelect = entity === 'payments' ? `,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status='completed'),0)::text AS income,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status='pending'),0)::text AS pending,
      COALESCE(SUM(p.amount) FILTER (WHERE p.status='refunded'),0)::text AS refunds,
      COUNT(*) FILTER (WHERE p.status='completed')::int AS completed_count,
      COUNT(*) FILTER (WHERE p.status='pending')::int AS pending_count,
      COUNT(*) FILTER (WHERE p.status='refunded')::int AS refunded_count,
      COALESCE(MAX(p.amount) FILTER (WHERE p.status='completed'),0)::text AS max_income` : '';
    const totals = (await client.query(`SELECT COUNT(*)::int AS total ${summarySelect} FROM ${definition.from}${where}`, params)).rows[0];
    const rows = (await client.query(`SELECT ${definition.select} FROM ${definition.from}${where} ORDER BY ${definition.order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, (page-1)*pageSize])).rows;
    return { rows, total: totals.total, ...(entity === 'payments' ? { summary: totals } : {}) };
  }, {readOnly:true});
};
module.exports = { list, buildFilter, definitions };
