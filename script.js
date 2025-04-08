document.addEventListener('DOMContentLoaded', function() {
    console.log('script.js: Сторінка завантажена, ініціалізація...');
  
    const passwordField = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const submitButton = document.getElementById('submit-password');
    const errorMessage = document.getElementById('error-message');
    const rememberMe = document.getElementById('remember-me');
  
    if (!passwordField || !togglePassword || !submitButton || !errorMessage || !rememberMe) {
      console.error('script.js: Один або кілька елементів не знайдені:', {
        passwordField: !!passwordField,
        togglePassword: !!togglePassword,
        submitButton: !!submitButton,
        errorMessage: !!errorMessage,
        rememberMe: !!rememberMe
      });
      return;
    }
  
    console.log('script.js: Усі елементи знайдені, ініціалізація подій...');
  
    // Перевірка, чи є збережений пароль
    const savedPassword = localStorage.getItem('password');
    if (savedPassword) {
      console.log('script.js: Знайдено збережений пароль:', savedPassword);
      passwordField.value = savedPassword;
      rememberMe.checked = true;
    } else {
      console.log('script.js: Збережений пароль відсутній');
    }
  
    // Показати/сховати пароль
    togglePassword.addEventListener('click', function() {
      console.log('script.js: Клік на кнопку "Показати/Сховати"');
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        togglePassword.textContent = 'Сховати';
        console.log('script.js: Пароль показано');
      } else {
        passwordField.type = 'password';
        togglePassword.textContent = 'Показати';
        console.log('script.js: Пароль сховано');
      }
    });
  
    // Надсилання пароля на сервер
    submitButton.addEventListener('click', function() {
      const password = passwordField.value;
      console.log('script.js: Клік на кнопку "Ввести пароль", надсилаємо пароль:', password);
  
      fetch('/api/check-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
        .then(response => {
          console.log('script.js: Отримано відповідь від /api/check-password:', response.status, response.statusText);
          return response.json();
        })
        .then(data => {
          console.log('script.js: Дані від /api/check-password:', data);
          if (data.success) {
            console.log('script.js: Пароль правильний, перенаправляємо на test-selection.html');
            if (rememberMe.checked) {
              localStorage.setItem('password', password);
              console.log('script.js: Пароль збережено в localStorage');
            } else {
              localStorage.removeItem('password');
              console.log('script.js: Пароль видалено з localStorage');
            }
            window.location.href = 'test-selection.html';
          } else {
            console.log('script.js: Пароль неправильний, показуємо повідомлення:', data.message);
            errorMessage.textContent = data.message || 'Пароль невірний';
            errorMessage.style.display = 'block';
          }
        })
        .catch(error => {
          console.error('script.js: Помилка при запиті до /api/check-password:', error);
          errorMessage.textContent = 'Помилка зв’язку з сервером';
          errorMessage.style.display = 'block';
        });
    });
  });