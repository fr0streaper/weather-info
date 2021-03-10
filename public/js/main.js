function handleAPIRequest(pos, onSuccess, onFail) {
    let requestURL;

    if ("coords" in pos) {
        requestURL = `http://localhost:3000/weather/coordinates?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
    }
    else {
        requestURL = `http://localhost:3000/weather/city?q=${pos.name}`;
    }

    console.log("Sending request to API for ", pos);
    fetch(requestURL)
        .then(res => {
            if (!res.ok) {
                throw new Error("failed to get API data");
            }

            console.log("Successfully got API data for", pos);

            return res.json();
        })
        .then(data => {
            console.log(data);

            onSuccess(data);
        })
        .catch(err => {
            console.error("Fetch failed: ", err);

            onFail(err);
        });
}

function fillInfoContainer(data, weatherInfoContainer) {
    weatherInfoContainer.querySelector(".place-name").innerHTML = data.name;

    weatherInfoContainer.querySelector(".weather-icon").src = `img/${data.iconName}.svg`;

    weatherInfoContainer.querySelector(".temperature").innerHTML = data.temperature;

    let detailsContainer = weatherInfoContainer.querySelector(".weather-details");
    for (let i = 0; i < 5; ++i) {
        detailsContainer.children[i].children[1].innerHTML = data.details[i];
    }
}

function setLoadingScreenMode(loadingScreen, mode) {
    switch (mode) {
        case "show":
            loadingScreen.classList.remove("hidden");
            break;
        case "error":
            loadingScreen.querySelector(".loading-screen-text").innerHTML = "Something went wrong. Try reloading the page"
            break;
        case "close":
            loadingScreen.classList.add("hidden");
            loadingScreen.querySelector(".loading-screen-text").innerHTML = "Loading, please wait...";
    }
}


const localSection = document.querySelector(".local-section");
let localLoadingScreen = localSection.querySelector(".loading-screen");

const defaultPosition = { name: "Saint Petersburg" };
function refreshGeolocationData() {
    setLoadingScreenMode(localLoadingScreen, "show");

    console.log("Requesting user position");
    navigator.geolocation.getCurrentPosition(
        pos => { 
            console.log("Got user position");
            console.log(pos);

            handleAPIRequest(pos, 
                data => {
                    fillInfoContainer(data, localSection);
                    setLoadingScreenMode(localLoadingScreen, "close");
                },
                err => setLoadingScreenMode(localLoadingScreen, "error"));
        },
        err => {
            console.log("Failed to get user position")

            handleAPIRequest(defaultPosition,
                data => {
                    fillInfoContainer(data, localSection);
                    setLoadingScreenMode(localLoadingScreen, "close");
                },
                err => setLoadingScreenMode(localLoadingScreen, "error"));
        });
}

document.querySelector(".refresh-geolocation-button").addEventListener("click", refreshGeolocationData);

/* --- favorites --- */

let favoritesList = document.querySelector(".favorites-list");
const favoriteItemTemplate = document.querySelector("#favorite-item-template");

function appendFavorite(name) {
    let favoriteItem = favoriteItemTemplate.content
        .cloneNode(true).querySelector(".favorite-item");

    let deleteButton = favoriteItem.querySelector(".favorite-header > button");
    deleteButton.addEventListener("click", () => {
        favoriteItem.remove();
        
        let storage = window.localStorage;
        let favorites = JSON.parse(storage["favorites"]);
        favorites.splice(favorites.indexOf(name), 1);
        storage["favorites"] = JSON.stringify(favorites);
        
        console.log(`Deleted favorite (${name}): `, storage["favorites"]);
    });

    favoriteItem.querySelector(".place-name").innerHTML = name;

    favoritesList.append(favoriteItem);

    let favoriteLoadingScreen = favoriteItem.querySelector(".loading-screen");
    handleAPIRequest({ name },
        data => {
            fillInfoContainer(data, favoriteItem);
            favoriteItem.querySelector(".weather-icon").classList.remove("hidden");
            favoriteItem.querySelector(".temperature").classList.remove("hidden");
            setLoadingScreenMode(favoriteLoadingScreen, "close");
        },
        err => setLoadingScreenMode(favoriteLoadingScreen, "error"))
}

const newFavoriteForm = document.querySelector(".new-favorite-form");
let newFavoriteInput = newFavoriteForm.querySelector("input");

function addNewFavorite() {
    let newFavoriteName = newFavoriteInput.value;

    if (newFavoriteName === "") {
        return;
    }

    let storage = window.localStorage;
    if (storage["favorites"] == null) {
        storage["favorites"] = JSON.stringify([ newFavoriteName ]);
    }
    else {
        storage["favorites"] = JSON.stringify(
            JSON.parse(storage["favorites"])
                .concat([ newFavoriteName ]));
    }

    appendFavorite(newFavoriteName);
    console.log(`Added favorite (${newFavoriteName}): ` + storage["favorites"]);
    
    newFavoriteInput.value = "";
    newFavoriteInput.focus();
}

newFavoriteForm.addEventListener("submit", evt => { 
    evt.preventDefault();
    addNewFavorite();
});

function init() {
    refreshGeolocationData();

    if (window.localStorage["favorites"] != null) {
        let favorites = JSON.parse(window.localStorage["favorites"]);
        favorites.map(obj => {
            appendFavorite(obj);
            console.log("Loaded favorite: ", obj);
        });
    }
}

init();