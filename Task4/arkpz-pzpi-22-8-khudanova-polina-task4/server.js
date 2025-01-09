const express = require('express');
const client = require('./db');
const { registerUser, loginUser, addPet, addFeeder, getAllUsers, deleteUser, deletePet } = require('./functions');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET_KEY = 'your_secret_key'; // Должен совпадать с ключом в functions.js

// Настройка Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API для PawTracker',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      {
        name: 'Admin',
        description: 'Функції для адміністратора.',
      },
      {
        name: 'Default',
        description: 'Функції для звичайного користувача.',
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Реєстрація користувача
 *     description: Реєстрація нового користувача
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
 *               role:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *               - role
 *     responses:
 *       200:
 *         description: Користувач успішно зареєстрований
 *       400:
 *         description: Помилка при реєстрації користувача
 */
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await registerUser(username, password, role);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Помилка при реєстрації користувача' });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Default
 *     summary: Авторизація користувача
 *     description: Авторизація користувача для входу в систему
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
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Користувач успішно авторизований
 *       400:
 *         description: Невірний логін або пароль
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await loginUser(username, password);

    // Создаем токен с username и role
    const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY);
    console.log('Generated token:', token); // Логирование токена
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ error: 'Невірний логін або пароль' });
  }
});

// Middleware для проверки токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('Токен відсутній');
    return res.status(401).json({ error: 'Токен відсутній' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Недійсний токен', err);
      return res.status(403).json({ error: 'Недійсний токен' });
    }
    console.log('User from token:', user); // Логирование содержимого токена
    req.user = user;
    next();
  });
}

// Middleware для проверки роли администратора
function isAdmin(req, res, next) {
  console.log('User from token in isAdmin:', req.user); // Логирование содержимого токена
  if (req.user.role !== 'admin') {
    console.log('Доступ заборонено: роль не admin');
    return res.status(403).json({ error: 'Доступ заборонено' });
  }
  next();
}

/**
 * @swagger
 * /pet:
 *   post:
 *     tags:
 *       - Default
 *     summary: Додавання нового питомця
 *     description: Додавання нового питомця до системи
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               species:
 *                 type: string
 *               breed:
 *                 type: string
 *               age:
 *                 type: integer
 *               weight:
 *                 type: number
 *               health_status:
 *                 type: string
 *             required:
 *               - name
 *               - species
 *               - breed
 *               - age
 *               - weight
 *               - health_status
 *     responses:
 *       200:
 *         description: Питомця успішно додано
 *       400:
 *         description: Помилка при додаванні питомця
 */
app.post('/pet', authenticateToken, async (req, res) => {
  const { name, species, breed, age, weight, health_status } = req.body;
  try {
    // Получаем user_id из базы данных по username
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userRes = await client.query(userQuery, [req.user.username]);
    const userId = userRes.rows[0].id;

    // Передаем user_id в addPet
    const pet = await addPet(userId, name, species, breed, age, weight, health_status);
    res.status(200).json(pet);
  } catch (err) {
    console.error('Ошибка добавления питомца:', err);
    res.status(400).json({ error: 'Помилка при додаванні питомця' });
  }
});

/**
 * @swagger
 * /feeder:
 *   post:
 *     tags:
 *       - Default
 *     summary: Додавання нової кормушки
 *     description: Додавання нової кормушки до системи
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pet_id:
 *                 type: integer
 *               food:
 *                 type: string
 *               temperature:
 *                 type: number
 *               humidity:
 *                 type: number
 *             required:
 *               - pet_id
 *               - food
 *               - temperature
 *               - humidity
 *     responses:
 *       200:
 *         description: Кормушка успішно додана
 *       400:
 *         description: Помилка при додаванні кормушки
 */
app.post('/feeder', authenticateToken, async (req, res) => {
  const { pet_id, food, temperature, humidity } = req.body;
  try {
    // Проверяем, существует ли pet_id в таблице pet
    const petQuery = 'SELECT id FROM pet WHERE id = $1';
    const petRes = await client.query(petQuery, [pet_id]);

    if (petRes.rows.length === 0) {
      return res.status(400).json({ error: 'Питомец з таким ID не знайдений' });
    }

    // Если pet_id существует, добавляем кормушку
    const feeder = await addFeeder(pet_id, food, temperature, humidity);
    res.status(200).json(feeder);
  } catch (err) {
    console.error('Ошибка добавления кормушки:', err);
    res.status(400).json({ error: 'Помилка при додаванні кормушки' });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Отримання всіх користувачів
 *     description: Отримання списку всіх користувачів (тільки для адміністраторів)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список користувачів
 *       400:
 *         description: Помилка при отриманні списку користувачів
 */
app.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error('Ошибка при получении списка пользователей:', err);
    res.status(400).json({ error: 'Помилка при отриманні списку користувачів' });
  }
});

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Видалення користувача
 *     description: Видалення користувача (тільки для адміністраторів)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID користувача для видалення
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Користувача успішно видалено
 *       400:
 *         description: Помилка при видаленні користувача
 */
app.delete('/user/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await deleteUser(id);
    res.status(200).json({ message: 'Користувача успішно видалено' });
  } catch (err) {
    console.error('Ошибка при удалении пользователя:', err);
    res.status(400).json({ error: 'Помилка при видаленні користувача' });
  }
});

/**
 * @swagger
 * /pet/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Видалення питомця
 *     description: Видалення питомця (тільки для адміністраторів)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID питомця для видалення
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Питомця успішно видалено
 *       400:
 *         description: Помилка при видаленні питомця
 */
app.delete('/pet/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await deletePet(id);
    res.status(200).json({ message: 'Питомця успішно видалено' });
  } catch (err) {
    console.error('Ошибка при удалении питомца:', err);
    res.status(400).json({ error: 'Помилка при видаленні питомця' });
  }
});

// Запуск сервера
app.listen(3000, () => {
  console.log('Сервер запущено на http://localhost:3000');
});