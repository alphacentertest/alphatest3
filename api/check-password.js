const XLSX = require('xlsx');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Отримуємо пароль із запиту
    const { password } = req.body;

    // Читаємо файл users.xlsx
    const filePath = path.join(__dirname, '../users.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['Users'];
    const users = XLSX.utils.sheet_to_json(sheet);

    // Перевіряємо, чи є введений пароль у списку
    const isValid = users.some(user => user.Password === password);

    if (isValid) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Пароль невірний' });
    }
  } catch (error) {
    console.error('Помилка:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
};