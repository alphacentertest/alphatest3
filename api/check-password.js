const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  console.log('Received request to /api/check-password');
  try {
    const { password } = req.body;
    console.log('Request body:', req.body);
    if (!password) {
      console.log('Password not provided');
      return res.status(400).json({ success: false, message: 'Пароль не введено' });
    }

    console.log('Password provided:', password);

    const filePath = path.join(__dirname, '../users.xlsx');
    console.log('File path for users.xlsx:', filePath);

    const workbook = new ExcelJS.Workbook();
    console.log('Reading users.xlsx');
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Users');
    if (!worksheet) {
      console.error('Worksheet "Users" not found in users.xlsx');
      return res.status(500).json({ success: false, message: 'Аркуш "Users" не найдено' });
    }

    console.log('Worksheet "Users" found');
    let isValid = false;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок
      const storedPassword = row.getCell(2).value; // Пароль во второй колонке
      console.log('Stored password at row', rowNumber, ':', storedPassword);
      if (storedPassword === password) {
        isValid = true;
      }
    });

    if (isValid) {
      console.log('Password is valid');
      res.status(200).json({ success: true });
    } else {
      console.log('Password is invalid');
      res.status(401).json({ success: false, message: 'Пароль невірний' });
    }
  } catch (error) {
    console.error('Error in /api/check-password:', error);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
};