// netlify/functions/api.js
// Serverless functions for burnit food tracker

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// For serverless, we'll use in-memory DB with data loading from a backup
// In production, you'd want to use a persistent service like Supabase, PlanetScale, etc.
let db;

const initDB = () => {
  if (db) return Promise.resolve(db);
  
  return new Promise((resolve, reject) => {
    // Use in-memory for serverless (not ideal for production but works for demo)
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      // Initialize schema
      const schema = `
        CREATE TABLE IF NOT EXISTS foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          calories INTEGER NOT NULL,
          protein INTEGER DEFAULT 0,
          carbs INTEGER DEFAULT 0,
          fat INTEGER DEFAULT 0,
          quantity REAL DEFAULT 1.0,
          unit TEXT DEFAULT 'serving',
          date TEXT NOT NULL,
          meal_type TEXT DEFAULT 'snack',
          is_favorite BOOLEAN DEFAULT 0,
          usda_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          calories INTEGER NOT NULL,
          protein INTEGER DEFAULT 0,
          carbs INTEGER DEFAULT 0,
          fat INTEGER DEFAULT 0,
          date TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS foods_date_idx ON foods(date);
        CREATE INDEX IF NOT EXISTS foods_meal_type_idx ON foods(meal_type);
        CREATE INDEX IF NOT EXISTS foods_favorite_idx ON foods(is_favorite);
      `;
      
      db.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing schema:', err);
          reject(err);
        } else {
          console.log('Database schema initialized');
          resolve(db);
        }
      });
    });
  });
};

// Helper function to run SQL queries
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (query.trim().toLowerCase().startsWith('select') || query.trim().toLowerCase().startsWith('pragma')) {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } else {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

// Main handler
exports.handler = async (event, context) => {
  try {
    await initDB();
    
    const { httpMethod, path, body, queryStringParameters } = event;
    const pathParts = path.replace('/api/', '').split('/').filter(p => p);
    
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    };
    
    // Handle preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }
    
    // Route handling
    const [resource, id] = pathParts;
    
    // Health check
    if (resource === 'health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      };
    }
    
    // Foods endpoints
    if (resource === 'foods') {
      if (httpMethod === 'GET') {
        if (id) {
          // Get specific food
          const rows = await runQuery('SELECT * FROM foods WHERE id = ?', [id]);
          if (rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Food not found' })
            };
          }
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows[0])
          };
        } else {
          // Get all foods with optional filters
          const { date, meal_type } = queryStringParameters || {};
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
          
          query += ' ORDER BY created_at DESC';
          
          const rows = await runQuery(query, params);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
          };
        }
      }
      
      if (httpMethod === 'POST') {
        const data = JSON.parse(body || '{}');
        const {
          name, calories, protein = 0, carbs = 0, fat = 0,
          quantity = 1.0, unit = 'serving', date, meal_type = 'snack',
          is_favorite = false, usda_id = null
        } = data;

        if (!name || !calories || !date) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Name, calories, and date are required' })
          };
        }

        const query = `
          INSERT INTO foods (name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id];
        const result = await runQuery(query, params);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ id: result.lastID, ...data })
        };
      }
      
      if (httpMethod === 'PUT' && id) {
        const data = JSON.parse(body || '{}');
        const {
          name, calories, protein, carbs, fat, quantity, unit, date, meal_type,
          is_favorite, usda_id
        } = data;

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

        const params = [name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id, id];
        const result = await runQuery(query, params);

        if (result.changes === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Food not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ id, message: 'Food updated successfully' })
        };
      }
      
      if (httpMethod === 'DELETE' && id) {
        const result = await runQuery('DELETE FROM foods WHERE id = ?', [id]);

        if (result.changes === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Food not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Food deleted successfully' })
        };
      }
    }
    
    // Summary endpoint
    if (resource === 'summary' && id) {
      const date = id; // id is actually the date in this context
      const rows = await runQuery(`
        SELECT 
          COUNT(*) as entries_count,
          SUM(calories) as total_calories,
          SUM(protein) as total_protein,
          SUM(carbs) as total_carbs,
          SUM(fat) as total_fat
        FROM foods
        WHERE date = ?
      `, [date]);

      const summary = rows[0] || { entries_count: 0, total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(summary)
      };
    }
    
    // Goals endpoints
    if (resource === 'goals') {
      if (httpMethod === 'GET') {
        if (id) {
          // Get goals for specific date
          const rows = await runQuery('SELECT * FROM daily_goals WHERE date = ?', [id]);
          const goals = rows[0] || { calories: 2000, protein: 50, carbs: 250, fat: 65 };
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(goals)
          };
        } else {
          // Get all goals
          const rows = await runQuery('SELECT * FROM daily_goals ORDER BY date DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(rows)
          };
        }
      }
      
      if (httpMethod === 'POST') {
        const data = JSON.parse(body || '{}');
        const { calories, protein = 0, carbs = 0, fat = 0, date } = data;

        if (!calories || !date) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Calories and date are required' })
          };
        }

        const query = `
          INSERT OR REPLACE INTO daily_goals (calories, protein, carbs, fat, date)
          VALUES (?, ?, ?, ?, ?)
        `;

        const params = [calories, protein, carbs, fat, date];
        await runQuery(query, params);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ date, calories, protein, carbs, fat, message: 'Goals updated successfully' })
        };
      }
    }
    
    // 404 for unknown routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};