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
          try {
            const response = await fetch(`/api/script?action=load-questions&test=${test.file.split('.')[0]}`);
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Не вдалося завантажити питання');
            }
            questions = (await response.json()).questions;
            selectedOptions = new Array(questions.length).fill(null);
            currentQuestionIndex = 0;
            timeLeft = test.time * 60; // Время в секундах
            showPage(testPage);
            displayQuestion(currentQuestionIndex);
            startTimer();
          } catch (error) {
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
      console.log('Adding picture to question:', question.picture);
      html += `<img src="/images/${question.picture}.png" alt="Picture" style="max-width: 100%; margin-bottom: 10px;">`;
    }

    html += `<div class="question">${index + 1}. ${question.question}</div>`;
    html += `<p class="instruction">${getInstruction(question.type)}</p>`;

    if (question.type === 'multiple') {
      console.log('Question type is multiple, adding options');
      question.options.forEach((option, i) => {
        if (option) {
          html += `<div class="question-box" onclick="selectOption(this, ${index}, ${i})">${option}</div>`;
        }
      });
    } else if (question.type === 'input') {
      console.log('Question type is input, adding text input');
      html += `<input type="text" id="answer-input" oninput="updateSelection(${index}, this)">`;
    } else if (question.type === 'ordering') {
      console.log('Question type is ordering, adding sortable items');
      html += `<div id="sortable">`;
      question.options.forEach((option, i) => {
        if (option) {
          html += `<div class="sortable-item" draggable="true">${option}</div>`;
        }
      });
      html += `</div>`;
    }

    questionContainer.innerHTML = html;
    updateProgress();

    if (question.type === 'ordering') {
      console.log('Setting up drag-and-drop for ordering question');
      setupDragAndDrop(index);
    }
  }

  function selectOption(element, index, optionIndex) {
    console.log('Option selected:', optionIndex);
    const isSelected = element.classList.contains('selected');
    const allOptions = document.querySelectorAll('.question-box');

    if (questions[index].type === 'multiple') {
      // Для множественного выбора переключаем состояние
      if (isSelected) {
        element.classList.remove('selected');
      } else {
        element.classList.add('selected');
      }
    } else {
      // Для одиночного выбора снимаем выделение с других вариантов
      allOptions.forEach(opt => opt.classList.remove('selected'));
      element.classList.add('selected');
    }

    updateSelection(index);
  }

  function setupDragAndDrop(index) {
    const sortableItems = document.querySelectorAll('.sortable-item');
    let draggedItem = null;

    sortableItems.forEach(item => {
      item.setAttribute('draggable', 'true');

      // Для компьютера
      item.addEventListener('dragstart', (e) => {
        console.log('Drag start on item:', e.target.textContent);
        draggedItem = e.target;
        e.dataTransfer.setData('text/plain', e.target.textContent);
        e.target.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        console.log('Drag end on item:', e.target.textContent);
        e.target.classList.remove('dragging');
        draggedItem = null;
        updateSelection(index, null);
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      item.addEventListener('drop', (e) => {
        console.log('Drop event on item:', e.target.textContent);
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

      // Для мобильных устройств
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
    console.log('Getting instruction for question type:', type);
    switch (type) {
      case 'multiple': return '<i>Виберіть усі правильні відповіді</i>';
      case 'input': return '<i>Введіть правильну відповідь</i>';
      case 'ordering': return '<i>Розташуйте відповіді у правильній послідовності</i>';
      default: return '';
    }
  }

  function updateSelection(index) {
    console.log('Updating selection for question at index:', index);
    if (questions[index].type === 'multiple') {
      const selectedBoxes = document.querySelectorAll('.question-box.selected');
      selectedOptions[index] = selectedBoxes.length > 0 ? Array.from(selectedBoxes).map(box => box.textContent) : null;
      console.log('Updated selection for multiple choice:', selectedOptions[index]);
    } else if (questions[index].type === 'input') {
      const input = document.getElementById('answer-input');
      selectedOptions[index] = input ? input.value : null;
      console.log('Updated selection for input:', selectedOptions[index]);
    } else if (questions[index].type === 'ordering') {
      const sortableItems = document.querySelectorAll('.sortable-item');
      selectedOptions[index] = Array.from(sortableItems).map(item => item.textContent);
      console.log('Updated selection for ordering:', selectedOptions[index]);
    }
    updateProgress();
  }

  function updateProgress() {
    console.log('Updating progress');
    progressElement.innerHTML = questions.map((_, i) => {
      const isAnswered = selectedOptions[i] !== null;
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
      console.log('Tab lost focus');
      lastBlurTime = Date.now();
    });

    window.addEventListener('focus', () => {
      console.log('Tab gained focus');
      if (lastBlurTime) {
        const timeSpentOutside = (Date.now() - lastBlurTime) / 1000;
        timeOutsideTab += timeSpentOutside;
        console.log('Time spent outside tab:', timeOutsideTab);
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
    const totalQuestions = questions.length;
    let correctAnswers = 0;
    let totalPoints = 0;
    let maxPoints = 0;
    const answers = [];

    questions.forEach((question, index) => {
      const userAnswer = selectedOptions[index];
      const correctAnswer = question.correctAnswers;
      const points = question.points || 1; // Очки из колонки 28
      maxPoints += points;

      let isCorrect = false;
      if (question.type === 'multiple') {
        const userSelected = userAnswer || [];
        const correctSelected = correctAnswer.map((val, i) => val ? i : -1).filter(i => i !== -1);
        if (userSelected.length === correctSelected.length && userSelected.every(val => correctSelected.includes(parseInt(val)))) {
          correctAnswers++;
          totalPoints += points;
          isCorrect = true;
        }
      } else if (question.type === 'input') {
        if (userAnswer && userAnswer.toLowerCase() === correctAnswer[0].toLowerCase()) {
          correctAnswers++;
          totalPoints += points;
          isCorrect = true;
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
        userAnswer: userAnswer ? userAnswer.join(', ') : 'Немає відповіді',
        correctAnswer: correctAnswer.join(', '),
        points: isCorrect ? points : 0
      });
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = `
      <div class="result-circle">${percentage}%</div>
      <p>Кількість правильних відповідей: ${correctAnswers}</p>
      <p>Загальна кількість питань: ${totalQuestions}</p>
      <p>Набрано балів: ${totalPoints}</p>
      <p>Максимально можлива кількість балів: ${maxPoints}</p>
      <p>Відсоток: ${percentage}%</p>
    `;

    showPage(resultPage);

    // Сохраняем результат
    const duration = formatDuration((Date.now() - testStartTime) / 1000);
    const suspiciousActivity = calculateSuspiciousActivity();
    saveTestResult(currentUser, totalPoints, maxPoints, percentage, answers, suspiciousActivity, duration);
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
      await fetch('/api/script?action=save-result', {
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
    } catch (error) {
      console.error('Error saving result:', error);
    }
  }

  document.getElementById('export-pdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('Результати тесту', 10, 10);
    doc.text(document.getElementById('result-container').innerText, 10, 20);
    doc.save('result.pdf');
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
      testResults = await response.json();
      const resultsBody = document.getElementById('results-body');
      resultsBody.innerHTML = '';
      testResults.forEach((result, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${result.username}</td>
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
        alert('Помилка створення тесту');
      }
    } catch (error) {
      console.error('Error creating test:', error);
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

  async function viewAnswers(index) {
    const result = testResults[index];
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
        alert('Помилка видалення результату');
      }
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  }

  async function updateTest(index) {
    const testName = document.getElementById(`test-name-${index}`).value;
    const testFile = document.getElementById(`test-file-${index}`).value;
    const testTime = document.getElementById(`test-time-${index}`).value;

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
      } else {
        alert('Помилка оновлення тесту');
      }
    } catch (error) {
      console.error('Error updating test:', error);
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

  // Показываем страницу авторизации при загрузке
  showPage(loginPage);
});