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

router.use('/portal', auth, authorize('customer'), require('./portal'));

// La operación interna usa una lista explícita de roles de personal.
router.use(auth, authorize('admin', 'manager', 'receptionist'));

// Rutas protegidas
router.use('/clients', clientRoutes);
router.use('/rooms', roomRoutes);
router.use('/room-types', roomTypeRoutes);
router.use('/reservations', reservationRoutes);
router.use('/check-in', checkInRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', authorize('admin', 'manager'), dashboardRoutes);

router.use('/operations', require('./operations'));

module.exports = router;