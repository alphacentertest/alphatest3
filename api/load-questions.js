const ExcelJS = require('exceljs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { test } = req.query;
    const fileMap = {
      'questions1': 'questions1.xlsx',
      'questions2': 'questions2.xlsx'
    };

    if (!fileMap[test]) {
      return res.status(400).json({ message: 'Невірний тест' });
    }

    const filePath = path.join(__dirname, `../${fileMap[test]}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet('Questions');
    if (!worksheet) {
      return res.status(500).json({ message: 'Аркуш "Questions" не знайдено' });
    }

    const questions = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Пропускаем заголовок
      const question = {
        picture: row.getCell(1).value, // Picture
        question: row.getCell(2).value, // Question
        options: Array.from({ length: 12 }, (_, i) => row.getCell(i + 3).value), // Option 1-12
        correctAnswers: Array.from({ length: 12 }, (_, i) => row.getCell(i + 15).value), // Correct Answer 1-12
        type: row.getCell(27).value, // Type
        points: row.getCell(28).value // Points
      };
      questions.push(question);
    });

    res.status(200).json({ questions });
  } catch (error) {
    console.error('Помилка:', error);
    res.status(500).json({ message: 'Помилка завантаження питань' });
  }
};