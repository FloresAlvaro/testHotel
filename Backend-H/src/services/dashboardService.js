const pool = require('../config/database');
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const CheckInLog = require('../models/CheckInLog');
const Payment = require('../models/Payment');
const error = require('../utils/domainError');

const isValidDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

module.exports = {
  getSummary: async (start, end) => {
    const today = new Date().toISOString().slice(0, 10);
    const startDate = start || today;
    const endDate = end || today;

    if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
      throw error('El período de fechas no es válido', 400);
    }

    const [
      occupancy,
      activeReservations,
      upcomingReservations,
      pendingCheckOuts,
      pendingPayments,
      revenue,
      totals,
    ] = await Promise.all([
      Room.getOccupancyStatus(),
      Reservation.findActive(),
      Reservation.findUpcoming(7),
      CheckInLog.findPendingCheckOuts(),
      Payment.findPending(10, 0),
      Payment.getRevenueByPeriod(startDate, endDate),
      Promise.all([
        Reservation.countAll(),
        Payment.countAll('pending'),
        pool.query(`
						SELECT COUNT(*)::int AS total_clients
						FROM client
						WHERE is_active = TRUE
					`),
      ]),
    ]);

    return {
      period: { startDate, endDate },
      occupancy,
      reservations: {
        active: activeReservations,
        upcoming: upcomingReservations,
        total: totals[0],
      },
      checkIns: {
        pendingCheckOuts,
      },
      payments: {
        pending: pendingPayments,
        pendingTotal: totals[1],
        revenue,
      },
      clients: {
        total: totals[2].rows[0].total_clients,
      },
    };
  },
};
