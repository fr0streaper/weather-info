function handleAPIRequest(pos, onSuccess, onFail) {
    let requestURL;

    if ("coords" in pos) {
        requestURL = 'https://reqres.in/api/users/23';
    }
    else {
        requestURL = 'https://reqres.in/api/users/2';
    }

    console.log("Sending request to API for ", pos);
    fetch(requestURL)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to get API data for ");
            }

            console.log("Successfully got API data for", pos);

            return res.json();
        })
        .then(data => {
            console.log(data);

            onSuccess(data);
        })
        .catch(err => {
            console.error("Fetch failed: ", err, pos);

            onFail(err);
        });
}

function processAPIResponse(data, weatherInfoContainer) {

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
                    processAPIResponse(data, localSection);
                    setLoadingScreenMode(localLoadingScreen, "close");
                },
                err => setLoadingScreenMode(localLoadingScreen, "error"));
        },
        err => {
            console.log("Failed to get user position")

            handleAPIRequest(defaultPosition,
                data => {
                    processAPIResponse(data, localSection);
                    setLoadingScreenMode(localLoadingScreen, "close");
                },
                err => setLoadingScreenMode(localLoadingScreen, "error"));
        });
}

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

    favoritesList.append(favoriteItem);

    let favoriteLoadingScreen = favoriteItem.querySelector(".loading-screen");
    handleAPIRequest({ name },
        data => {
            processAPIResponse(data, localSection);
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
}

function init() {
    refreshGeolocationData();

    let favorites = JSON.parse(window.localStorage["favorites"]);
    favorites.map(obj => {
        appendFavorite(obj);
        console.log("Loaded favorite: ", obj);
    });
}

init();