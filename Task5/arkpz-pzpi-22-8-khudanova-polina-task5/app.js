const express = require('express');
const { registerUser, loginUser } = require('./functions');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Налаштування JSON парсера для обробки запитів
app.use(express.json());

// Налаштування Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API для роботи з PetTracker',
      version: '1.0.0',
      description: 'API для реєстрації та авторизації користувачів у системі PetTracker'
    },
    servers: [
      {
        url: 'http://localhost:3000'
      }
    ]
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Підключення Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Маршрут для реєстрації користувача
app.post('/register', async (req, res) => {
  const { username, password, userGroupId } = req.body;
  try {
    const user = await registerUser(username, password, userGroupId);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Помилка при реєстрації користувача' });
  }
});

// Маршрут для авторизації користувача
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await loginUser(username, password);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Невірний логін або пароль' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
