const pool = require('../config/database');
const Room = require('../models/Room');
const Reservation = require('../models/Reservation');
const CheckInLog = require('../models/CheckInLog');
const Payment = require('../models/Payment');
const { sendSuccess, sendError } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

const isValidDate = (value) => {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
};

class DashboardController {
	static async getSummary(req, res, next) {
		try {
			const today = new Date().toISOString().slice(0, 10);
			const startDate = req.query.startDate || today;
			const endDate = req.query.endDate || today;

			if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
				return sendError(
					res,
					'El período de fechas no es válido',
					HTTP_STATUS.BAD_REQUEST
				);
			}

			const [occupancy, activeReservations, upcomingReservations, pendingCheckOuts,
				pendingPayments, revenue, totals] = await Promise.all([
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
					`)
				])
			]);

			return sendSuccess(res, {
				period: { startDate, endDate },
				occupancy,
				reservations: {
					active: activeReservations,
					upcoming: upcomingReservations,
					total: totals[0]
				},
				checkIns: {
					pendingCheckOuts
				},
				payments: {
					pending: pendingPayments,
					pendingTotal: totals[1],
					revenue
				},
				clients: {
					total: totals[2].rows[0].total_clients
				}
			});
		} catch (error) {
			next(error);
		}
	}
}

module.exports = DashboardController;
