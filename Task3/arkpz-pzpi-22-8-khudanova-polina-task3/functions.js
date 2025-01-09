// functions.js
const bcrypt = require('bcrypt');
const client = require('./db');


const jwt = require('jsonwebtoken'); // Подключаем jsonwebtoken

// Секретный ключ для подписи токена (замените на свой в production!)
const SECRET_KEY = 'super_secret_key';

// Функция для создания токена
const generateToken = (user) => {
    // Создаем payload (что хранится в токене)
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role // Роль (admin или user)
    };

    // Генерируем токен, который будет действителен 24 часа
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
};
// Middleware для проверки токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader); // Логирование заголовка
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
      console.log('User from token:', user);  // Логирование содержимого токена
      req.user = user;
      next();
    });
  }

// Middleware для проверки роли admin
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ заборонено' });
    }
    next(); // Если роль admin, продолжаем выполнение
};


// Функція для реєстрації користувача
const registerUser = async (username, password, userRole) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const query = `
        INSERT INTO users (username, password, user_role, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *;
      `;
      const values = [username, hashedPassword, userRole];
  
      const res = await client.query(query, values);
  
      const token = generateToken(res.rows[0]);
      return { user: res.rows[0], token };
    } catch (err) {
      console.error("Ошибка регистрации:", err.stack);
      throw err;
    }
  };
  


// Функція для авторизації користувача
const loginUser = async (username, password) => {
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];
    const res = await client.query(query, values);
  
    if (res.rows.length === 0) {
      throw new Error('Пользователь не найден!');
    }
  
    const user = res.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
  
    if (!isValid) {
      throw new Error('Неверный пароль!');
    }
  
    return { username: user.username, role: user.user_role }; 
  };

const addUser = async (username, password, role) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (username, password, user_role, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING *;
        `;
        const values = [username, hashedPassword, role];
        const res = await client.query(query, values);
        return res.rows[0];
    } catch (err) {
        console.error('Ошибка добавления пользователя:', err);
        throw err;
    }
};
const addPet = async (userId, name, species, breed, age, weight, healthStatus) => {
  try {
    const query = `
      INSERT INTO pet (user_id, name, species, breed, age, weight, health_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `;
    const values = [userId, name, species, breed, age, weight, healthStatus];
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Ошибка добавления питомца:', err);
    throw err;
  }
};

const addFeeder = async (petId, food, temperature, humidity) => {
  try {
    const query = `
      INSERT INTO feeder (pet_id, food, last_updated, temperature, humidity)
      VALUES ($1, $2, NOW(), $3, $4)
      RETURNING *;
    `;
    const values = [petId, food, temperature, humidity];
    const res = await client.query(query, values);
    return res.rows[0];
  } catch (err) {
    console.error('Ошибка добавления кормушки:', err);
    throw err;
  }
};

const getAllUsers = async () => {
  try {
    const query = 'SELECT * FROM users';
    const res = await client.query(query);
    return res.rows;
  } catch (err) {
    console.error('Ошибка при получении списка пользователей:', err);
    throw err;
  }
};

// Функция для удаления пользователя
const deleteUser = async (id) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1';
    const values = [id];
    await client.query(query, values);
  } catch (err) {
    console.error('Ошибка при удалении пользователя:', err);
    throw err;
  }
};
const deletePet = async (id) => {
  try {
    const query = 'DELETE FROM pet WHERE id = $1';
    const values = [id];
    await client.query(query, values);
  } catch (err) {
    console.error('Ошибка при удалении питомца:', err);
    throw err;
  }
};

const updateUserRole = async (userId, role) => {
    try {
      const query = `
        UPDATE users
        SET user_role = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `;
      const values = [role, userId];
      const res = await client.query(query, values);
      return res.rows[0];
    } catch (err) {
      console.error('Ошибка обновления роли пользователя:', err);
      throw err;
    }
  };
  
  const updateFeederFood = async (feederId, food) => {
    try {
      const query = `
        UPDATE feeder
        SET food = $1, last_updated = NOW()
        WHERE id = $2
        RETURNING *;
      `;
      const values = [food, feederId];
      const res = await client.query(query, values);
      return res.rows[0];
    } catch (err) {
      console.error('Ошибка обновления еды в кормушке:', err);
      throw err;
    }
  };
  function isAdmin(req, res, next) {
    console.log('User from token in isAdmin:', req.user);  // Логирование содержимого токена
    if (!req.user || !req.user.role) {
      console.log('Роль користувача не визначена');
      return res.status(403).json({ error: 'Доступ заборонено: роль не визначена' });
    }
    if (req.user.role !== 'admin') {
      console.log('Доступ заборонено: роль не admin');
      return res.status(403).json({ error: 'Доступ заборонено' });
    }
    next();
  }
    
    module.exports = {
        registerUser,
        loginUser,
        addUser,
        deleteUser,
        addPet,
        addFeeder,
        getAllUsers,
        updateFeederFood,
        updateUserRole,
        authorizeAdmin,
        deletePet,
        authenticateToken,
        isAdmin
    };
    
