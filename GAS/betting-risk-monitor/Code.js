function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 БК Аналитика')
      .addItem('Выполнить аудит линии и точности', 'runFullAudit')
      .addItem('Очистить форматирование', 'clearStyles')
      .addToUi();
}

function runFullAudit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const range = sheet.getDataRange();
  const data = range.getValues();
  
  // Индексы столбцов согласно скриншоту (отсчет с 0)
  const COL_HOME_ODDS = 5; // F
  const COL_AWAY_ODDS = 6; // G
  const COL_DRAW_ODDS = 7; // H
  const COL_PREDICTED = 8; // I
  const COL_ACTUAL = 9;    // J
  
  // Новые столбцы для вывода (K и L)
  const COL_MARGIN_OUT = 10; // K
  const COL_ACCURACY_OUT = 11; // L

  const results = [];
  const rowColors = [];

  // Заголовки для новых столбцов
  sheet.getRange(1, COL_MARGIN_OUT + 1).setValue("Margin %");
  sheet.getRange(1, COL_ACCURACY_OUT + 1).setValue("Prediction Status");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const hOdds = parseFloat(row[COL_HOME_ODDS]);
    const aOdds = parseFloat(row[COL_AWAY_ODDS]);
    const dOdds = parseFloat(row[COL_DRAW_ODDS]);
    const predicted = row[COL_PREDICTED];
    const actual = row[COL_ACTUAL];

    let marginCalc = 0;
    let statusText = "";
    let bgColor = null;

    // 1. Расчет маржи (учитываем 2 или 3 исхода)
    if (!isNaN(hOdds) && !isNaN(aOdds)) {
      marginCalc = (1/hOdds) + (1/aOdds);
      if (!isNaN(dOdds) && dOdds > 0) {
        marginCalc += (1/dOdds); // Добавляем ничью, если она есть
      }
      const marginPercent = (marginCalc - 1) * 100;
      statusText = marginPercent.toFixed(2) + "%";

      // Подсветка аномалий маржи
      if (marginPercent < 0) bgColor = "#ea9999"; // Ошибка/Вилка (красный)
      if (marginPercent > 15) bgColor = "#ffe599"; // Высокая комиссия (желтый)
    }

    // 2. Проверка точности прогноза
    let predictionResult = "Pending";
    if (predicted && actual) {
      predictionResult = (predicted === actual) ? "✅ Correct" : "❌ Incorrect";
    }

    results.push([statusText, predictionResult]);
    rowColors.push(bgColor);
  }

  // Записываем результаты в столбцы K и L
  sheet.getRange(2, COL_MARGIN_OUT + 1, results.length, 2).setValues(results);

  // Применяем форматирование строк
  for (let j = 0; j < rowColors.length; j++) {
    if (rowColors[j]) {
      sheet.getRange(j + 2, 1, 1, COL_ACCURACY_OUT + 1).setBackground(rowColors[j]);
    }
  }

  SpreadsheetApp.getUi().alert('Анализ завершен! Проверьте столбцы Margin и Prediction Status.');
}

function clearStyles() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getDataRange().setBackground(null);
}
