// 1. Підключення необхідних бібліотек
const express = require('express');
const client = require('./db');  // Підключення до бази даних
const { registerUser, loginUser } = require('./functions');  // Функції для реєстрації та логіну
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// 2. Ініціалізація сервера
const app = express();
app.use(express.json());  // Для парсингу JSON в запитах

// 3. Налаштування Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PetTracker API',
      version: '1.0.0',
      description: 'API для реєстрації та авторизації користувачів, управління домашніми тваринами, здоров’ям та харчуванням',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./server.js'],  // Файл, в якому описані API ендпоінти
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// 4. Використовуємо Swagger UI для документування API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 5. Реєстрація нового користувача
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     description: Додає нового користувача до системи.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               userGroupId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Користувача успішно зареєстровано
 *       400:
 *         description: Невірні дані
 *       500:
 *         description: Помилка на сервері
 */
app.post('/register', async (req, res) => {
  const { username, password, userGroupId } = req.body;
  try {
    const user = await registerUser(username, password, userGroupId);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Помилка при реєстрації користувача' });
  }
});

// 6. Логін користувача
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Логін користувача
 *     description: Логін користувача для доступу до системи.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успішний логін
 *       400:
 *         description: Невірний логін або пароль
 *       500:
 *         description: Помилка на сервері
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await loginUser(username, password);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Невірний логін або пароль' });
  }
});

// 7. Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
