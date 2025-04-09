const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Пароль не введено' });
    }

    console.log('Введенный пароль:', password);

    const filePath = path.join(__dirname, '../users.xlsx');
    console.log('Путь к файлу users.xlsx:', filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Users');
    if (!worksheet) {
      console.error('Аркуш "Users" не знайдено');
      return res.status(500).json({ success: false, message: 'Аркуш "Users" не знайдено' });
    }

    let isValid = false;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок
      const storedPassword = row.getCell(2).value; // Пароль находится во второй колонке
      console.log('Сохраненный пароль:', storedPassword);
      if (storedPassword === password) {
        isValid = true;
      }
    });

    if (isValid) {
      console.log('Пароль правильный');
      res.status(200).json({ success: true });
    } else {
      console.log('Пароль неправильный');
      res.status(401).json({ success: false, message: 'Пароль невірний' });
    }
  } catch (error) {
    console.error('Помилка:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
};