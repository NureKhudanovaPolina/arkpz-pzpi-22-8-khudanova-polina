const { Client } = require('pg');

// Налаштування для підключення до PostgreSQL
const client = new Client({
    user: 'postgres',         
    host: 'localhost',      
    database: 'pettracker', 
    password: '0558',       
    port: 5432,             
});

// Підключення до бази даних
client.connect()
    .then(() => {
        console.log('Підключено до бази даних');
    })
    .catch((err) => {
        console.error('Помилка підключення до бази даних:', err.stack);
    });

module.exports = client;
