// ==========================================
// 1. КОНСТАНТИ
// ==========================================
const API_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json';
const DECIMAL_PLACES = 2;
const COUNT_HISTORY_DAYS = 7;

// ==========================================
// 2. ІНІЦІАЛІЗАЦІЯ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
	initApp();
});

function initApp() {
	setTodayDate();
	fetchCurrencyData();
	setupEventListeners();
	setupHistoryListener();
}

function setTodayDate() {
	const today = new Date();
	document.getElementById('current-date').textContent = today.toLocaleDateString('uk-UA');
}

function fetchCurrencyData() {
	fetch(API_URL)
		.then(response => {
			if (!response.ok) throw new Error('Помилка мережі');
			return response.json();
		})
		.then(data => {
			renderCurrencyList(data);
			populateDatalist(data);
		})
		.catch(err => console.error('Помилка завантаження даних:', err));
}

// ==========================================
// 3. ВІДОБРАЖЕННЯ ДАНИХ У DOM
// ==========================================
function renderCurrencyList(data) {
	const list = document.getElementById('currency-list');
	list.innerHTML = ''; 

	data.forEach(currency => {
		const li = document.createElement('li');
		li.className = 'currency-item';
		
		// Зберігаємо код валюти для обробника кліків
		li.dataset.cc = currency.cc; 

		li.innerHTML = `
			<span class="currency-name">${currency.cc} - ${currency.txt}</span>
			<span class="currency-rate">${currency.rate.toFixed(DECIMAL_PLACES)} грн</span>
		`;
		list.appendChild(li);
	});
}

function populateDatalist(data) {
	const datalist = document.getElementById('currency-select');
	datalist.innerHTML = ''; 

	data.forEach(currency => {
		const option = document.createElement('option');
		option.value = currency.cc;
		option.text = currency.txt;
		option.dataset.rate = currency.rate; 
		datalist.appendChild(option);
	});
}

//Функція для малювання таблиці
function renderHistoryTable(data, currencyCode) {
	const container = document.getElementById('history-output');
	
	// валідація даних
	if (!data || data.length === 0) {
		container.innerHTML = '<p style="color: red;">Не вдалося завантажити дані.</p>';
		return;
	}

	//сортування масиву за спаданням.
	data.sort((a, b) => {
		const dateA = a.exchangedate.split('.').reverse().join(''); 
		const dateB = b.exchangedate.split('.').reverse().join('');
		//!!!цей спосіб сортування стане ризикованим через 7974 роки!!!
		return dateB - dateA;
	});

	let html = `
		<table class="history-table">
			<thead>
				<tr>
					<th>Дата</th>
					<th>Курс ${currencyCode}</th>
				</tr>
			</thead>
			<tbody>
	`;

	// Формування таблиці по кожному дню
	data.forEach(item => {
		html += `
			<tr>
				<td>${item.exchangedate}</td>
				<td>${item.rate.toFixed(DECIMAL_PLACES)} грн</td>
			</tr>
		`;
	});

	html += `
			</tbody>
		</table>
	`;

	// Замінюємо текст "Завантаження..." на готову таблицю
	container.innerHTML = html;
}

// ==========================================
// 4. ЛОГІКА КОНВЕРТЕРА
// ==========================================

// Допоміжна функція для отримання курсу з datalist
function getRateFromDatalist(currencyCode) {
	const datalist = document.getElementById('currency-select');
	const selectedOption = Array.from(datalist.options).find(opt => opt.value === currencyCode);
	return selectedOption ? parseFloat(selectedOption.dataset.rate) : null;
}

// Функція для розрахунку
function calculateConversion(amountId, currencyId, resultId, isMultiplier) {
	const amountStr = document.getElementById(amountId).value;
	const currencyCode = document.getElementById(currencyId).value;
	const resultField = document.getElementById(resultId);

	const amount = parseFloat(amountStr);
	const rate = getRateFromDatalist(currencyCode);

	// Перевірка на коректність даних
	if (!isNaN(amount) && rate) {
		// isMultiplier === true: іноземна -> гривні (множення)
		// isMultiplier === false: гривні -> іноземна (ділення)
		const result = isMultiplier ? (amount * rate) : (amount / rate);
		resultField.value = result.toFixed(DECIMAL_PLACES);
	} else {
		resultField.value = '';
	}
}

// Обробники для кожного блоку
function handleForeignToUah() {
	calculateConversion('amount-foreign', 'currency-input', 'amount-uah', true);
}

function handleUahToForeign() {
	calculateConversion('amount-uah-input', 'currency-output-select', 'amount-foreign-result', false);
}

// ==========================================
// 5. НАЛАШТУВАННЯ ПОДІЙ
// ==========================================
function setupConverterListeners(amountInputId, currencySelectId, handlerFunction) {
	const amountInput = document.getElementById(amountInputId);
	const currencySelect = document.getElementById(currencySelectId);

	amountInput.addEventListener('input', handlerFunction);
	currencySelect.addEventListener('change', handlerFunction);
	currencySelect.addEventListener('input', handlerFunction);
}

// Обробник кліку по списку валют
function setupHistoryListener() {
	const list = document.getElementById('currency-list');
	
	list.addEventListener('click', (event) => {
		const item = event.target.closest('.currency-item');
		if (!item) return; 

		document.querySelectorAll('.currency-item').forEach(el => el.classList.remove('active'));
		item.classList.add('active');

		const currencyCode = item.dataset.cc;

		document.getElementById('history-title').textContent = `Курс ${currencyCode} за тиждень`;
		document.getElementById('history-output').innerHTML = '<p>Завантаження даних...</p>';

		loadCurrencyHistory(currencyCode);
	});
}

function setupEventListeners() {
	setupConverterListeners('amount-foreign', 'currency-input', handleForeignToUah);
	setupConverterListeners('amount-uah-input', 'currency-output-select', handleUahToForeign);
}

// ==========================================
// 6. ЛОГІКА ІСТОРІЇ КУРСІВ
// ==========================================

//Функція, що повертає масив дат у форматі YYYYMMDD
function generateDateArray(daysCount) {
	const dates = new Array(daysCount); 
	
	for (let i = 0; i < daysCount; i++) {
		const date = new Date();
		date.setDate(date.getDate() - i); 
		
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0'); 
		const day = String(date.getDate()).padStart(2, '0');
		
		dates[i] = `${year}${month}${day}`;
	}
	
	return dates;
}

//Функція для отримання курсу на визначену дату
async function fetchRates(valcode, date) {
	const url = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${valcode}&date=${date}&json`;
	
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error('Помилка мережі');
		
		const data = await response.json();
		
		return data[0]; 
	} catch (error) {
		console.error(`Помилка завантаження для дати ${date}:`, error);
		return null;
	}
}

// Функція для збирання історії за визначений період
async function loadCurrencyHistory(currencyCode) {
	const dates = generateDateArray(COUNT_HISTORY_DAYS);
	
	// Створюємо масив промісів для завантаження даних по кожному дню
	const promises = dates.map(date => fetchRates(currencyCode, date));

	try {
		const results = await Promise.all(promises);
		
		const validResults = results.filter(item => item !== null);

		renderHistoryTable(validResults, currencyCode);
		
	} catch (error) {
		console.error('Критична помилка завантаження історії:', error);
		document.getElementById('history-output').innerHTML = '<p style="color: red;">Сталася помилка при завантаженні даних.</p>';
	}
}