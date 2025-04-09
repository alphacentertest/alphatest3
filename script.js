document.addEventListener('DOMContentLoaded', () => {
  // Элементы страниц
  const loginPage = document.getElementById('login-page');
  const testSelectionPage = document.getElementById('test-selection-page');
  const testPage = document.getElementById('test-page');

  // Элементы авторизации
  const passwordInput = document.getElementById('password-input');
  const togglePassword = document.getElementById('toggle-password');
  const submitButton = document.getElementById('submit-password');
  const errorElement = document.getElementById('error');
  const rememberMe = document.getElementById('remember-me');

  // Элементы выбора тестов
  const test1Button = document.getElementById('test1');
  const test2Button = document.getElementById('test2');

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

  let currentQuestionIndex = 0;
  let questions = [];
  let selectedOptions = [];
  let timeLeft = 600; // 10 минут в секундах
  let timerInterval;

  // Функция переключения страниц
  function showPage(page) {
    loginPage.style.display = 'none';
    testSelectionPage.style.display = 'none';
    testPage.style.display = 'none';
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
      const response = await fetch('/api/check-password', {
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
        showPage(testSelectionPage);
      } else {
        errorElement.textContent = result.message || 'Пароль невірний';
      }
    } catch (error) {
      errorElement.textContent = 'Помилка сервера';
    }
  });

  // Обработка выбора тестов
  test1Button.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/load-questions?test=questions1');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося завантажити питання');
      }
      questions = (await response.json()).questions;
      selectedOptions = new Array(questions.length).fill(null);
      currentQuestionIndex = 0;
      showPage(testPage);
      displayQuestion(currentQuestionIndex);
      startTimer();
    } catch (error) {
      alert('Помилка завантаження питань: ' + error.message);
    }
  });

  test2Button.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/load-questions?test=questions2');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося завантажити питання');
      }
      questions = (await response.json()).questions;
      selectedOptions = new Array(questions.length).fill(null);
      currentQuestionIndex = 0;
      showPage(testPage);
      displayQuestion(currentQuestionIndex);
      startTimer();
    } catch (error) {
      alert('Помилка завантаження питань: ' + error.message);
    }
  });

  // Отображение вопроса
  function displayQuestion(index) {
    const question = questions[index];
    let html = '';

    if (question.picture) {
      html += `<img src="/images/${question.picture}.png" alt="Picture" style="max-width: 100%; margin-bottom: 10px;">`;
    }

    html += `<div class="question-box" onclick="selectQuestion(this)">${question.question}</div>`;
    html += `<p class="instruction">${getInstruction(question.type)}</p>`;

    if (question.type === 'multiple') {
      question.options.forEach((option, i) => {
        if (option) {
          html += `<label><input type="checkbox" name="option" value="${i}" onchange="updateSelection(${index}, this)">${option}</label><br>`;
        }
      });
    } else if (question.type === 'input') {
      html += `<input type="text" id="answer-input" oninput="updateSelection(${index}, this)">`;
    } else if (question.type === 'ordering') {
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
      const sortableItems = document.querySelectorAll('.sortable-item');
      sortableItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', e.target.textContent);
          e.target.classList.add('dragging');
        });
        item.addEventListener('dragend', (e) => {
          e.target.classList.remove('dragging');
          updateSelection(index, null);
        });
        item.addEventListener('dragover', (e) => {
          e.preventDefault();
        });
        item.addEventListener('drop', (e) => {
          e.preventDefault();
          const draggedText = e.dataTransfer.getData('text/plain');
          const draggedItem = Array.from(sortableItems).find(item => item.textContent === draggedText);
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
      });
    }
  }

  function getInstruction(type) {
    switch (type) {
      case 'multiple': return '<i>Виберіть усі правильні відповіді</i>';
      case 'input': return '<i>Введіть правильну відповідь</i>';
      case 'ordering': return '<i>Розташуйте відповіді у правильній послідовності</i>';
      default: return '';
    }
  }

  function selectQuestion(element) {
    element.classList.add('selected');
  }

  function updateSelection(index, element) {
    if (questions[index].type === 'multiple') {
      const checkboxes = document.querySelectorAll('input[name="option"]:checked');
      selectedOptions[index] = checkboxes.length > 0 ? Array.from(checkboxes).map(cb => cb.value) : null;
    } else if (questions[index].type === 'input') {
      selectedOptions[index] = element.value || null;
    } else if (questions[index].type === 'ordering') {
      const sortableItems = document.querySelectorAll('.sortable-item');
      selectedOptions[index] = Array.from(sortableItems).map(item => item.textContent);
    }
    updateProgress();
  }

  function updateProgress() {
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
    alert('Тест завершено!');
    modal.style.display = 'none';
    showPage(loginPage);
  });

  cancelFinish.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  function startTimer() {
    timeLeft = 600; // Сбрасываем таймер
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert('Час вийшов! Тест завершено.');
        showPage(loginPage);
        return;
      }
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerElement.textContent = `Залишилось часу: ${minutes} хв ${seconds} с`;
      timeLeft--;
    }, 1000);
  }

  // Показываем страницу авторизации при загрузке
  showPage(loginPage);
});