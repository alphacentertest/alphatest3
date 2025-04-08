document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const testFile = urlParams.get('test'); // questions1 або questions2
    let questions = [];
    let currentQuestionIndex = 0;
    let answers = [];
    let timeLeft = 600; // 10 хвилин у секундах
  
    const timerElement = document.getElementById('timer');
    const progressBar = document.getElementById('progress-bar');
    const questionImage = document.getElementById('question-image');
    const questionBox = document.getElementById('question-box');
    const questionType = document.getElementById('question-type');
    const optionsContainer = document.getElementById('options-container');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const finishButton = document.getElementById('finish-button');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
  
    // Таймер
    const timerInterval = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerElement.textContent = `Залишилось часу ${minutes} хв ${seconds} с`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        finishTest();
      }
    }, 1000);
  
    // Завантаження питань
    fetch(`/api/load-questions?test=${testFile}`)
      .then(response => response.json())
      .then(data => {
        questions = data;
        answers = new Array(questions.length).fill(null);
        renderProgressBar();
        renderQuestion();
      })
      .catch(error => {
        console.error('Помилка:', error);
        alert('Помилка завантаження питань');
      });
  
    // Відображення прогрес-бару
    function renderProgressBar() {
      progressBar.innerHTML = '';
      questions.forEach((_, index) => {
        const circle = document.createElement('div');
        circle.classList.add('progress-circle');
        circle.textContent = index + 1;
        if (answers[index] !== null) {
          circle.classList.add('answered');
        }
        progressBar.appendChild(circle);
      });
    }
  
    // Відображення питання
    function renderQuestion() {
      const question = questions[currentQuestionIndex];
      questionImage.src = `/images/${question.Picture}.png`; // Змінено на .png
      questionImage.style.display = 'block';
      questionBox.textContent = question.Question;
  
      // Вибір питання (зміна кольору на зелений)
      questionBox.onclick = () => {
        questionBox.classList.toggle('selected');
      };
  
      // Тип питання
      if (question.Type === 'multiple') {
        questionType.textContent = 'Виберіть усі правильні відповіді';
        renderMultipleOptions(question);
      } else if (question.Type === 'input') {
        questionType.textContent = 'Введіть правильну відповідь';
        renderInputOption();
      } else if (question.Type === 'ordering') {
        questionType.textContent = 'Розташуйте відповіді у правильній послідовності';
        renderOrderingOptions(question);
      }
    }
  
    // Відображення варіантів для типу multiple
    function renderMultipleOptions(question) {
      optionsContainer.innerHTML = '';
      const options = [];
      for (let i = 1; i <= 12; i++) {
        const option = question[`Option ${i}`];
        if (option) options.push(option);
      }
      options.forEach((option, index) => {
        const div = document.createElement('div');
        div.classList.add('option');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `option-${index}`;
        checkbox.checked = answers[currentQuestionIndex]?.includes(option) || false;
        checkbox.onchange = () => {
          if (!answers[currentQuestionIndex]) answers[currentQuestionIndex] = [];
          if (checkbox.checked) {
            answers[currentQuestionIndex].push(option);
          } else {
            answers[currentQuestionIndex] = answers[currentQuestionIndex].filter(o => o !== option);
          }
          if (answers[currentQuestionIndex].length === 0) answers[currentQuestionIndex] = null;
          renderProgressBar();
        };
        const label = document.createElement('label');
        label.htmlFor = `option-${index}`;
        label.textContent = option;
        div.appendChild(checkbox);
        div.appendChild(label);
        optionsContainer.appendChild(div);
      });
    }
  
    // Відображення поля для типу input
    function renderInputOption() {
      optionsContainer.innerHTML = '';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = answers[currentQuestionIndex] || '';
      input.oninput = () => {
        answers[currentQuestionIndex] = input.value || null;
        renderProgressBar();
      };
      optionsContainer.appendChild(input);
    }
  
    // Відображення варіантів для типу ordering
    function renderOrderingOptions(question) {
      optionsContainer.innerHTML = '';
      const options = [];
      for (let i = 1; i <= 12; i++) {
        const option = question[`Option ${i}`];
        if (option) options.push(option);
      }
      options.sort(() => Math.random() - 0.5); // Перемішуємо
      options.forEach((option, index) => {
        const div = document.createElement('div');
        div.classList.add('option', 'draggable');
        div.draggable = true;
        div.textContent = option;
        div.dataset.index = index;
        div.ondragstart = (e) => {
          e.dataTransfer.setData('text/plain', div.dataset.index);
        };
        div.ondragover = (e) => e.preventDefault();
        div.ondrop = (e) => {
          e.preventDefault();
          const draggedIndex = e.dataTransfer.getData('text/plain');
          const draggedElement = optionsContainer.children[draggedIndex];
          const targetIndex = Array.from(optionsContainer.children).indexOf(div);
          if (draggedIndex < targetIndex) {
            optionsContainer.insertBefore(draggedElement, div.nextSibling);
          } else {
            optionsContainer.insertBefore(draggedElement, div);
          }
          answers[currentQuestionIndex] = Array.from(optionsContainer.children).map(child => child.textContent);
          renderProgressBar();
        };
        optionsContainer.appendChild(div);
      });
    }
  
    // Перемикання питань
    prevButton.onclick = () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
      }
    };
  
    nextButton.onclick = () => {
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
      }
    };
  
    // Завершення тесту
    finishButton.onclick = () => {
      confirmModal.style.display = 'flex';
    };
  
    confirmYes.onclick = () => {
      finishTest();
    };
  
    confirmNo.onclick = () => {
      confirmModal.style.display = 'none';
    };
  
    function finishTest() {
      clearInterval(timerInterval);
      alert('Тест завершено!'); // Тут можна додати логіку для підрахунку балів
      window.location.href = 'test-selection.html';
    }
  });