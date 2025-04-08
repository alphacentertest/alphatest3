const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  console.log('api/check-password.js: Отримано запит:', req.method, req.url);
  console.log('api/check-password.js: Параметри запиту:', req.body);

  try {
    const { password } = req.body;
    console.log('api/check-password.js: Отриманий пароль:', password);

    const filePath = path.join(__dirname, '../users.xlsx');
    console.log('api/check-password.js: Шлях до файлу users.xlsx:', filePath);

    const workbook = new ExcelJS.Workbook();
    console.log('api/check-password.js: Читаємо файл users.xlsx...');
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet('Users');
    if (!sheet) {
      console.error('api/check-password.js: Лист "Users" не знайдено в users.xlsx');
      return res.status(500).json({ success: false, message: 'Помилка сервера: лист "Users" не знайдено' });
    }
    console.log('api/check-password.js: Лист "Users" знайдено');

    const users = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаємо заголовок
      const user = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = sheet.getRow(1).getCell(colNumber).value;
        user[header] = cell.value;
      });
      users.push(user);
    });
    console.log('api/check-password.js: Користувачі з users.xlsx:', users);

    const isValid = users.some(user => user.Password === password);
    console.log('api/check-password.js: Перевірка пароля:', { password, isValid });

    if (isValid) {
      console.log('api/check-password.js: Пароль правильний, повертаємо success: true');
      res.status(200).json({ success: true });
    } else {
      console.log('api/check-password.js: Пароль неправильний, повертаємо success: false');
      res.status(401).json({ success: false, message: 'Пароль невірний' });
    }
  } catch (error) {
    console.error('api/check-password.js: Помилка:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
};