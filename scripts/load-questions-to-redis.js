const ExcelJS = require('exceljs');
const path = require('path');
const Redis = require('ioredis');
require('dotenv').config(); // Для загрузки переменных окружения из .env

// Подключаемся к Redis
const redis = new Redis(process.env.REDIS_URL);

async function loadQuestionsToRedis() {
  try {
    const files = ['questions1.xlsx', 'questions2.xlsx'];
    for (const file of files) {
      const testKey = file.split('.')[0]; // Например, "questions1"
      const filePath = path.join(__dirname, '../data', file);
      console.log(`File path for ${file}:`, filePath);

      const workbook = new ExcelJS.Workbook();
      console.log(`Reading ${file}`);
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet('Questions');
      if (!worksheet) {
        throw new Error(`Worksheet "Questions" not found in ${file}`);
      }

      const questions = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Пропускаем заголовок
        const question = {
          picture: row.getCell(1).value, // Picture
          question: row.getCell(2).value, // Question
          options: Array.from({ length: 12 }, (_, i) => row.getCell(i + 3).value || null), // Option 1-12
          correctAnswers: Array.from({ length: 12 }, (_, i) => row.getCell(i + 15).value || null), // Correct Answer 1-12
          type: row.getCell(27).value, // Type
          points: parseInt(row.getCell(28).value) || 1 // Points (колонка 28)
        };
        questions.push(question);
      });

      // Сохраняем вопросы в Redis
      await redis.set(`questions:${testKey}`, JSON.stringify(questions));
      console.log(`Questions from ${file} successfully loaded into Redis:`, questions);
    }

    // Закрываем соединение с Redis
    await redis.quit();
  } catch (error) {
    console.error('Error loading questions to Redis:', error);
  }
}

loadQuestionsToRedis();