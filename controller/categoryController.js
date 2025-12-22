const db = require('../models/db');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY category_name');
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Get products in category
    const [products] = await db.query(
      'SELECT * FROM products WHERE category_id = ?',
      [req.params.id]
    );

    res.json({ 
      success: true, 
      category: { ...categories[0], products } 
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { category_name, description, parent_id } = req.body;

    if (!category_name) {
      return res.status(400).json({ success: false, message: 'Category name required' });
    }

    const [result] = await db.query(
      'INSERT INTO categories (category_name, description, parent_id) VALUES (?, ?, ?)',
      [category_name, description, parent_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { category_name, description, parent_id } = req.body;

    const [result] = await db.query(
      'UPDATE categories SET category_name = ?, description = ?, parent_id = ? WHERE category_id = ?',
      [category_name, description, parent_id || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};