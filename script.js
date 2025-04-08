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

  // Перевірка пароля при натисканні кнопки
  submitButton.addEventListener('click', function() {
    const password = passwordField.value;
    // Приклад паролів з таблиці
    const validPasswords = ['password1', 'password2', 'password3'];

    if (validPasswords.includes(password)) {
      // Зберегти пароль, якщо вибрано "Запам'ятати мене"
      if (rememberMe.checked) {
        localStorage.setItem('password', password);
      } else {
        localStorage.removeItem('password');
      }
      // Перейти на сторінку вибору тесту
      window.location.href = 'test-selection.html';
    } else {
      errorMessage.style.display = 'block';
    }
  });
});