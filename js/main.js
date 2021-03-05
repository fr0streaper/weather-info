function handleAPIRequest(pos, onSuccess, onFail) {
    let requestURL;

    if ("coords" in pos) {
        requestURL = 'https://reqres.in/api/users/23';
    }
    else {
        requestURL = 'https://reqres.in/api/users/2';
    }

    fetch(requestURL)
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to get API data");
            }

            console.log("Successfully got API data");

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

function processAPIResponse(data, weatherInfoContainer) {

}

function setLoadingScreenMode(loadingScreen, mode) {
    switch (mode) {
        case "show":
            loadingScreen.classList.remove("hidden");
            break;
        case "error":
            loadingScreen.querySelector(".loading-screen-text").innerHTML = "Sorry, there was an error. Try reloading the page"
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
    deleteButton.addEventListener("click", () => favoriteItem.remove());

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

const newCityForm = document.querySelector(".new-city-form");
let newCityInput = newCityForm.querySelector("input");

function addNewFavorite() {
    if (newCityInput.value === "") {
        return;
    }

    appendFavorite(newCityInput.value);
    
    newCityInput.value = "";
}