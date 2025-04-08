const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { password } = req.body;
    const filePath = path.join(__dirname, '../users.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet('Users');
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