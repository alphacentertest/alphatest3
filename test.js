let currentQuestionIndex = 0;
let questions = JSON.parse(localStorage.getItem('questions')) || [];
let selectedOptions = new Array(questions.length).fill(null);

function displayQuestion(index) {
  const container = document.getElementById('question-container');
  const question = questions[index];
  let html = '';

  if (question.picture) {
    html += `<img src="/images/${question.picture}.png" alt="Picture">`;
  }

  html += `<div class="question-box" onclick="selectQuestion(this)">${question.question}</div>`;
  html += `<p class="instruction">${getInstruction(question.type)}</p>`;

  if (question.type === 'multiple') {
    question.options.forEach((option, i) => {
      if (option) {
        html += `<label><input type="checkbox" name="option" value="${i}">${option}</label><br>`;
      }
    });
  } else if (question.type === 'input') {
    html += `<input type="text" id="answer-input">`;
  } else if (question.type === 'ordering') {
    html += `<div id="sortable">`;
    question.options.forEach((option, i) => {
      if (option) {
        html += `<div class="sortable-item">${option}</div>`;
      }
    });
    html += `</div>`;
  }

  container.innerHTML = html;
  updateProgress();
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
  element.style.backgroundColor = 'lightgreen';
}

function updateProgress() {
  const progress = document.getElementById('progress');
  progress.innerHTML = questions.map((_, i) => {
    const isAnswered = selectedOptions[i] !== null;
    return `<span class="progress-circle ${isAnswered ? 'answered' : 'unanswered'}">${i + 1}</span>`;
  }).join('');
}

document.getElementById('prev').addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion(currentQuestionIndex);
  }
});

document.getElementById('next').addEventListener('click', () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion(currentQuestionIndex);
  }
});

document.getElementById('finish').addEventListener('click', () => {
  if (confirm('Ви дійсно бажаєте завершити тест?')) {
    alert('Тест завершено!');
    // Здесь можно добавить логику для завершения теста
  }
});

// Таймер
let timeLeft = 600; // 10 минут в секундах
const timerElement = document.getElementById('timer');
setInterval(() => {
  if (timeLeft <= 0) {
    alert('Час вийшов! Тест завершено.');
    // Здесь можно добавить логику для завершения теста
    return;
  }
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerElement.textContent = `Залишилось часу: ${minutes} хв ${seconds} с`;
  timeLeft--;
}, 1000);

// Инициализация
displayQuestion(currentQuestionIndex);