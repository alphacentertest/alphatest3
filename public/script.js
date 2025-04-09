document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded, DOM fully loaded');

  // Элементы страниц
  const loginPage = document.getElementById('login-page');
  const testSelectionPage = document.getElementById('test-selection-page');
  const testPage = document.getElementById('test-page');

  console.log('Login page element:', loginPage);
  console.log('Test selection page element:', testSelectionPage);
  console.log('Test page element:', testPage);

  // Элементы авторизации
  const passwordInput = document.getElementById('password-input');
  const togglePassword = document.getElementById('toggle-password');
  const submitButton = document.getElementById('submit-password');
  const errorElement = document.getElementById('error');
  const rememberMe = document.getElementById('remember-me');

  console.log('Password input element:', passwordInput);
  console.log('Toggle password button:', togglePassword);
  console.log('Submit button:', submitButton);
  console.log('Error element:', errorElement);
  console.log('Remember me checkbox:', rememberMe);

  // Элементы выбора тестов
  const test1Button = document.getElementById('test1');
  const test2Button = document.getElementById('test2');

  console.log('Test 1 button:', test1Button);
  console.log('Test 2 button:', test2Button);

  // Элементы теста
  const timerElement = document.getElementById('timer');
  const progressElement = document.getElementById('progress');
  const questionContainer = document.getElementById('question-container');
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');
  const finishButton = document.getElementById('finish');
  const modal = document.getElementById('modal');
  const confirmFinish = document.getElementById('confirm-finish');
  const cancelFinish = document.getElementById('cancel-finish'); // Исправлено

  console.log('Timer element:', timerElement);
  console.log('Progress element:', progressElement);
  console.log('Question container:', questionContainer);
  console.log('Prev button:', prevButton);
  console.log('Next button:', nextButton);
  console.log('Finish button:', finishButton);
  console.log('Modal element:', modal);
  console.log('Confirm finish button:', confirmFinish);
  console.log('Cancel finish button:', cancelFinish);

  let currentQuestionIndex = 0;
  let questions = [];
  let selectedOptions = [];
  let timeLeft = 600; // 10 минут в секундах
  let timerInterval;

  // Функция переключения страниц
  function showPage(page) {
    console.log('Showing page:', page.id);
    loginPage.style.display = 'none';
    testSelectionPage.style.display = 'none';
    testPage.style.display = 'none';
    page.style.display = 'block';
  }

  // Загружаем сохраненный пароль, если он есть
  const savedPassword = localStorage.getItem('savedPassword');
  if (savedPassword) {
    console.log('Found saved password:', savedPassword);
    passwordInput.value = savedPassword;
    rememberMe.checked = true;
  } else {
    console.log('No saved password found');
  }

  // Показать/скрыть пароль
  togglePassword.addEventListener('click', () => {
    console.log('Toggle password visibility clicked');
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
    console.log('Submit button clicked, password entered:', password);
    errorElement.textContent = '';

    try {
      console.log('Sending fetch request to /api/check-password');
      const response = await fetch('/api/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      console.log('Fetch response received:', response);
      const result = await response.json();
      console.log('Fetch result:', result);

      if (result.success) {
        console.log('Password is valid');
        if (rememberMe.checked) {
          console.log('Saving password to localStorage');
          localStorage.setItem('savedPassword', password);
        } else {
          console.log('Removing password from localStorage');
          localStorage.removeItem('savedPassword');
        }
        showPage(testSelectionPage);
      } else {
        console.log('Password is invalid');
        errorElement.textContent = result.message || 'Пароль невірний';
      }
    } catch (error) {
      console.error('Error during fetch:', error);
      errorElement.textContent = 'Помилка сервера';
    }
  });

  // Обработка выбора тестов
  test1Button.addEventListener('click', async () => {
    console.log('Test 1 button clicked');
    try {
      console.log('Sending fetch request to /api/load-questions?test=questions1');
      const response = await fetch('/api/load-questions?test=questions1');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося завантажити питання');
      }
      questions = (await response.json()).questions;
      console.log('Questions loaded for Test 1:', questions);
      selectedOptions = new Array(questions.length).fill(null);
      currentQuestionIndex = 0;
      showPage(testPage);
      displayQuestion(currentQuestionIndex);
      startTimer();
    } catch (error) {
      console.error('Error loading questions for Test 1:', error);
      alert('Помилка завантаження питань: ' + error.message);
    }
  });

  test2Button.addEventListener('click', async () => {
    console.log('Test 2 button clicked');
    try {
      console.log('Sending fetch request to /api/load-questions?test=questions2');
      const response = await fetch('/api/load-questions?test=questions2');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Не вдалося завантажити питання');
      }
      questions = (await response.json()).questions;
      console.log('Questions loaded for Test 2:', questions);
      selectedOptions = new Array(questions.length).fill(null);
      currentQuestionIndex = 0;
      showPage(testPage);
      displayQuestion(currentQuestionIndex);
      startTimer();
    } catch (error) {
      console.error('Error loading questions for Test 2:', error);
      alert('Помилка завантаження питань: ' + error.message);
    }
  });

  // Отображение вопроса
  function displayQuestion(index) {
    console.log('Displaying question at index:', index);
    const question = questions[index];
    let html = '';

    if (question.picture) {
      console.log('Adding picture to question:', question.picture);
      html += `<img src="/images/${question.picture}.png" alt="Picture" style="max-width: 100%; margin-bottom: 10px;">`;
    }

    html += `<div class="question-box" onclick="selectQuestion(this)">${question.question}</div>`;
    html += `<p class="instruction">${getInstruction(question.type)}</p>`;

    if (question.type === 'multiple') {
      console.log('Question type is multiple, adding options');
      question.options.forEach((option, i) => {
        if (option) {
          html += `<label><input type="checkbox" name="option" value="${i}" onchange="updateSelection(${index}, this)">${option}</label><br>`;
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
      const sortableItems = document.querySelectorAll('.sortable-item');
      sortableItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
          console.log('Drag start on item:', e.target.textContent);
          e.dataTransfer.setData('text/plain', e.target.textContent);
          e.target.classList.add('dragging');
        });
        item.addEventListener('dragend', (e) => {
          console.log('Drag end on item:', e.target.textContent);
          e.target.classList.remove('dragging');
          updateSelection(index, null);
        });
        item.addEventListener('dragover', (e) => {
          e.preventDefault();
        });
        item.addEventListener('drop', (e) => {
          console.log('Drop event on item:', e.target.textContent);
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
    console.log('Getting instruction for question type:', type);
    switch (type) {
      case 'multiple': return '<i>Виберіть усі правильні відповіді</i>';
      case 'input': return '<i>Введіть правильну відповідь</i>';
      case 'ordering': return '<i>Розташуйте відповіді у правильній послідовності</i>';
      default: return '';
    }
  }

  function selectQuestion(element) {
    console.log('Question box clicked, selecting');
    element.classList.add('selected');
  }

  function updateSelection(index, element) {
    console.log('Updating selection for question at index:', index);
    if (questions[index].type === 'multiple') {
      const checkboxes = document.querySelectorAll('input[name="option"]:checked');
      selectedOptions[index] = checkboxes.length > 0 ? Array.from(checkboxes).map(cb => cb.value) : null;
      console.log('Updated selection for multiple choice:', selectedOptions[index]);
    } else if (questions[index].type === 'input') {
      selectedOptions[index] = element.value || null;
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
    console.log('Previous button clicked');
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion(currentQuestionIndex);
    }
  });

  nextButton.addEventListener('click', () => {
    console.log('Next button clicked');
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion(currentQuestionIndex);
    }
  });

  finishButton.addEventListener('click', () => {
    console.log('Finish button clicked');
    modal.style.display = 'flex';
  });

  confirmFinish.addEventListener('click', () => {
    console.log('Confirm finish button clicked');
    clearInterval(timerInterval);
    alert('Тест завершено!');
    modal.style.display = 'none';
    showPage(loginPage);
  });

  cancelFinish.addEventListener('click', () => {
    console.log('Cancel finish button clicked');
    modal.style.display = 'none';
  });

  function startTimer() {
    console.log('Starting timer');
    timeLeft = 600; // Сбрасываем таймер
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        console.log('Timer ended');
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
  console.log('Showing login page on initial load');
  showPage(loginPage);
});