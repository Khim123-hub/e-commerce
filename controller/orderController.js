const db = require('../models/db');

// Create order from cart
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { shipping_address_id, payment_method } = req.body;

    if (!shipping_address_id || !payment_method) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shipping address and payment method required' 
      });
    }

    // Get cart items
    const [cartItems] = await connection.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock_quantity
       FROM cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = ?`,
      [req.userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Check stock availability
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for product ID ${item.product_id}` 
        });
      }
    }

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address_id, payment_method) 
       VALUES (?, ?, ?, ?)`,
      [req.userId, total, shipping_address_id, payment_method]
    );

    const orderId = orderResult.insertId;

    // Add order items and update stock
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [req.userId]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId,
      totalAmount: total.toFixed(2)
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, a.address_line1, a.city, a.state, a.postal_code, a.country
       FROM orders o
       LEFT JOIN addresses a ON o.shipping_address_id = a.address_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.userId]
    );

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get order details
exports.getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country
       FROM orders o
       LEFT JOIN addresses a ON o.shipping_address_id = a.address_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [req.params.id, req.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [orderItems] = await db.query(
      `SELECT oi.*, p.product_name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ 
      success: true, 
      order: { ...orders[0], items: orderItems } 
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       ORDER BY o.created_at DESC`
    );

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};