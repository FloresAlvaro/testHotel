const express = require('express');
const DashboardController = require('../controllers/dashboardController');

const router = express.Router();
require('../validators/common').configureRouter(router);

router.get('/', DashboardController.getSummary);

module.exports = router;
