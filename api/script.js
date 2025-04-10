const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

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
      points: row.getCell(28).value // Points
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
  const filePath = path.join(__dirname, '../data/results.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
  const results = JSON.parse(fs.readFileSync(filePath));
  res.status(200).json(results);
}

// Сохранение результата
async function saveResult(req, res) {
  const { username, totalPoints, maxPoints, percentage, startTime, duration, suspiciousActivity, answers } = req.body;
  const filePath = path.join(__dirname, '../data/results.json');
  let results = [];
  if (fs.existsSync(filePath)) {
    results = JSON.parse(fs.readFileSync(filePath));
  }
  results.push({ username, totalPoints, maxPoints, percentage, startTime, duration, suspiciousActivity, answers });
  fs.writeFileSync(filePath, JSON.stringify(results));
  res.status(200).json({ success: true });
}

// Удаление результата
async function deleteResult(req, res) {
  const { index } = req.body;
  const filePath = path.join(__dirname, '../data/results.json');
  let results = [];
  if (fs.existsSync(filePath)) {
    results = JSON.parse(fs.readFileSync(filePath));
  }
  results.splice(index, 1);
  fs.writeFileSync(filePath, JSON.stringify(results));
  res.status(200).json({ success: true });
}

// Получение списка тестов
async function getTests(req, res) {
  const filePath = path.join(__dirname, '../data/tests.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([
      { id: 'test1', name: 'Тест 1', file: 'questions1.xlsx', time: 10 },
      { id: 'test2', name: 'Тест 2', file: 'questions2.xlsx', time: 10 }
    ]));
  }
  const tests = JSON.parse(fs.readFileSync(filePath));
  res.status(200).json(tests);
}

// Создание теста
async function createTest(req, res) {
  const { name, file, time } = req.body;
  const filePath = path.join(__dirname, '../data/tests.json');
  let tests = [];
  if (fs.existsSync(filePath)) {
    tests = JSON.parse(fs.readFileSync(filePath));
  }
  tests.push({ id: `test${tests.length + 1}`, name, file, time });
  fs.writeFileSync(filePath, JSON.stringify(tests));
  res.status(200).json({ success: true });
}

// Обновление теста
async function updateTest(req, res) {
  const { index, name, file, time } = req.body;
  const filePath = path.join(__dirname, '../data/tests.json');
  let tests = [];
  if (fs.existsSync(filePath)) {
    tests = JSON.parse(fs.readFileSync(filePath));
  }
  tests[index] = { ...tests[index], name, file, time };
  fs.writeFileSync(filePath, JSON.stringify(tests));
  res.status(200).json({ success: true });
}

// Удаление теста
async function deleteTest(req, res) {
  const { index } = req.body;
  const filePath = path.join(__dirname, '../data/tests.json');
  let tests = [];
  if (fs.existsSync(filePath)) {
    tests = JSON.parse(fs.readFileSync(filePath));
  }
  tests.splice(index, 1);
  fs.writeFileSync(filePath, JSON.stringify(tests));
  res.status(200).json({ success: true });
}