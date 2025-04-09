document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password-input');
  const togglePassword = document.getElementById('toggle-password');
  const submitButton = document.getElementById('submit-password');
  const errorElement = document.getElementById('error');
  const rememberMe = document.getElementById('remember-me');

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

  // Обработка отправки пароля
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
        window.location.href = '/test-selection.html';
      } else {
        errorElement.textContent = result.message || 'Пароль невірний';
      }
    } catch (error) {
      errorElement.textContent = 'Помилка сервера';
    }
  });
});