const FIREBASE_URL = 'https://todo-2026-05-25-default-rtdb.europe-west1.firebasedatabase.app/';

const list = document.getElementById('todo-list')
const itemCountSpan = document.getElementById('item-count')
const uncheckedCountSpan = document.getElementById('unchecked-count')
const loadingDiv = document.getElementById('loading')
const errorDiv = document.getElementById('error')

let todos = [];

const _render = { All: () => { render(); updateCounter() } }


function setLoading(isLoading) {
	//loadingDiv.style.display = isLoading ? 'block' : 'none';
	loadingDiv.style.visibility = isLoading ? 'visible' : 'hidden';
	
}

function setError(msg) {
	errorDiv.textContent = msg;
	errorDiv.style.display = msg ? 'block' : 'none';
}


async function fetchTodos() {
	setLoading(true);
	setError('');
	try {
		const res = await fetch(`${FIREBASE_URL}.json`);
		const data = await res.json();
		todos = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
		_render.All();
	} catch (e) {
		setError('Помилка: ' + e.message);
	} finally {
		setLoading(false);
	}
}

async function addTodo(text) {
	setLoading(true);
	setError('');
	const newTask = { text: text, checked: false };
	try {
		const res = await fetch(`${FIREBASE_URL}.json`, {
			method: 'POST',
			body: JSON.stringify(newTask)
		});
		const data = await res.json();
		todos.push({ 'id': data.name, 'text': text, 'checked': false });
		_render.All();
	} catch (e) {
		setError('Помилка: ' + e.message);
	} finally {
		setLoading(false);
	}
}

function newTodo() {
	const newTask = prompt('введи нове завдання')
	if (newTask == null) return;
	if (newTask.trim()) {
		addTodo(newTask.trim());
	} else {
		alert("порожнє не приймається");
	}
}

function renderTodo(taskObj) {
	const textClass = taskObj.checked ? 'text-success text-decoration-line-through' : '';
	return `
		<li class="list-group-item">
			<input type="checkbox" class="form-check-input me-2" ${taskObj.checked ? 'checked' : ''} id="${taskObj.id}" onChange="checkTodo('${taskObj.id}')">
			<label for="${taskObj.id}"><span class="${textClass}">${taskObj.text}</span></label>
			<button class="btn btn-danger btn-sm float-end" onClick="deleteTodo('${taskObj.id}')">delete</button>
		</li>
	`;
}

function render(arrayOfTodos = todos) {
	list.innerHTML = arrayOfTodos.map(item => renderTodo(item)).join('');
}

function updateCounter() {
	itemCountSpan.textContent = todos.length.toString()
	uncheckedCountSpan.textContent = todos.reduce((count, item) => count + !item.checked, 0).toString()
}

async function deleteTodo(id) {
	setLoading(true);
	setError('');
	try {
		await fetch(`${FIREBASE_URL}/${id}.json`, { method: 'DELETE' });
		todos = todos.filter(item => item.id !== id);
		_render.All();
	} catch (e) {
		setError('Помилка: ' + e.message);
	} finally {
		setLoading(false);
	}
}

async function checkTodo(id) {
	const item = todos.find(item => item.id === id);
	setLoading(true);
	setError('');
	try {
		await fetch(`${FIREBASE_URL}/${id}.json`, {
			method: 'PATCH',
			body: JSON.stringify({ checked: !item.checked })
		});
		item.checked = !item.checked;
		_render.All();
	} catch (e) {
		setError('Помилка: ' + e.message);
	} finally {
		setLoading(false);
	}
}

fetchTodos();