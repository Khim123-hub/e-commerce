const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test each route import one by one
console.log('Loading authRoutes...');
const authRoutes = require('./routes/authRoutes');
console.log(' authRoutes loaded:', typeof authRoutes);

console.log('Loading productRoutes...');
const productRoutes = require('./routes/productRoutes');
console.log(' productRoutes loaded:', typeof productRoutes);

console.log('Loading cartRoutes...');
const cartRoutes = require('./routes/cartRoutes');
console.log(' cartRoutes loaded:', typeof cartRoutes);

console.log('Loading orderRoutes...');
const orderRoutes = require('./routes/orderRoutes');
console.log(' orderRoutes loaded:', typeof orderRoutes);

console.log('Loading categoryRoutes...');
const categoryRoutes = require('./routes/categoryRoutes');
console.log(' categoryRoutes loaded:', typeof categoryRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'E-commerce API is running! '
  });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

module.exports = app;