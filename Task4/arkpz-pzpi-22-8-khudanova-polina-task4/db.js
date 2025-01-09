const mqtt = require('mqtt');
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

if (!pool) {
  console.error('Pool не визначено. Перевірте підключення до бази даних.');
  return; // Вихід із сервера
}

// Підключення до MQTT брокера
const mqttBroker = 'mqtt://broker.hivemq.com'; // Публічний MQTT брокер
const topic = 'feeder/data';

const mqttClient = mqtt.connect(mqttBroker);

mqttClient.on('connect', () => {
  console.log('Підключено до MQTT брокера');
  mqttClient.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Підписка на топік: ${topic}`);
    } else {
      console.error('Помилка підписки:', err);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
    console.log(`Отримано повідомлення з топіка: ${topic}`);
    let payload;
  
    try {
      console.log('Отримане повідомлення:', message.toString());
      payload = JSON.parse(message.toString());
  
      // Перевірка на відсутність необхідних даних
      if (!payload.id || !payload.temperature || !payload.humidity) {
        console.error('Відсутні необхідні дані у повідомленні:', payload);
        throw new Error('Відсутні необхідні дані');
      }
  
      // Пошук запису по feeder_id
      const checkQuery = 'SELECT * FROM feeder WHERE id = $1';
      const checkRes = await pool.query(checkQuery, [payload.id]);
  
      // Якщо запис знайдений, оновлюємо дані
      if (checkRes.rowCount > 0) {
        const updateQuery = `
          UPDATE feeder
          SET temperature = $1, humidity = $2, last_updated = CURRENT_TIMESTAMP
          WHERE id = $3
        `;
        const values = [payload.temperature, payload.humidity, payload.id];
  
        console.log('Спроба оновити дані в базі:', values);
        await pool.query(updateQuery, values);
        console.log('Дані успішно оновлені в базі даних');
      } else {
        console.error(`Запис з feeder_id ${payload.id} не знайдений в базі даних`);
      }
    } catch (err) {
      console.error('Помилка при обробці повідомлення або оновленні бази даних:', err.message);
    }
  });
  

// Закриття підключень при завершенні роботи
process.on('exit', () => {
  console.log('Завершення роботи сервера. Закриття з\'єднань');
  pool.end();
  mqttClient.end();
});

module.exports = pool;
