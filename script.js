document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password-input').value;
  const errorElement = document.getElementById('error');

  try {
    const response = await fetch('/api/check-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = '/test-selection.html';
    } else {
      errorElement.textContent = result.message || 'Пароль невірний';
    }
  } catch (error) {
    errorElement.textContent = 'Помилка сервера';
  }
});