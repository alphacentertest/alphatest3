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
};

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password-input').value;
  
    const response = await fetch('/api/check-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
  
    const result = await response.json();
  
    if (result.success) {
      window.location.href = '/test-selection.html'; // Перехід на сторінку вибору тесту
    } else {
      alert(result.message); // Повідомлення "Пароль невірний"
    }
  });