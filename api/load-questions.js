const XLSX = require('xlsx');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { test } = req.query; // Отримуємо параметр test (questions1 або questions2)
    const filePath = path.join(__dirname, `../${test}.xlsx`);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['Questions'];
    const questions = XLSX.utils.sheet_to_json(sheet);
    res.status(200).json(questions);
  } catch (error) {
    console.error('Помилка:', error);
    res.status(500).json({ error: 'Помилка завантаження питань' });
  }
};