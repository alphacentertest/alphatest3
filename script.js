document.addEventListener('DOMContentLoaded', function() {
    const passwordField = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const submitButton = document.getElementById('submit-password');
    const errorMessage = document.getElementById('error-message');
    const rememberMe = document.getElementById('remember-me');
  
    // Перевірка, чи є збережений пароль
    const savedPassword = localStorage.getItem('password');
    if (savedPassword) {
      passwordField.value = savedPassword;
      rememberMe.checked = true;
    }
  
    // Показати/сховати пароль
    togglePassword.addEventListener('click', function() {
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        togglePassword.textContent = 'Сховати';
      } else {
        passwordField.type = 'password';
        togglePassword.textContent = 'Показати';
      }
    });
  
    // Надсилання пароля на сервер
    submitButton.addEventListener('click', function() {
      const password = passwordField.value;
  
      fetch('/api/check-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Зберегти пароль, якщо вибрано "Запам'ятати мене"
            if (rememberMe.checked) {
              localStorage.setItem('password', password);
            } else {
              localStorage.removeItem('password');
            }
            // Перейти на сторінку вибору тесту
            window.location.href = 'test-selection.html';
          } else {
            errorMessage.textContent = data.message || 'Пароль невірний';
            errorMessage.style.display = 'block';
          }
        })
        .catch(error => {
          console.error('Помилка:', error);
          errorMessage.textContent = 'Помилка зв’язку з сервером';
          errorMessage.style.display = 'block';
        });
    });
  });