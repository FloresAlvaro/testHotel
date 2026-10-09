const DashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');
module.exports = {
  getSummary: async (req, res, next) => {
    try {
      sendSuccess(res, await DashboardService.getSummary(req.query.startDate, req.query.endDate));
    } catch (error) {
      next(error);
    }
  },
};
