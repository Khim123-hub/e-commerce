const db = require('../models/db');

/* =========================
   Get all products
========================= */
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;

    let query = `
      SELECT p.*, c.category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await db.query(query, params);
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/* =========================
   Get single product
========================= */
exports.getProductById = async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, c.category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       WHERE p.product_id = ?`,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const [reviews] = await db.query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.product_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, product: { ...products[0], reviews } });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/* =========================
   Create product (Admin)
========================= */
exports.createProduct = async (req, res) => {
  try {
    const { product_name, description, price, stock_quantity, category_id, image_url } = req.body;

    if (!product_name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Product name and price are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO products 
       (product_name, description, price, stock_quantity, category_id, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product_name, description, price, stock_quantity || 0, category_id, image_url]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/* =========================
   Update product (Admin)
========================= */
exports.updateProduct = async (req, res) => {
  try {
    const { product_name, description, price, stock_quantity, category_id, image_url } = req.body;

    const [result] = await db.query(
      `UPDATE products
       SET product_name=?, description=?, price=?, stock_quantity=?, category_id=?, image_url=?
       WHERE product_id=?`,
      [product_name, description, price, stock_quantity, category_id, image_url, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/* =========================
   Delete product (Admin)
========================= */
exports.deleteProduct = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM products WHERE product_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/* =========================
   Add review
========================= */
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const [result] = await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.params.id, req.userId, rating, comment]
    );

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
