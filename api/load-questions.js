const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { test } = req.query; // Отримуємо параметр test (questions1 або questions2)
    const filePath = path.join(__dirname, `../${test}.xlsx`);

    // Читаємо файл за допомогою ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('Questions'); // Змініть на правильну назву листа, якщо потрібно
    const questions = [];

    // Перетворюємо дані з листа в JSON
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаємо заголовок
      const question = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value;
        question[header] = cell.value;
      });
      questions.push(question);
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error('Помилка:', error);
    res.status(500).json({ error: 'Помилка завантаження питань' });
  }
};