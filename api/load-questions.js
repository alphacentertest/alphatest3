const ExcelJS = require('exceljs');

module.exports = async (req, res) => {
  const { test } = req.query;

  const fileMap = {
    'questions1': 'questions1.xlsx',
    'questions2': 'questions2.xlsx'
  };

  if (!fileMap[test]) {
    return res.status(400).json({ message: 'Невірний тест' });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(fileMap[test]);
  const worksheet = workbook.getWorksheet(1);
  const questions = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Пропускаємо заголовок
      questions.push(row.values);
    }
  });

  res.status(200).json({ questions });
};