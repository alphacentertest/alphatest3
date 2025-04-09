let currentQuestionIndex = 0;
let questions = JSON.parse(localStorage.getItem('questions')) || [];
let selectedOptions = new Array(questions.length).fill(null);

function displayQuestion(index) {
  const container = document.getElementById('question-container');
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

  container.innerHTML = html;
  updateProgress();

  // Настройка перетаскивания для ordering
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
  document.getElementById('modal').style.display = 'flex';
});

document.getElementById('confirm-finish').addEventListener('click', () => {
  alert('Тест завершено!');
  // Здесь можно добавить логику для завершения теста
  document.getElementById('modal').style.display = 'none';
});

document.getElementById('cancel-finish').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

document.getElementById('test1').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/load-questions?test=questions1');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Не вдалося завантажити питання');
    }
    const { questions } = await response.json();
    localStorage.setItem('questions', JSON.stringify(questions));
    window.location.href = '/test.html';
  } catch (error) {
    alert('Помилка завантаження питань: ' + error.message);
  }
});

document.getElementById('test2').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/load-questions?test=questions2');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Не вдалося завантажити питання');
    }
    const { questions } = await response.json();
    localStorage.setItem('questions', JSON.stringify(questions));
    window.location.href = '/test.html';
  } catch (error) {
    alert('Помилка завантаження питань: ' + error.message);
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