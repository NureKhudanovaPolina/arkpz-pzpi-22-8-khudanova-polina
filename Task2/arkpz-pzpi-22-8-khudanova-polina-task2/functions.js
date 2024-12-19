// functions.js
const bcrypt = require('bcrypt');
const client = require('./db');

// Функція для реєстрації користувача
const registerUser = async (username, password, userGroupId) => {
    try {
        // Хешуємо пароль за допомогою bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL запит для додавання користувача в таблицю users
        const query = `
            INSERT INTO users (username, password, user_group_id, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING *;
        `;
        const values = [username, hashedPassword, userGroupId];

        // Виконуємо запит до бази даних
        const res = await client.query(query, values);
        console.log("Користувач зареєстрований:", res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error("Помилка при реєстрації користувача:", err.stack);
        throw err;
    }
};

// Функція для авторизації користувача
const loginUser = async (username, password) => {
    try {
        // SQL запит для пошуку користувача за іменем
        const query = 'SELECT * FROM users WHERE username = $1;';
        const values = [username];

        // Виконуємо запит до бази даних
        const res = await client.query(query, values);

             // Перевіряємо, чи знайдений користувач
             if (res.rows.length === 0) {
                throw new Error("Користувач не знайдений");
            }
    
            const user = res.rows[0];
    
            // Порівнюємо введений пароль з хешованим паролем у базі даних
            const isMatch = await bcrypt.compare(password, user.password);
    
            if (!isMatch) {
                throw new Error("Невірний пароль");
            }
    
            console.log("Користувач авторизований:", user);
            return user;
        } catch (err) {
            console.error("Помилка при авторизації користувача:", err.stack);
            throw err;
        }
    };
    
    module.exports = {
        registerUser,
        loginUser
    };
    
