const ExcelJS = require('exceljs');
const path = require('path');
const Redis = require('ioredis');

// Подключаемся к Redis
const redis = new Redis(process.env.REDIS_URL);

module.exports = async (req, res) => {
  const { action } = req.query;

  try {
    switch (action) {
      case 'check-password':
        await checkPassword(req, res);
        break;
      case 'load-questions':
        await loadQuestions(req, res);
        break;
      case 'logout':
        await logout(req, res);
        break;
      case 'get-results':
        await getResults(req, res);
        break;
      case 'save-result':
        await saveResult(req, res);
        break;
      case 'delete-result':
        await deleteResult(req, res);
        break;
      case 'get-tests':
        await getTests(req, res);
        break;
      case 'create-test':
        await createTest(req, res);
        break;
      case 'update-test':
        await updateTest(req, res);
        break;
      case 'delete-test':
        await deleteTest(req, res);
        break;
      default:
        res.status(400).json({ message: 'Невірна дія' });
    }
  } catch (error) {
    console.error(`Error in /api/script (action: ${action}):`, error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// Проверка пароля
async function checkPassword(req, res) {
  console.log('Received request to check-password');
  const { password } = req.body;
  console.log('Request body:', req.body);
  if (!password) {
    console.log('Password not provided');
    return res.status(400).json({ success: false, message: 'Пароль не введено' });
  }

  console.log('Password provided:', password);

  const filePath = path.join(__dirname, '../data/users.xlsx');
  console.log('File path for users.xlsx:', filePath);

  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    return res.status(500).json({ message: 'Файл users.xlsx не знайдено' });
  }

  const workbook = new ExcelJS.Workbook();
  console.log('Reading users.xlsx');
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet('Users');
  if (!worksheet) {
    console.error('Worksheet "Users" not found in users.xlsx');
    return res.status(500).json({ success: false, message: 'Аркуш "Users" не знайдено' });
  }

  console.log('Worksheet "Users" found');
  let isValid = false;
  let username = '';
  let role = 'user';

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Пропускаем заголовок
    const storedUsername = row.getCell(1).value; // Имя пользователя в первой колонке
    const storedPassword = row.getCell(2).value; // Пароль во второй колонке
    console.log('Stored password at row', rowNumber, ':', storedPassword);
    if (storedPassword === password) {
      isValid = true;
      username = storedUsername;
      if (storedUsername.toLowerCase() === 'admin') {
        role = 'admin';
      }
    }
  });

  if (isValid) {
    console.log('Password is valid');
    res.status(200).json({ success: true, role, username });
  } else {
    console.log('Password is invalid');
    res.status(401).json({ success: false, message: 'Пароль невірний' });
  }
}

// Загрузка вопросов
async function loadQuestions(req, res) {
  console.log('Received request to load-questions');
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

  const filePath = path.join(__dirname, '../data', fileMap[test]);
  console.log('File path for questions file:', filePath);

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
      points: parseInt(row.getCell(28).value) || 1 // Points (колонка 28)
    };
    questions.push(question);
  });

  console.log('Loaded questions:', questions);
  res.status(200).json({ questions });
}

// Выход из системы
async function logout(req, res) {
  res.status(200).json({ success: true });
}

// Получение результатов
async function getResults(req, res) {
  try {
    const results = await redis.get('results') || '[]';
    res.status(200).json(JSON.parse(results));
  } catch (error) {
    console.error('Error getting results from Redis:', error);
    res.status(500).json({ success: false, message: 'Помилка завантаження результатів' });
  }
}

// Сохранение результата
async function saveResult(req, res) {
  const { username, totalPoints, maxPoints, percentage, startTime, duration, suspiciousActivity, answers } = req.body;
  if (!username || totalPoints === undefined || maxPoints === undefined || percentage === undefined || !startTime || !duration || suspiciousActivity === undefined || !answers) {
    console.error('Incomplete data for saving result:', req.body);
    return res.status(400).json({ success: false, message: 'Неповні дані для збереження результату' });
  }

  try {
    let results = await redis.get('results') || '[]';
    results = JSON.parse(results);
    results.push({ username, totalPoints, maxPoints, percentage, startTime, duration, suspiciousActivity, answers });
    await redis.set('results', JSON.stringify(results));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving result to Redis:', error);
    res.status(500).json({ success: false, message: 'Помилка збереження результату' });
  }
}

// Удаление результата
async function deleteResult(req, res) {
  const { index } = req.body;
  if (index === undefined) {
    return res.status(400).json({ success: false, message: 'Індекс результату не вказано' });
  }

  try {
    let results = await redis.get('results') || '[]';
    results = JSON.parse(results);
    if (index < 0 || index >= results.length) {
      return res.status(400).json({ success: false, message: 'Невірний індекс результату' });
    }
    results.splice(index, 1);
    await redis.set('results', JSON.stringify(results));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting result from Redis:', error);
    res.status(500).json({ success: false, message: 'Помилка видалення результату' });
  }
}

// Получение списка тестов
async function getTests(req, res) {
  try {
    let tests = await redis.get('tests');
    if (!tests) {
      tests = [
        { id: 'test1', name: 'Тест 1', file: 'questions1.xlsx', time: 10 },
        { id: 'test2', name: 'Тест 2', file: 'questions2.xlsx', time: 10 }
      ];
      await redis.set('tests', JSON.stringify(tests));
    } else {
      tests = JSON.parse(tests);
    }
    res.status(200).json(tests);
  } catch (error) {
    console.error('Error getting tests from Redis:', error);
    res.status(500).json({ success: false, message: 'Помилка завантаження тестів' });
  }
}

// Создание теста
async function createTest(req, res) {
  const { name, file, time } = req.body;
  if (!name || !file || !time) {
    console.error('Incomplete data for creating test:', req.body);
    return res.status(400).json({ success: false, message: 'Заповніть усі поля' });
  }

  try {
    let tests = await redis.get('tests') || '[]';
    tests = JSON.parse(tests);
    tests.push({ id: `test${tests.length + 1}`, name, file, time: parseInt(time) });
    await redis.set('tests', JSON.stringify(tests));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error creating test in Redis:', error);
    res.status(500).json({ success: false, message: 'Помилка створення тесту' });
  }
}

// Обновление теста
async function updateTest(req, res) {
  const { index, name, file, time } = req.body;
  if (index === undefined || !name || !file || !time) {
    console.error('Incomplete data for updating test:', req.body);
    return res.status(400).json({ success: false, message: 'Заповніть усі поля' });
  }

  try {
    let tests = await redis.get('tests') || '[]';
    tests = JSON.parse(tests);
    if (index < 0 || index >= tests.length) {
      return res.status(400).json({ success: false, message: 'Невірний індекс тесту' });
    }
    tests[index] = { ...tests[index], name, file, time: parseInt(time) };
    await redis.set('tests', JSON.stringify(tests));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating test in Redis:', error);
    res.status(500).json({ success: false, message: 'Помилка оновлення тесту' });
  }
}

// Удаление теста
async function deleteTest(req, res) {
  const { index } = req.body;
  if (index === undefined) {
    return res.status(400).json({ success: false, message: 'Індекс тесту не вказано' });
  }

  try {
    let tests = await redis.get('tests') || '[]';
    tests = JSON.parse(tests);
    if (index < 0 || index >= tests.length) {
      return res.status(400).json({ success: false, message: 'Невірний індекс тесту' });
    }
    tests.splice(index, 1);
    await redis.set('tests', JSON.stringify(tests));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting test from Redis:', error);
    res.status(500).json({ success: false, message: 'Помилка видалення тесту' });
  }
}