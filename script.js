async function checkPassword() {
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('error');
  
  try {
    const response = await fetch('/api/check-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    
    if (result.success) {
      window.location.href = '/test-selection.html'; // Сторінка вибору тесту
    } else {
      errorElement.textContent = result.message || 'Невірний пароль';
    }
  } catch (error) {
    errorElement.textContent = 'Помилка сервера';
  }
}