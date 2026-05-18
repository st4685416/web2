const list = document.getElementById('todo-list')
const itemCountSpan = document.getElementById('item-count')
const uncheckedCountSpan = document.getElementById('unchecked-count')

let todos = JSON.parse(localStorage.getItem('mostSecretKey')) || [];

_render.All()

let maxId = todos.length ? todos.reduce((id, item) => item.id > id ? item.id : id, 0) : 0;

function newTodo() {
	const newTask = prompt('введи нове завдання')
	if (newTask == null) return;
	if (newTask.trim()) {
		maxId++
		todos.push({'id': maxId, 'text': newTask, 'checked': false})
		_render.AllAndSaveData()
	} else {
		alert("порожнє не приймається");
	}
}

function renderTodo(taskObj) {
	const textClass = taskObj.checked ? 'text-success text-decoration-line-through' : '';
	return `
		<li class="list-group-item">
			<input type="checkbox" class="form-check-input me-2" ${taskObj.checked ? 'checked' : ''} id="${taskObj.id}" onChange="checkTodo(${taskObj.id})">
			<label for="${taskObj.id}"><span class="${textClass}">${taskObj.text}</span></label>
			<button class="btn btn-danger btn-sm float-end" onClick="deleteTodo(${taskObj.id})">delete</button>
		</li>
	`;
}

function render(arrayOfTodos = todos) {
	list.innerHTML = arrayOfTodos.map(item => renderTodo(item)).join('');
}

function updateCounter() {
	itemCountSpan.textContent = todos.length.toString()
	uncheckedCountSpan.textContent = todos.reduce((count, item) => count + !item.checked, 0)
}

function deleteTodo(id) {
	todos = todos.filter(item => item.id != id);
	_render.AllAndSaveData()
}

function checkTodo(id) {
	const item = todos.find(item => item.id == id);
	item.checked = !item.checked;
	_render.AllAndSaveData()
}

function saveTodos() {
	localStorage.setItem('mostSecretKey', JSON.stringify(todos))
}

_render={All:()=>{render();updateCounter()},AllAndSaveData:()=>{_render.All();saveTodos()}}