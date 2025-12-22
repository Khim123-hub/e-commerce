const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { authenticate, isAdmin } = require('../utils/auth');

router.post('/', authenticate, orderController.createOrder);
router.get('/', authenticate, orderController.getUserOrders);
router.get('/all', authenticate, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.put('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);

module.exports = router;