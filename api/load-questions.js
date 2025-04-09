const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
  console.log('Received request to /api/load-questions');
  try {
    const { test } = req.query;
    console.log('Query parameter test:', test);

    const fileMap = {
      'questions1': 'questions1.xlsx',
      'questions2': 'questions2.xlsx'
    };

    if (!fileMap[test]) {
      console.error('Invalid test parameter:', test);
      return res.status(400).json({ message: 'Невірний тест' });
    }

    // Файлы находятся в папке data/
    const filePath = path.join(__dirname, '../data', fileMap[test]);
    console.log('File path for questions file:', filePath);

    // Проверяем, существует ли файл
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return res.status(500).json({ message: `Файл ${fileMap[test]} не знайдено` });
    }

    const workbook = new ExcelJS.Workbook();
    console.log('Reading questions file:', fileMap[test]);
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Questions');
    if (!worksheet) {
      console.error('Worksheet "Questions" not found in file:', fileMap[test]);
      return res.status(500).json({ message: 'Аркуш "Questions" не знайдено' });
    }

    console.log('Worksheet "Questions" found');
    const questions = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок
      const question = {
        picture: row.getCell(1).value, // Picture
        question: row.getCell(2).value, // Question
        options: Array.from({ length: 12 }, (_, i) => row.getCell(i + 3).value || null), // Option 1-12
        correctAnswers: Array.from({ length: 12 }, (_, i) => row.getCell(i + 15).value || null), // Correct Answer 1-12
        type: row.getCell(27).value, // Type
        points: row.getCell(28).value // Points
      };
      questions.push(question);
    });

    console.log('Loaded questions:', questions);
    res.status(200).json({ questions });
  } catch (error) {
    console.error('Error in /api/load-questions:', error);
    res.status(500).json({ message: 'Помилка завантаження питань', error: error.message });
  }
};