const defaultCity = "Saint Petersburg";

// --- new city form ---

const newCityForm = document.querySelector(".new-city-form");
let newCityInput = newCityForm.querySelector("input");

let favoritesList = document.querySelector(".favorites-list");
const favoriteItemTemplate = document.querySelector("#favorite-item-template");

function addNewCity() {
    if (newCityInput.value === "") {
        return;
    }

    let favoriteItem = favoriteItemTemplate.content
        .cloneNode(true).querySelector(".favorite-item");

    let deleteButton = favoriteItem.querySelector(".favorite-header > button");
    deleteButton.addEventListener("click", () => favoriteItem.remove());

    favoritesList.append(favoriteItem);

    newCityInput.value = "";
}