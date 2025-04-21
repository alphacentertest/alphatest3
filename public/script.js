document.addEventListener('DOMContentLoaded', () => {
  // Элементы страниц
  const loginPage = document.getElementById('login-page');
  const testSelectionPage = document.getElementById('test-selection-page');
  const testPage = document.getElementById('test-page');
  const resultPage = document.getElementById('result-page');
  const adminPage = document.getElementById('admin-page');
  const resultsPage = document.getElementById('results-page');
  const answersPage = document.getElementById('answers-page');
  const createTestPage = document.getElementById('create-test-page');
  const editTestsPage = document.getElementById('edit-tests-page');

  // Элементы авторизации
  const passwordInput = document.getElementById('password-input');
  const togglePassword = document.getElementById('toggle-password');
  const submitButton = document.getElementById('submit-password');
  const errorElement = document.getElementById('error');
  const rememberMe = document.getElementById('remember-me');

  // Элементы теста
  const timerElement = document.getElementById('timer');
  const progressElement = document.getElementById('progress');
  const questionContainer = document.getElementById('question-container');
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');
  const finishButton = document.getElementById('finish');
  const modal = document.getElementById('modal');
  const confirmFinish = document.getElementById('confirm-finish');
  const cancelFinish = document.getElementById('cancel-finish');

  let currentUser = '';
  let currentRole = '';
  let currentQuestionIndex = 0;
  let questions = [];
  let selectedOptions = [];
  let timeLeft = 600; // 10 минут в секундах
  let timerInterval;
  let testStartTime = null;
  let timeOutsideTab = 0;
  let lastBlurTime = null;
  let testResults = [];
  let tests = [];

  // Функция переключения страниц
  function showPage(page) {
    console.log('Showing page:', page.id);
    loginPage.style.display = 'none';
    testSelectionPage.style.display = 'none';
    testPage.style.display = 'none';
    resultPage.style.display = 'none';
    adminPage.style.display = 'none';
    resultsPage.style.display = 'none';
    answersPage.style.display = 'none';
    createTestPage.style.display = 'none';
    editTestsPage.style.display = 'none';
    page.style.display = 'block';
  }

  // Загружаем сохраненный пароль, если он есть
  const savedPassword = localStorage.getItem('savedPassword');
  if (savedPassword) {
    passwordInput.value = savedPassword;
    rememberMe.checked = true;
  }

  // Показать/скрыть пароль
  togglePassword.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      togglePassword.textContent = 'Сховати';
    } else {
      passwordInput.type = 'password';
      togglePassword.textContent = 'Показати';
    }
  });

  // Обработка авторизации
  submitButton.addEventListener('click', async () => {
    const password = passwordInput.value;
    errorElement.textContent = '';

    try {
      const response = await fetch('/api/script?action=check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (result.success) {
        if (rememberMe.checked) {
          localStorage.setItem('savedPassword', password);
        } else {
          localStorage.removeItem('savedPassword');
        }
        currentUser = result.username || 'Admin';
        currentRole = result.role;
        if (currentRole === 'admin') {
          showPage(adminPage);
        } else {
          await loadTests();
          showPage(testSelectionPage);
        }
      } else {
        errorElement.textContent = result.message || 'Пароль невірний';
      }
    } catch (error) {
      console.error('Error during login:', error);
      errorElement.textContent = 'Помилка сервера';
    }
  });

  // Загрузка тестов
  async function loadTests() {
    try {
      const response = await fetch('/api/script?action=get-tests');
      tests = await response.json();
      const testButtons = document.getElementById('test-buttons');
      testButtons.innerHTML = '';
      tests.forEach(test => {
        const button = document.createElement('button');
        button.textContent = test.name;
        button.addEventListener('click', async () => {
          document.querySelectorAll('.test-buttons button').forEach(btn => btn.classList.remove('selected-test'));
          button.classList.add('selected-test');
          try {
            const response = await fetch(`/api/script?action=load-questions&test=${test.file.split('.')[0]}`);
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Не вдалося завантажити питання');
            }
            questions = (await response.json()).questions;
            selectedOptions = new Array(questions.length).fill(null);
            currentQuestionIndex = 0;
            timeLeft = test.time * 60;
            showPage(testPage);
            displayQuestion(currentQuestionIndex);
            startTimer();
          } catch (error) {
            console.error('Error loading questions:', error);
            alert('Помилка завантаження питань: ' + error.message);
          }
        });
        testButtons.appendChild(button);
      });
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  }

  // Отображение вопроса
  function displayQuestion(index) {
    console.log('Displaying question at index:', index);
    const question = questions[index];
    let html = '';

    if (question.picture) {
      html += `<img src="/images/${question.picture}.png" alt="Picture" style="max-width: 100%; margin-bottom: 10px;">`;
    }

    html += `<div class="question-box" onclick="toggleQuestionSelection(${index})">${index + 1}. ${question.question}</div>`;
    html += `<p class="instruction">${getInstruction(question.type)}</p>`;

    if (question.type === 'multiple') {
      question.options.forEach((option, i) => {
        if (option) {
          const isChecked = selectedOptions[index]?.includes(option) || false;
          html += `
            <div class="option-container ${isChecked ? 'selected' : ''}">
              <input type="checkbox" id="option-${index}-${i}" ${isChecked ? 'checked' : ''} onchange="selectOption(${index}, ${i}, this)">
              <label for="option-${index}-${i}">${option}</label>
            </div>`;
        }
      });
    } else if (question.type === 'input') {
      html += `<input type="text" id="answer-input" value="${selectedOptions[index] || ''}" oninput="updateSelection(${index}, this)">`;
    } else if (question.type === 'ordering') {
      html += `<div id="sortable">`;
      (selectedOptions[index] || question.options).forEach((option, i) => {
        if (option) {
          html += `<div class="sortable-item" draggable="true">${option}</div>`;
        }
      });
      html += `</div>`;
    }

    questionContainer.innerHTML = html;
    updateProgress();

    if (question.type === 'ordering') {
      setupDragAndDrop(index);
    }

    if (selectedOptions[index] && selectedOptions[index].length > 0) {
      const questionBox = document.querySelector('.question-box');
      if (questionBox) {
        questionBox.classList.add('selected');
      }
    }
  }

  function toggleQuestionSelection(index) {
    const questionBox = document.querySelector('.question-box');
    if (selectedOptions[index] && selectedOptions[index].length > 0) {
      questionBox.classList.add('selected');
    } else {
      questionBox.classList.remove('selected');
    }
  }

  function selectOption(index, optionIndex, checkbox) {
    const container = checkbox.parentElement;
    const option = questions[index].options[optionIndex];

    if (questions[index].type === 'multiple') {
      if (checkbox.checked) {
        container.classList.add('selected');
        if (!selectedOptions[index]) selectedOptions[index] = [];
        if (!selectedOptions[index].includes(option)) {
          selectedOptions[index].push(option);
        }
      } else {
        container.classList.remove('selected');
        if (selectedOptions[index]) {
          selectedOptions[index] = selectedOptions[index].filter(opt => opt !== option);
        }
      }
    } else {
      const allOptions = document.querySelectorAll(`#question-container input[type="checkbox"]`);
      allOptions.forEach(opt => {
        opt.checked = false;
        opt.parentElement.classList.remove('selected');
      });
      checkbox.checked = true;
      container.classList.add('selected');
      selectedOptions[index] = [option];
    }

    updateProgress();
    toggleQuestionSelection(index);
  }

  function setupDragAndDrop(index) {
    const sortableItems = document.querySelectorAll('.sortable-item');
    let draggedItem = null;

    sortableItems.forEach(item => {
      item.setAttribute('draggable', 'true');

      item.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        e.dataTransfer.setData('text/plain', e.target.textContent);
        e.target.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        draggedItem = null;
        updateSelection(index, null);
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropTarget = e.target;
        if (draggedItem && dropTarget.classList.contains('sortable-item')) {
          const parent = dropTarget.parentNode;
          const draggedIndex = Array.from(parent.children).indexOf(draggedItem);
          const dropIndex = Array.from(parent.children).indexOf(dropTarget);
          if (draggedIndex < dropIndex) {
            parent.insertBefore(draggedItem, dropTarget.nextSibling);
          } else {
            parent.insertBefore(draggedItem, dropTarget);
          }
        }
      });

      item.addEventListener('touchstart', (e) => {
        draggedItem = e.target;
        draggedItem.classList.add('dragging');
      });

      item.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains('sortable-item') && target !== draggedItem) {
          const parent = target.parentNode;
          const draggedIndex = Array.from(parent.children).indexOf(draggedItem);
          const dropIndex = Array.from(parent.children).indexOf(target);
          if (draggedIndex < dropIndex) {
            parent.insertBefore(draggedItem, target.nextSibling);
          } else {
            parent.insertBefore(draggedItem, target);
          }
        }
      });

      item.addEventListener('touchend', (e) => {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        updateSelection(index, null);
      });
    });
  }

  function getInstruction(type) {
    switch (type) {
      case 'multiple': return '<i>Виберіть усі правильні відповіді</i>';
      case 'input': return '<i>Введіть правильну відповідь</i>';
      case 'ordering': return '<i>Розташуйте відповіді у правильній послідовності</i>';
      default: return '';
    }
  }

  function updateSelection(index, element) {
    if (questions[index].type === 'multiple') {
      // Уже обработано в selectOption
    } else if (questions[index].type === 'input') {
      selectedOptions[index] = element.value.trim();
    } else if (questions[index].type === 'ordering') {
      const sortableItems = document.querySelectorAll('.sortable-item');
      selectedOptions[index] = Array.from(sortableItems).map(item => item.textContent.trim());
    }
    updateProgress();
  }

  function updateProgress() {
    progressElement.innerHTML = questions.map((_, i) => {
      const isAnswered = selectedOptions[i] && selectedOptions[i].length > 0;
      return `<span class="progress-circle ${isAnswered ? 'answered' : 'unanswered'}">${i + 1}</span>`;
    }).join('');
  }

  prevButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion(currentQuestionIndex);
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion(currentQuestionIndex);
    }
  });

  finishButton.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  confirmFinish.addEventListener('click', () => {
    clearInterval(timerInterval);
    modal.style.display = 'none';
    showResults();
  });

  cancelFinish.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  function startTimer() {
    if (!testStartTime) {
      testStartTime = Date.now();
      startSuspiciousActivityTracking();
    }
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert('Час вийшов! Тест завершено.');
        showResults();
        return;
      }
      if (timeLeft === 60) {
        alert('Залишилася 1 хвилина!');
      }
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerElement.textContent = `Залишилось часу: ${minutes} хв ${seconds} с`;
      timeLeft--;
    }, 1000);
  }

  function startSuspiciousActivityTracking() {
    window.addEventListener('blur', () => {
      lastBlurTime = Date.now();
    });

    window.addEventListener('focus', () => {
      if (lastBlurTime) {
        const timeSpentOutside = (Date.now() - lastBlurTime) / 1000;
        timeOutsideTab += timeSpentOutside;
        lastBlurTime = null;
      }
    });
  }

  function calculateSuspiciousActivity() {
    const totalTestTime = (Date.now() - testStartTime) / 1000;
    const percentage = (timeOutsideTab / totalTestTime) * 100;
    return Math.round(percentage);
  }

  function showResults() {
    try {
      const totalQuestions = questions.length;
      let correctAnswers = 0;
      let totalPoints = 0;
      let maxPoints = 0;
      const answers = [];

      questions.forEach((question, index) => {
        const userAnswer = selectedOptions[index] || [];
        const correctAnswer = question.correctAnswers || [];
        const points = question.points || 1;
        maxPoints += points;

        let isCorrect = false;
        if (question.type === 'multiple') {
          const correctSelected = question.options
            .map((opt, i) => (correctAnswer[i] ? opt.trim() : null))
            .filter(opt => opt !== null);
          if (userAnswer.length === correctSelected.length && userAnswer.every(val => correctSelected.includes(val))) {
            correctAnswers++;
            totalPoints += points;
            isCorrect = true;
          }
        } else if (question.type === 'input') {
          if (userAnswer && correctAnswer[0] && typeof userAnswer === 'string' && typeof correctAnswer[0] === 'string') {
            if (userAnswer.toLowerCase() === correctAnswer[0].toLowerCase()) {
              correctAnswers++;
              totalPoints += points;
              isCorrect = true;
            }
          }
        } else if (question.type === 'ordering') {
          if (userAnswer && userAnswer.join('') === correctAnswer.join('')) {
            correctAnswers++;
            totalPoints += points;
            isCorrect = true;
          }
        }

        answers.push({
          question: question.question,
          userAnswer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || 'Немає відповіді',
          correctAnswer: Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer,
          points: isCorrect ? points : 0
        });
      });

      const percentage = Math.round(totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0);
      const resultContainer = document.getElementById('result-container');
      resultContainer.innerHTML = `
        <div class="result-circle">${percentage}%</div>
        <p>Користувач: ${currentUser}</p>
        <p>Кількість правильних відповідей: ${correctAnswers}</p>
        <p>Загальна кількість питань: ${totalQuestions}</p>
        <p>Набрано балів: ${totalPoints}</p>
        <p>Максимально можлива кількість балів: ${maxPoints}</p>
        <p>Відсоток: ${percentage}%</p>
      `;

      showPage(resultPage);

      const duration = formatDuration((Date.now() - testStartTime) / 1000);
      const suspiciousActivity = calculateSuspiciousActivity();
      saveTestResult(currentUser, totalPoints, maxPoints, percentage, answers, suspiciousActivity, duration);
    } catch (error) {
      console.error('Error in showResults:', error);
      alert('Помилка при завершенні тесту: ' + error.message);
    }
  }

  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes} хв ${secs} с`;
  }

  async function saveTestResult(username, totalPoints, maxPoints, percentage, answers, suspiciousActivity, duration) {
    try {
      const startTime = new Date(testStartTime).toLocaleString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const response = await fetch('/api/script?action=save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          totalPoints,
          maxPoints,
          percentage,
          startTime,
          duration,
          suspiciousActivity,
          answers
        })
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Failed to save test result:', result.message);
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  }

  document.getElementById('export-pdf').addEventListener('click', () => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Устанавливаем шрифт Roboto
      doc.setFont("Roboto", "normal");

      // Заголовок
      doc.setFontSize(16);
      doc.text('Результати тесту', 10, 10);

      // Данные результатов
      const resultContainer = document.getElementById('result-container');
      const lines = [
        `Користувач: ${resultContainer.querySelector('p:nth-child(2)').textContent.split(': ')[1]}`,
        `Кількість правильних відповідей: ${resultContainer.querySelector('p:nth-child(3)').textContent.split(': ')[1]}`,
        `Загальна кількість питань: ${resultContainer.querySelector('p:nth-child(4)').textContent.split(': ')[1]}`,
        `Набрано балів: ${resultContainer.querySelector('p:nth-child(5)').textContent.split(': ')[1]}`,
        `Максимально можлива кількість балів: ${resultContainer.querySelector('p:nth-child(6)').textContent.split(': ')[1]}`,
        `Відсоток: ${resultContainer.querySelector('p:nth-child(7)').textContent.split(': ')[1]}`
      ];

      doc.setFontSize(12);
      lines.forEach((line, index) => {
        doc.text(line, 10, 20 + (index * 10));
      });

      doc.save('result.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Помилка експорту в PDF: ' + error.message);
    }
  });

  document.getElementById('return-to-main').addEventListener('click', () => {
    showPage(testSelectionPage);
  });

  document.getElementById('logout').addEventListener('click', async () => {
    try {
      await fetch('/api/script?action=logout', { method: 'POST' });
      localStorage.removeItem('savedPassword');
      showPage(loginPage);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  });

  // Админ-панель
  document.getElementById('view-results').addEventListener('click', async () => {
    try {
      const response = await fetch('/api/script?action=get-results');
      if (!response.ok) {
        throw new Error('Не вдалося завантажити результати');
      }
      testResults = await response.json();
      const resultsBody = document.getElementById('results-body');
      resultsBody.innerHTML = '';
      testResults.forEach((result, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${result.username}</td>
          <td>${result.totalPoints}</td>
          <td>${result.maxPoints}</td>
          <td>${result.percentage}%</td>
          <td>${result.startTime}</td>
          <td>${result.duration}</td>
          <td>${result.suspiciousActivity}%</td>
          <td><button onclick="viewAnswers(${index})">Переглянути</button></td>
          <td><button onclick="deleteResult(${index})">🗑️</button></td>
        `;
        resultsBody.appendChild(row);
      });
      showPage(resultsPage);
    } catch (error) {
      console.error('Error loading results:', error);
      alert('Помилка завантаження результатів: ' + error.message);
    }
  });

  document.getElementById('create-test').addEventListener('click', () => {
    showPage(createTestPage);
  });

  document.getElementById('edit-tests').addEventListener('click', async () => {
    try {
      const response = await fetch('/api/script?action=get-tests');
      tests = await response.json();
      const testsList = document.getElementById('tests-list');
      testsList.innerHTML = '';
      tests.forEach((test, index) => {
        const testItem = document.createElement('div');
        testItem.className = 'test-item';
        testItem.innerHTML = `
          <input type="text" value="${test.name}" id="test-name-${index}">
          <input type="text" value="${test.file}" id="test-file-${index}">
          <input type="number" value="${test.time}" id="test-time-${index}">
          <button onclick="updateTest(${index})">Зберегти</button>
          <button onclick="deleteTest(${index})">Видалити</button>
        `;
        testsList.appendChild(testItem);
      });
      showPage(editTestsPage);
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  });

  document.getElementById('save-test').addEventListener('click', async () => {
    const testName = document.getElementById('test-name').value;
    const testFile = document.getElementById('test-file').value;
    const testTime = document.getElementById('test-time').value;

    if (!testName || !testFile || !testTime) {
      alert('Заповніть усі поля');
      return;
    }

    try {
      const response = await fetch('/api/script?action=create-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: testName, file: testFile, time: parseInt(testTime) })
      });
      const result = await response.json();
      if (result.success) {
        tests.push({ id: `test${tests.length + 1}`, name: testName, file: testFile, time: parseInt(testTime) });
        showPage(adminPage);
      } else {
        alert(result.message || 'Помилка створення тесту');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Помилка створення тесту: ' + error.message);
    }
  });

  document.getElementById('cancel-create').addEventListener('click', () => {
    showPage(adminPage);
  });

  document.getElementById('back-to-admin').addEventListener('click', () => {
    showPage(adminPage);
  });

  document.getElementById('back-to-admin-from-edit').addEventListener('click', () => {
    showPage(adminPage);
  });

  document.getElementById('back-to-results').addEventListener('click', () => {
    showPage(resultsPage);
  });

  document.getElementById('admin-logout').addEventListener('click', async () => {
    try {
      await fetch('/api/script?action=logout', { method: 'POST' });
      localStorage.removeItem('savedPassword');
      showPage(loginPage);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  });

  async function viewAnswers(index) {
    try {
      const result = testResults[index];
      if (!result || !result.answers) {
        throw new Error('Результат або відповіді відсутні');
      }
      const answersContainer = document.getElementById('answers-container');
      answersContainer.innerHTML = '';
      result.answers.forEach((answer, i) => {
        const answerDiv = document.createElement('div');
        answerDiv.innerHTML = `
          <p>Питання ${i + 1}: ${answer.question}</p>
          <p>Відповідь користувача: ${answer.userAnswer}</p>
          <p>Правильна відповідь: ${answer.correctAnswer}</p>
          <p>Бали: ${answer.points}</p>
        `;
        answersContainer.appendChild(answerDiv);
      });
      showPage(answersPage);
    } catch (error) {
      console.error('Error viewing answers:', error);
      alert('Помилка перегляду відповідей: ' + error.message);
    }
  }

  async function updateTest(index) {
    const testName = document.getElementById(`test-name-${index}`).value;
    const testFile = document.getElementById(`test-file-${index}`).value;
    const testTime = document.getElementById(`test-time-${index}`).value;

    if (!testName || !testFile || !testTime) {
      alert('Заповніть усі поля');
      return;
    }

    try {
      const response = await fetch('/api/script?action=update-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, name: testName, file: testFile, time: parseInt(testTime) })
      });
      const result = await response.json();
      if (result.success) {
        tests[index] = { ...tests[index], name: testName, file: testFile, time: parseInt(testTime) };
        alert('Тест оновлено');
        document.getElementById('edit-tests').click();
      } else {
        alert(result.message || 'Помилка оновлення тесту');
      }
    } catch (error) {
      console.error('Error updating test:', error);
      alert('Помилка оновлення тесту: ' + error.message);
    }
  }

  async function deleteResult(index) {
    try {
      const response = await fetch('/api/script?action=delete-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      });
      const result = await response.json();
      if (result.success) {
        testResults.splice(index, 1);
        document.getElementById('view-results').click();
      } else {
        alert(result.message || 'Помилка видалення результату');
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      alert('Помилка видалення результату: ' + error.message);
    }
  }

  async function deleteTest(index) {
    try {
      const response = await fetch('/api/script?action=delete-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      });
      const result = await response.json();
      if (result.success) {
        tests.splice(index, 1);
        document.getElementById('edit-tests').click();
      } else {
        alert('Помилка видалення тесту');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  }

  showPage(loginPage);
});
