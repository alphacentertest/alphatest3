const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Пароль не введено' });
    }

    const filePath = path.join(__dirname, '../users.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Users');
    if (!worksheet) {
      return res.status(500).json({ success: false, message: 'Аркуш "Users" не знайдено' });
    }

    let isValid = false;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок
      if (row.getCell(1).value === password) {
        isValid = true;
      }
    });

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