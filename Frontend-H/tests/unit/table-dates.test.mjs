import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reservationRange } from '../../app/utils/dates.ts';

test('semana calendario de lunes a domingo, incluido el cambio de año', () => {
  assert.deepEqual(reservationRange('week','2027-01-01'),{startDate:'2026-12-28',endDate:'2027-01-03'});
  assert.deepEqual(reservationRange('week','2026-10-19'),{startDate:'2026-10-19',endDate:'2026-10-25'});
});
test('mes incluye el año, último día y años bisiestos', () => {
  assert.deepEqual(reservationRange('month','2024-02-29'),{startDate:'2024-02-01',endDate:'2024-02-29'});
  assert.deepEqual(reservationRange('month','2026-12-19'),{startDate:'2026-12-01',endDate:'2026-12-31'});
});
test('hoy y próximas se basan en la fecha del hotel, sin convertirla al navegador', () => {
  assert.deepEqual(reservationRange('today','2026-10-19'),{startDate:'2026-10-19',endDate:'2026-10-19'});
  assert.deepEqual(reservationRange('upcoming','2026-12-31'),{startDate:'2027-01-01'});
  assert.deepEqual(reservationRange('','2026-10-19'),{});
});
