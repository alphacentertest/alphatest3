const Redis = require('ioredis');
const retry = require('async-retry');

// Настройка Redis с повторными попытками подключения
async function createRedisClient() {
  return await retry(
    async () => {
      const client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 1000, 5000);
          console.log(`Retrying Redis connection, attempt ${times}, delay ${delay}ms`);
          return delay;
        },
      });

      // Проверяем подключение
      await client.ping();
      console.log('Successfully connected to Redis');
      return client;
    },
    {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (err) => {
        console.error('Redis connection error:', err);
      },
    }
  );
}

let redis;
(async () => {
  try {
    redis = await createRedisClient();
  } catch (error) {
    console.error('Failed to connect to Redis after retries:', error);
    process.exit(1);
  }
})();

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
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// Проверка пароля
async function checkPassword(req, res) {
  console.log('Received request to check-password');
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Пароль не введено' });
  }

  const usersData = await redis.get('users') || '[]';
  const users = JSON.parse(usersData);
  let isValid = false;
  let username = '';
  let role = 'user';

  for (const user of users) {
    if (user.password === password) {
      isValid = true;
      username = user.username;
      if (username.toLowerCase() === 'admin') {
        role = 'admin';
      }
      break;
    }
  }

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

  const fileMap = {
    'questions1': 'questions1.xlsx',
    'questions2': 'questions2.xlsx',
  };

  if (!fileMap[test]) {
    console.error('Invalid test parameter:', test);
    return res.status(400).json({ message: 'Невірний тест' });
  }

  const questionsData = await redis.get(`questions:${test}`) || '[]';
  const questions = JSON.parse(questionsData);
  if (!questions || questions.length === 0) {
    console.error(`Questions data not found in Redis for test: ${test}`);
    return res.status(500).json({ message: `Питання для тесту ${test} не знайдено` });
  }

  console.log('Loaded questions from Redis:', questions);
  res.status(200).json({ questions });
}

// Выход из системы
async function logout(req, res) {
  res.status(200).json({ success: true });
}

// Получение результатов
async function getResults(req, res) {
  const results = await redis.get('results') || '[]';
  res.status(200).json(JSON.parse(results));
}

// Сохранение результата
async function saveResult(req, res) {
  const { username, totalPoints, maxPoints, percentage, startTime, duration, suspiciousActivity, answers } = req.body;
  if (!username || totalPoints === undefined || maxPoints === undefined || percentage === undefined || !startTime || !duration || suspiciousActivity === undefined || !answers) {
    console.error('Incomplete data for saving result:', req.body);
    return res.status(400).json({ success: false, message: 'Неповні дані для збереження результату' });
  }

  let results = JSON.parse(await redis.get('results') || '[]');
  results.push({ username, totalPoints, maxPoints, percentage, startTime, duration, suspiciousActivity, answers });
  await redis.set('results', JSON.stringify(results));
  res.status(200).json({ success: true });
}

// Удаление результата
async function deleteResult(req, res) {
  const { index } = req.body;
  if (index === undefined) {
    return res.status(400).json({ success: false, message: 'Індекс результату не вказано' });
  }

  let results = JSON.parse(await redis.get('results') || '[]');
  if (index < 0 || index >= results.length) {
    return res.status(400).json({ success: false, message: 'Невірний індекс результату' });
  }
  results.splice(index, 1);
  await redis.set('results', JSON.stringify(results));
  res.status(200).json({ success: true });
}

// Получение списка тестов
async function getTests(req, res) {
  let tests = await redis.get('tests') || '[]';
  tests = JSON.parse(tests);
  if (!tests || tests.length === 0) {
    tests = [
      { id: 'test1', name: 'Тест 1', file: 'questions1.xlsx', time: 10 },
      { id: 'test2', name: 'Тест 2', file: 'questions2.xlsx', time: 10 },
    ];
    await redis.set('tests', JSON.stringify(tests));
  }
  res.status(200).json(tests);
}

// Создание теста
async function createTest(req, res) {
  const { name, file, time } = req.body;
  if (!name || !file || !time) {
    return res.status(400).json({ success: false, message: 'Заповніть усі поля' });
  }

  let tests = JSON.parse(await redis.get('tests') || '[]');
  tests.push({ id: `test${tests.length + 1}`, name, file, time: parseInt(time) });
  await redis.set('tests', JSON.stringify(tests));
  res.status(200).json({ success: true });
}

// Обновление теста
async function updateTest(req, res) {
  const { index, name, file, time } = req.body;
  if (index === undefined || !name || !file || !time) {
    return res.status(400).json({ success: false, message: 'Заповніть усі поля' });
  }

  let tests = JSON.parse(await redis.get('tests') || '[]');
  if (index < 0 || index >= tests.length) {
    return res.status(400).json({ success: false, message: 'Невірний індекс тесту' });
  }
  tests[index] = { ...tests[index], name, file, time: parseInt(time) };
  await redis.set('tests', JSON.stringify(tests));
  res.status(200).json({ success: true });
}

// Удаление теста
async function deleteTest(req, res) {
  const { index } = req.body;
  if (index === undefined) {
    return res.status(400).json({ success: false, message: 'Індекс тесту не вказано' });
  }

  let tests = JSON.parse(await redis.get('tests') || '[]');
  if (index < 0 || index >= tests.length) {
    return res.status(400).json({ success: false, message: 'Невірний індекс тесту' });
  }
  tests.splice(index, 1);
  await redis.set('tests', JSON.stringify(tests));
  res.status(200).json({ success: true });
}