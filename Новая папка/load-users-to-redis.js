const ExcelJS = require('exceljs');
const path = require('path');
const Redis = require('ioredis');
require('dotenv').config(); // Для загрузки переменных окружения из .env

// Подключаемся к Redis
const redis = new Redis(process.env.REDIS_URL);

async function loadUsersToRedis() {
  try {
    const filePath = path.join(__dirname, '../data/users.xlsx');
    console.log('File path for users.xlsx:', filePath);

    const workbook = new ExcelJS.Workbook();
    console.log('Reading users.xlsx');
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Users');
    if (!worksheet) {
      throw new Error('Worksheet "Users" not found in users.xlsx');
    }

    const users = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок
      const username = row.getCell(1).value; // Имя пользователя в первой колонке
      const password = row.getCell(2).value; // Пароль во второй колонке
      users.push({ username, password });
    });

    // Сохраняем пользователей в Redis
    await redis.set('users', JSON.stringify(users));
    console.log('Users successfully loaded into Redis:', users);

    // Закрываем соединение с Redis
    await redis.quit();
  } catch (error) {
    console.error('Error loading users to Redis:', error);
  }
}

loadUsersToRedis();