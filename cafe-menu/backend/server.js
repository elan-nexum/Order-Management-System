// server.js or app.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory storage (replace with database in production)
let menuItems = [];
let orders = [];

// Menu routes
app.get('/api/menu', (req, res) => {
  const visibleItems = menuItems.filter(item => item.hidden === 0);
  res.json(visibleItems);
});

app.get('/api/menu/all', (req, res) => {
  res.json(menuItems);
});

app.post('/api/menu/bulk', (req, res) => {
  try {
    const { items, fileName } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid data received:', { items });
      return res.status(400).json({ 
        error: 'No items provided',
        received: { items, fileName }
      });
    }

    console.log(`Received ${items.length} items from ${fileName || 'unknown file'}`);
    console.log('First item sample:', items[0]);

    // Validate each item
    const validItems = items.filter(item => {
      return item.name && item.name.trim().length > 0;
    });

    if (validItems.length === 0) {
      return res.status(400).json({ 
        error: 'No valid items found',
        message: 'Each item must have a name'
      });
    }

    // Update menu items
    menuItems = validItems.map(item => ({
      ...item,
      id: item.id || Date.now() + Math.random() * 1000
    }));

    console.log(`Successfully saved ${menuItems.length} items`);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      message: `Saved ${menuItems.length} items successfully`
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ 
      error: 'Failed to save menu',
      details: error.message 
    });
  }
});

// Update order (for editing items)
app.put('/api/orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const updatedData = req.body;
    
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update the order while preserving the original id and timestamp
    orders[orderIndex] = {
      ...orders[orderIndex],
      items: updatedData.items || orders[orderIndex].items,
      total: updatedData.total || orders[orderIndex].total,
      note: updatedData.note || orders[orderIndex].note,
      numberOfGuests: updatedData.numberOfGuests || orders[orderIndex].numberOfGuests,
      lastUpdated: new Date().toISOString()
    };

    res.json(orders[orderIndex]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete all menu items
app.delete('/api/menu/all', (req, res) => {
  menuItems = [];
  res.status(204).send();
});

// Orders routes
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  try {
    const { tableNumber, numberOfGuests, items, total, note, staffName } = req.body;
    
    if (!tableNumber || !items || items.length === 0) {
      return res.status(400).json({ error: 'Table number and items are required' });
    }

    const newOrder = {
      id: Date.now(),
      tableNumber,
      numberOfGuests: numberOfGuests || 1,
      items,
      total,
      note: note || '',
      staffName: staffName || 'Unknown',
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    orders.push(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    orders[orderIndex].status = status;
    res.json(orders[orderIndex]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders.splice(orderIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});