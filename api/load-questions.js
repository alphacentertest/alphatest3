const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  console.log('api/load-questions.js: Отримано запит:', req.method, req.url);
  console.log('api/load-questions.js: Параметри запиту:', req.query);

  try {
    const { test } = req.query;
    console.log('api/load-questions.js: Отриманий параметр test:', test);

    const filePath = path.join(__dirname, `../${test}.xlsx`);
    console.log('api/load-questions.js: Шлях до файлу:', filePath);

    const workbook = new ExcelJS.Workbook();
    console.log('api/load-questions.js: Читаємо файл...');
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Questions'); // Змініть на правильну назву листа
    if (!worksheet) {
      console.error('api/load-questions.js: Лист "Sheet1" не знайдено в', test);
      return res.status(500).json({ error: 'Помилка: лист "Sheet1" не знайдено' });
    }
    console.log('api/load-questions.js: Лист "Sheet1" знайдено');

    const questions = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаємо заголовок
      const question = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value;
        question[header] = cell.value;
      });
      questions.push(question);
    });
    console.log('api/load-questions.js: Завантажені питання:', questions);

    res.status(200).json(questions);
  } catch (error) {
    console.error('api/load-questions.js: Помилка:', error);
    res.status(500).json({ error: 'Помилка завантаження питань' });
  }
};