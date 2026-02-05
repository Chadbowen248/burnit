-- burnit database schema
-- SQLite database for meal tracking

CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fat INTEGER DEFAULT 0,
    quantity REAL DEFAULT 1.0,
    unit TEXT DEFAULT 'serving',
    date TEXT NOT NULL, -- ISO date string
    meal_type TEXT DEFAULT 'snack', -- breakfast, lunch, dinner, snack
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
    date TEXT UNIQUE NOT NULL, -- ISO date string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS foods_date_idx ON foods(date);
CREATE INDEX IF NOT EXISTS foods_meal_type_idx ON foods(meal_type);
CREATE INDEX IF NOT EXISTS foods_favorite_idx ON foods(is_favorite);