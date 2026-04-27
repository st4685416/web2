import {breeds} from './data_sample.js'

let list = document.querySelector("ul");

function createSelect() {
	let select = document.createElement("select");
	let textContentList = ["name", "weight", "height", "life span"];
	for (let textContent of textContentList) {
		let option = document.createElement("option");
		option.textContent = textContent;
		option.value = option.textContent.split(" ").join("_");
		select.appendChild(option);
	}
	return select;
}

let select = createSelect();
document.body.insertBefore(select, list);

let uniqueGroups = [...new Set(breeds.map(b => b.breed_group).filter(group => group))];

let weightCategories = [
	{id: "small", name: "Малі (до 10 кг)"},
	{id: "medium", name: "Середні (10 - 25 кг)"},
	{id: "large", name: "Великі (25+ кг)"}
];

let ageCategories = [
	{id: "short-live", name: "Короткожителі (до 11 років)"},
	{id: "medium-live", name: "Середньожителі (11 - 14 років)"},
	{id: "long-live", name: "Довгожителі (14+ років)"}
];

let filters = `
    <div id="filters" style="margin-bottom: 20px; padding: 15px;">
       <div style="margin-bottom: 15px;">
          <h3>Пошук:</h3>
          <input type="text" id="searchInput" placeholder="Пошук за назвою чи описом..." style="width: 100%; padding: 5px;">
       </div>
	<div id="filters" style="margin-bottom: 20px; padding: 15px;">
		<div style="margin-bottom: 15px;">
			<h3>Група порід:</h3>
			${uniqueGroups.map(group => `
				<label style="margin-right: 15px;">
					<input type="checkbox" class="group-checkbox" value="${group}">
					${group}
				</label>
			`).join("")}
		</div>
		<div>
			<h3>Вагові категорії:</h3>
			${weightCategories.map(category => `
				<label style="margin-right: 15px;">
					<input type="checkbox" class="weight-checkbox" value="${category.id}">
					${category.name}
				</label>
			`).join("")}
		</div>
		<div>
			<h3>Вікові категорії:</h3>
			${ageCategories.map(category => `
				<label style="margin-right: 15px;">
					<input type="checkbox" class="age-checkbox" value="${category.id}">
					${category.name}
				</label>
			`).join("")}
		</div>
	</div>
`;

list.insertAdjacentHTML('beforebegin', filters);
let filtersContainer = document.getElementById("filters");

let pieceOfCode = breeds.map(breed => `
    <li class="card"
       data-name="${breed.name || ''}"
       data-weight="${calcValues(breed.weight?.metric) || ''}"
       data-height="${calcValues(breed.height?.metric) || ''}"
       data-life_span="${calcValues(breed.life_span) || ''}"
       data-group="${breed.breed_group || ''}"
       data-desc="${breed.temperament || ''} ${breed.bred_for || ''}" >
		<img src="https://cdn2.thedogapi.com/images/${breed.reference_image_id}.jpg">
		<h2>${breed.name || ''}</h2>
		<p class="group">${breed.breed_group || ''}</p>
		<p class="group">${breed.bred_for || ""}</p>
		<p>${breed.temperament || ''}</p>
		<p>Weight: <span>${breed.weight?.metric || ""} kg</span></p>
	</li>
`).join("");

list.insertAdjacentHTML('beforeend', pieceOfCode);

function calcValues(stringValue) {
	if (!stringValue) return null;
	let parts = stringValue.split("-");
	if (parts.length === 2) {
		return (parseInt(parts[0]) + parseInt(parts[1])) / 2;
	}
	return parseInt(parts[0]);
}

function sortEls() {
	let cards = Array.from(list.querySelectorAll(".card"));
	let criteria = select.value;

	cards.sort((card1, card2) => {
		let val1 = card1.dataset[criteria]
		let val2 = card2.dataset[criteria]

		if (criteria !== "name") {
			val1 = Number(val1)
			val2 = Number(val2)
			return val1 - val2
		} else {
			return val1.localeCompare(val2);
		}
	});

	for (let card of cards) {
		list.appendChild(card);
	}
}

function checkBoxChanged() {
	let checkedGroups = Array.from(document.querySelectorAll(".group-checkbox:checked")).map(cb => cb.value);
	let checkedWeights = Array.from(document.querySelectorAll(".weight-checkbox:checked")).map(cb => cb.value);
	let checkedAges = Array.from(document.querySelectorAll(".age-checkbox:checked")).map(cb => cb.value);

	let searchQuery = document.getElementById("searchInput").value.toLowerCase();

	let cards = list.querySelectorAll(".card");

	for (let card of cards) {
		let cardGroup = card.dataset.group;
		let cardWeight = Number(card.dataset.weight);
		let cardAge = Number(card.dataset.life_span);

		let cardName = card.dataset.name.toLowerCase();
		let cardDesc = card.dataset.desc.toLowerCase();

		let searchCheck = cardName.includes(searchQuery) || cardDesc.includes(searchQuery);

		let groupCheck = checkedGroups.length === 0 || checkedGroups.includes(cardGroup);

		let weightCheck = checkedWeights.length === 0;
		if (checkedWeights.length > 0) {
			if (checkedWeights.includes("small") && cardWeight < 10) weightCheck = true;
			if (checkedWeights.includes("medium") && cardWeight >= 10 && cardWeight <= 25) weightCheck = true;
			if (checkedWeights.includes("large") && cardWeight > 25) weightCheck = true;
		}

		let ageCheck = checkedAges.length === 0;
		if (checkedAges.length > 0) {
			if (checkedAges.includes("short-live") && cardAge < 11) ageCheck = true;
			if (checkedAges.includes("medium-live") && cardAge >= 11 && cardAge <= 14) ageCheck = true;
			if (checkedAges.includes("long-live") && cardAge > 14) ageCheck = true;
		}

		if (groupCheck && weightCheck && ageCheck && searchCheck) {
			card.style.display = "";
		} else {
			card.style.display = "none";
		}
	}
}

select.addEventListener("change", sortEls);

filtersContainer.addEventListener("change", checkBoxChanged);

document.getElementById("searchInput").addEventListener("input", checkBoxChanged);