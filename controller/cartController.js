const db = require('../models/db');

// Get user cart
exports.getCart = async (req, res) => {
  try {
    const [cartItems] = await db.query(
      `SELECT c.cart_id, c.quantity, c.added_at,
              p.product_id, p.product_name, p.price, p.image_url, p.stock_quantity
       FROM cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = ?`,
      [req.userId]
    );

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ 
      success: true, 
      count: cartItems.length,
      total: total.toFixed(2),
      cartItems 
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid product_id and quantity required' 
      });
    }

    // Check product exists and has stock
    const [products] = await db.query(
      'SELECT stock_quantity FROM products WHERE product_id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient stock available' 
      });
    }

    // Check if item already in cart
    const [existing] = await db.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [req.userId, product_id]
    );

    if (existing.length > 0) {
      // Update quantity
      await db.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, req.userId, product_id]
      );
    } else {
      // Add new item
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.userId, product_id, quantity]
      );
    }

    res.json({ success: true, message: 'Product added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Valid quantity required' });
    }

    const [result] = await db.query(
      'UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?',
      [quantity, req.params.id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM cart WHERE cart_id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.userId]);
    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};