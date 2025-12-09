// lib/db.ts
import Database from 'better-sqlite3';

const db = new Database('shop.db'); 


db.pragma('journal_mode = WAL');


const initDb = () => {

  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);


  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )
  `);


  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      image TEXT,
      rating INTEGER DEFAULT 5,
      url TEXT,
      categoryId INTEGER,
      FOREIGN KEY(categoryId) REFERENCES categories(id)
    )
  `);


  db.exec(`
    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
};

initDb();

export default db;