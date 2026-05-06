function transformAvitoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheetByName("Raw");
  const target = ss.getSheetByName("Result");

  if (!source || !target) throw new Error("❌ Листы 'Raw' или 'Result' не найдены");

  const lastRowRaw = source.getLastRow();
  
  // Читаем данные, начиная с 4-й строки (где ваши заголовки на скриншоте)
  if (lastRowRaw < 4) return; 

  const range = source.getRange(4, 1, lastRowRaw - 3, source.getLastColumn());
  const data = range.getValues(); 
  
  const headers = data[0]; 
  const rows = data.slice(1); 
  
  const normalize = str => str.toString().trim().toLowerCase();
  const headerMap = headers.map(h => normalize(h));

  const findCol = name => {
    const idx = headerMap.indexOf(normalize(name));
    if (idx === -1) throw new Error("❌ Не найдена колонка: " + name);
    return idx;
  };

  const idx = {
    dateStart: findCol("Дата первой публикации"),
    dateEnd: findCol("Дата снятия с публикации"),
    adId: findCol("Номер объявления"),
    city: findCol("Город"),
    title: findCol("Название объявления"),
    chat: findCol("Написали в чат"),
    phone: findCol("Посмотрели телефон"),
    combo: findCol("Посмотрели телефон и написали в чат")
  };

  // 1. ПРОВЕРКА И СОЗДАНИЕ ЗАГОЛОВКОВ В RESULT
  const lastRowTarget = target.getLastRow();
  if (lastRowTarget === 0) {
    const headerRange = target.getRange(1, 1, 1, 9);
    headerRange.setValues([[
      "Дата первой публикации", "Дата снятия с публикации", "Тип связи",
      "Номер объявления", "Город", "Категория", "Название объявления",
      "Состоялась сделка", "Полученная сумма"
    ]]);
    headerRange.setFontWeight("bold");
    target.getRange("X1").setValue("№ ID").setFontWeight("bold");
    target.getRange("Z1").setValue("Технический ключ").setFontWeight("bold");
  }

  // 2. СБОР СУЩЕСТВУЮЩИХ КЛЮЧЕЙ
  const existingKeys = new Set();
  let lastId = 0;
  
  if (target.getLastRow() > 0) {
    const fullRange = target.getDataRange().getValues();
    for (let i = 1; i < fullRange.length; i++) {
      if (!fullRange[i][0]) continue; 
      let keyFromSheet = fullRange[i][25]; 
      if (keyFromSheet) existingKeys.add(keyFromSheet.toString());
      let currentId = parseInt(fullRange[i][23]); 
      if (!isNaN(currentId) && currentId > lastId) lastId = currentId;
    }
  }

  const getCustomCategory = (title) => {
    const t = title.toString().toLowerCase();
    if (t.includes("дтф") || t.includes("dtf")) return "DTF-печать";
    if (t.includes("визит")) return "Визитки";
    if (t.includes("стикер")) return "Стикеры";
    return "Прочее"; 
  };

  let result = [];

  // 3. ОБРАБОТКА ДАННЫХ
  rows.forEach((row, rowIndex) => {
    const counts = {
      "Сообщения": Number(row[idx.chat]) || 0,
      "Звонок": Number(row[idx.phone]) || 0,
      "Комбо": Number(row[idx.combo]) || 0
    };
    
    const adId = row[idx.adId];
    const dateStart = row[idx.dateStart];
    const dateEnd = row[idx.dateEnd];
    const title = row[idx.title];
    const customCategory = getCustomCategory(title);

    Object.keys(counts).forEach(type => {
      for (let i = 1; i <= counts[type]; i++) {
        let uniqueKey = adId + "|" + dateStart + "|" + dateEnd + "|" + type + "|" + i + "|r" + rowIndex;
        
        if (!existingKeys.has(uniqueKey)) {
          lastId++;
          result.push({
            mainData: [dateStart, dateEnd, type, adId, row[idx.city], customCategory, title, "Не обработан", ""],
            idVal: lastId,
            keyVal: uniqueKey
          });
        }
      }
    });
  });

  // 4. ЗАПИСЬ
  if (result.length > 0) {
    const startRow = target.getLastRow() + 1;
    if (target.getMaxRows() < startRow + result.length) {
      target.insertRowsAfter(target.getMaxRows(), result.length);
    }

    const mainMatrix = result.map(r => r.mainData);
    const idMatrix = result.map(r => [r.idVal]);
    const keyMatrix = result.map(r => [r.keyVal]);

    target.getRange(startRow, 1, mainMatrix.length, 9).setValues(mainMatrix);
    target.getRange(startRow, 24, idMatrix.length, 1).setValues(idMatrix);
    target.getRange(startRow, 26, keyMatrix.length, 1).setValues(keyMatrix);
    
    // --- НАСТРОЙКА РАСКРЫВАЮЩЕГОСЯ СПИСКА ---
    const statusRange = target.getRange(startRow, 8, mainMatrix.length);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Да", "Нет", "В работе", "Не обработан"], true)
      .setAllowInvalid(false)
      .build();
    statusRange.setDataValidation(rule);

    // --- НАСТРОЙКА ЦВЕТОВ (Условное форматирование) ---
    const sheet = target;
    const rules = sheet.getConditionalFormatRules();
    
    // Очищаем старые правила для этой колонки, чтобы не плодить их, либо просто добавляем новые
    // Для простоты добавим правила на всю колонку H, если их еще нет
    const statusColRange = sheet.getRange("H2:H");
    
    const colors = {
      "Да": "#b7e1cd",          // Зеленый
      "Нет": "#f4cccc",          // Красный
      "В работе": "#fff2cc",     // Желтый
      "Не обработан": "#fce4ec"  // Розовый
    };

    Object.keys(colors).forEach(value => {
      rules.push(SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(value)
        .setBackground(colors[value])
        .setRanges([statusColRange])
        .build());
    });
    
    sheet.setConditionalFormatRules(rules);

    Logger.log("✅ Добавлено строк: " + result.length);
  } else {
    Logger.log("ℹ️ Новых данных не найдено.");
  }
}
