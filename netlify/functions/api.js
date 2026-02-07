// netlify/functions/api.js
// Serverless functions for burnit food tracker - Turso Edition

const { createClient } = require('@libsql/client');

// Turso connection (uses environment variables)
const getClient = () => {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://burnit-tracker-chadbowen248.aws-us-east-1.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN
  });
};

// Initialize schema (runs once per cold start)
let schemaInitialized = false;

const initDB = async (client) => {
  if (schemaInitialized) return;
  
  await client.batch([
    `CREATE TABLE IF NOT EXISTS foods (
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
    )`,
    `CREATE INDEX IF NOT EXISTS foods_date_idx ON foods(date)`,
    `CREATE INDEX IF NOT EXISTS foods_meal_type_idx ON foods(meal_type)`,
    `CREATE INDEX IF NOT EXISTS foods_favorite_idx ON foods(is_favorite)`,
    `CREATE TABLE IF NOT EXISTS daily_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calories INTEGER NOT NULL,
      protein INTEGER DEFAULT 0,
      carbs INTEGER DEFAULT 0,
      fat INTEGER DEFAULT 0,
      date TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ], 'write');
  
  schemaInitialized = true;
  console.log('Turso schema initialized');
};

// Main handler
exports.handler = async (event, context) => {
  const client = getClient();
  
  try {
    await initDB(client);
    
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
          const result = await client.execute({
            sql: 'SELECT * FROM foods WHERE id = ?',
            args: [id]
          });
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Food not found' })
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows[0])
          };
        } else {
          // Get all foods with optional filters
          const { date, meal_type, is_favorite } = queryStringParameters || {};
          let sql = 'SELECT * FROM foods WHERE 1=1';
          const args = [];
          
          if (date) {
            sql += ' AND date = ?';
            args.push(date);
          }
          
          if (meal_type) {
            sql += ' AND meal_type = ?';
            args.push(meal_type);
          }
          
          if (is_favorite !== undefined) {
            sql += ' AND is_favorite = ?';
            args.push(is_favorite === 'true' ? 1 : 0);
          }
          
          sql += ' ORDER BY created_at DESC';
          
          const result = await client.execute({ sql, args });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows)
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

        const sql = `
          INSERT INTO foods (name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const args = [name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite ? 1 : 0, usda_id];
        const result = await client.execute({ sql, args });

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ id: Number(result.lastInsertRowid), ...data })
        };
      }
      
      if (httpMethod === 'PUT' && id) {
        const data = JSON.parse(body || '{}');
        const {
          name, calories, protein, carbs, fat, quantity, unit, date, meal_type,
          is_favorite, usda_id
        } = data;

        const sql = `
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

        const args = [name, calories, protein, carbs, fat, quantity, unit, date, meal_type, is_favorite, usda_id, id];
        const result = await client.execute({ sql, args });

        if (result.rowsAffected === 0) {
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
        const result = await client.execute({
          sql: 'DELETE FROM foods WHERE id = ?',
          args: [id]
        });

        if (result.rowsAffected === 0) {
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
      const result = await client.execute({
        sql: `
          SELECT 
            COUNT(*) as entries_count,
            SUM(calories) as total_calories,
            SUM(protein) as total_protein,
            SUM(carbs) as total_carbs,
            SUM(fat) as total_fat
          FROM foods
          WHERE date = ?
        `,
        args: [date]
      });

      const summary = result.rows[0] || { entries_count: 0, total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 };
      
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
          const result = await client.execute({
            sql: 'SELECT * FROM daily_goals WHERE date = ?',
            args: [id]
          });
          
          const goals = result.rows[0] || { calories: 2000, protein: 200, carbs: 250, fat: 65 };
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(goals)
          };
        } else {
          // Get all goals
          const result = await client.execute('SELECT * FROM daily_goals ORDER BY date DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows)
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

        const sql = `
          INSERT OR REPLACE INTO daily_goals (calories, protein, carbs, fat, date)
          VALUES (?, ?, ?, ?, ?)
        `;

        const args = [calories, protein, carbs, fat, date];
        await client.execute({ sql, args });

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
