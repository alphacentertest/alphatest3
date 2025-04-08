const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  console.log('api/test.js: Отримано запит:', req.method, req.url);

  try {
    // Перевіряємо наявність index.html
    const indexPath = path.join(__dirname, '../index.html');
    const indexExists = fs.existsSync(indexPath);
    console.log('api/test.js: Перевірка наявності index.html:', indexExists);

    // Перевіряємо наявність questions1.xlsx
    const questions1Path = path.join(__dirname, '../questions1.xlsx');
    const questions1Exists = fs.existsSync(questions1Path);
    console.log('api/test.js: Перевірка наявності questions1.xlsx:', questions1Exists);

    // Перевіряємо наявність users.xlsx
    const usersPath = path.join(__dirname, '../users.xlsx');
    const usersExists = fs.existsSync(usersPath);
    console.log('api/test.js: Перевірка наявності users.xlsx:', usersExists);

    // Повертаємо результат
    res.status(200).json({
      message: 'Тестовий ендпоінт працює',
      files: {
        'index.html': indexExists,
        'questions1.xlsx': questions1Exists,
        'users.xlsx': usersExists
      }
    });
  } catch (error) {
    console.error('api/test.js: Помилка:', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};