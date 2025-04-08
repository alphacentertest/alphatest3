// test.js
document.getElementById('test1').addEventListener('click', async () => {
  const response = await fetch('/api/load-questions?test=questions1');
  const { questions } = await response.json();
  displayQuestions(questions);
});

document.getElementById('test2').addEventListener('click', async () => {
  const response = await fetch('/api/load-questions?test=questions2');
  const { questions } = await response.json();
  displayQuestions(questions);
});

function displayQuestions(questions) {
  const container = document.getElementById('questions');
  container.innerHTML = questions.map(q => `<p>${q[1]}</p>`).join('');
}