// Пример base64-кода шрифта (замените на свой)
const robotoBase64 = "YOUR_BASE64_ENCODED_FONT_HERE";

// Добавляем шрифт в jsPDF
if (window.jspdf) {
  const { jsPDF } = window.jspdf;
  jsPDF.API.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
  jsPDF.API.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
}