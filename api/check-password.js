const ExcelJS = require('exceljs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не підтримується' });
  }

  const { password } = req.body;

  // Завантажуємо файл users.xlsx
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('users.xlsx');
  const worksheet = workbook.getWorksheet(1);
  let isValid = false;

  worksheet.eachRow((row) => {
    if (row.getCell(1).value === password) {
      isValid = true;
    }
  });

  if (isValid) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Пароль невірний' });
  }
};