const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determine database path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'burnit.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log(`Connected to SQLite database at ${dbPath}`);
  
  // Initialize schema
  const fs = require('fs');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing schema:', err);
    } else {
      console.log('Database schema initialized');
    }
  });
});

// Initialize Express
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting (optional for personal use)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// API routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Foods CRUD operations

// Get all foods with optional date filter
app.get('/api/foods', (req, res) => {
  const { date, meal_type, is_favorite } = req.query;
  let query = 'SELECT * FROM foods WHERE 1=1';
  const params = [];
  
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  
  if (meal_type) {
    query += ' AND meal_type = ?';
    params.push(meal_type);
  }
  
  if (is_favorite !== undefined) {
    query += ' AND is_favorite = ?';
    params.push(is_favorite === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get food by ID
app.get('/api/foods/:id', (req, res) => {
  db.get('SELECT * FROM foods WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Food not found' });
    } else {
      res.json(row);
    }
  });
});

// Add new food
app.post('/api/foods', (req, res) => {
  const {
    name, calories, protein = 0, carbs = 0, fat = 0,
    quantity = 1.0, unit = 'serving', date, meal_type = 'snack',
    is_favorite = false, usda_id = null
  } = req.body;

  if (!name || !calories || !date) {
    return res.status(400).json({ error: 'Name, calories, and date are required' });
  }

  const query = `
    INSERT INTO foods (name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id];

  db.run(query, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID, ...req.body });
    }
  });
});

// Update food
app.put('/api/foods/:id', (req, res) => {
  const {
    name, calories, protein, carbs, fat, quantity, unit, date, meal_type,
    is_favorite, usda_id
  } = req.body;

  const query = `
    UPDATE foods SET 
      name = COALESCE(?, name),
      calories = COALESCE(?, calories),
      protein = COALESCE(?, protein),
      carbs = COALESCE(?, carbs),
      fat = COALESCE(?, fat),
      quantity = COALESCE(?, quantity),
      unit = COALESCE(?, unit),
      date = COALESCE(?, date),
      meal_type = COALESCE(?, meal_type),
      is_favorite = COALESCE(?, is_favorite),
      usda_id = COALESCE(?, usda_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id, req.params.id];

  db.run(query, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Food not found' });
    } else {
      res.json({ id: req.params.id, message: 'Food updated successfully' });
    }
  });
});

// Delete food
app.delete('/api/foods/:id', (req, res) => {
  db.run('DELETE FROM foods WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Food not found' });
    } else {
      res.json({ message: 'Food deleted successfully' });
    }
  });
});

// Get daily summary
app.get('/api/summary/:date', (req, res) => {
  const date = req.params.date;
  
  db.get(`
    SELECT 
      COUNT(*) as entries_count,
      SUM(calories) as total_calories,
      SUM(protein) as total_protein,
      SUM(carbs) as total_carbs,
      SUM(fat) as total_fat
    FROM foods
    WHERE date = ?
  `, [date], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row || { entries_count: 0, total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 });
    }
  });
});

// Goals endpoints
app.get('/api/goals', (req, res) => {
  db.all('SELECT * FROM daily_goals ORDER BY date DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/goals/:date', (req, res) => {
  db.get('SELECT * FROM daily_goals WHERE date = ?', [req.params.date], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row || { calories: 2000, protein: 50, carbs: 250, fat: 65 });
    }
  });
});

app.post('/api/goals', (req, res) => {
  const { calories, protein = 0, carbs = 0, fat = 0, date } = req.body;

  if (!calories || !date) {
    return res.status(400).json({ error: 'Calories and date are required' });
  }

  const query = `
    INSERT OR REPLACE INTO daily_goals (calories, protein, carbs, fat, date)
    VALUES (?, ?, ?, ?, ?)
  `;

  const params = [calories, protein, carbs, fat, date];

  db.run(query, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ date, calories, protein, carbs, fat, message: 'Goals updated successfully' });
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Database at: ${dbPath}`);
});

module.exports = { app, db };