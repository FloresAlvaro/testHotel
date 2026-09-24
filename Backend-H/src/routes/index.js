const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');

const userRoutes = require('./users');
const clientRoutes = require('./clients');
const roomRoutes = require('./rooms');
const roomTypeRoutes = require('./roomTypes');
const reservationRoutes = require('./reservations');
const checkInRoutes = require('./checkIn');
const paymentRoutes = require('./payments');
const dashboardRoutes = require('./dashboard');

const router = express.Router();

// Rutas públicas
router.use('/users', userRoutes);

// Rutas protegidas
router.use('/clients', auth, clientRoutes);
router.use('/rooms', auth, roomRoutes);
router.use('/room-types', auth, roomTypeRoutes);
router.use('/reservations', auth, reservationRoutes);
router.use('/check-in', auth, checkInRoutes);
router.use('/payments', auth, paymentRoutes);
router.use('/dashboard', auth, authorize('admin', 'manager'), dashboardRoutes);

module.exports = router;