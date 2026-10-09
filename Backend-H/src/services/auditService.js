const AuditLog = require('../models/AuditLog');
const fields = [
  'id',
  'status',
  'room_id',
  'client_id',
  'reservation_id',
  'check_in',
  'check_out',
  'total_price',
  'amount',
  'type',
  'method',
  'role',
  'is_active',
  'check_in_time',
  'check_out_time',
];
const snapshot = (value) =>
  value
    ? Object.fromEntries(fields.filter((key) => key in value).map((key) => [key, value[key]]))
    : null;
module.exports = (client, actor, action, table, before, after) =>
  AuditLog.create(
    {
      user_id: actor?.id,
      ip_address: actor?.ip,
      action,
      table_name: table,
      record_id: after?.id || before?.id,
      old_value: snapshot(before),
      new_value: snapshot(after),
    },
    client,
  );
