const { Pool } = require('pg');

// Підключення до PostgreSQL
const pool = new Pool({
  user: 'postgres',         // ваше ім'я користувача
  host: 'localhost',
  database: 'PawTracker',   // назва вашої бази даних
  password: '0558',         // ваш пароль
  port: 5432,
});

// Перевірка підключення до бази даних
pool.connect()
  .then(() => {
    console.log('Підключено до бази даних');
  })
  .catch(err => {
    console.error('Помилка при підключенні до бази даних:', err.message);
  });






module.exports = pool;
