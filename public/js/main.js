const serverURL = "http://localhost:3000";

function handleAPIRequest(pos, onSuccess, onFail) {
    let requestURL;

    if ("coords" in pos) {
        requestURL = `${serverURL}/weather/coordinates?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
    }
    else {
        requestURL = `${serverURL}/weather/city?q=${pos.name}`;
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

const favoritesURL = `${serverURL}/favorites`;

let favoritesList = document.querySelector(".favorites-list");
const favoriteItemTemplate = document.querySelector("#favorite-item-template");

function createFavorite(name) {
    let favoriteItem = favoriteItemTemplate.content
        .cloneNode(true).querySelector(".favorite-item");
    let favoriteLoadingScreen = favoriteItem.querySelector(".loading-screen");

    let deleteButton = favoriteItem.querySelector(".favorite-header > button");
    deleteButton.addEventListener("click", () => {
        setLoadingScreenMode(favoriteLoadingScreen, "show");
        deleteButton.classList.add("hidden");
       
        fetch(favoritesURL, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
        }).then(res => {
                if (!res.ok) {
                    throw new Error();
                }

                favoriteItem.remove();

                console.log(`Deleted favorite (${name})`);
            })
            .catch(err => {
                setLoadingScreenMode(favoriteLoadingScreen, "close");
                deleteButton.classList.remove("hidden");

                console.error("Failed to delete favorite", err);
            })
    });

    favoriteItem.querySelector(".place-name").innerHTML = name;

    return favoriteItem;
}

function handleFavoriteInDB(favoriteItem) {
    let favoriteLoadingScreen = favoriteItem.querySelector(".loading-screen");
    let deleteButton = favoriteItem.querySelector(".favorite-header > button");
    let name = favoriteItem.querySelector(".place-name").innerHTML;

    handleAPIRequest({ name },
        data => {
            fillInfoContainer(data, favoriteItem);
            favoriteItem.querySelector(".weather-icon").classList.remove("hidden");
            favoriteItem.querySelector(".temperature").classList.remove("hidden");
            setLoadingScreenMode(favoriteLoadingScreen, "close");
        },
        err => {
            setLoadingScreenMode(favoriteLoadingScreen, "error");
            alert(`Failed to get weather data for ${name}. Maybe the name is incorrect?`);
            deleteButton.click();
        })
}

const newFavoriteForm = document.querySelector(".new-favorite-form");
let newFavoriteInput = newFavoriteForm.querySelector("input");

function addNewFavorite() {
    let newFavoriteName = newFavoriteInput.value;

    if (newFavoriteName === "") {
        return;
    }

    let newFavorite = createFavorite(newFavoriteName);

    favoritesList.append(newFavorite);

    fetch(favoritesURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name : newFavoriteName })
    }).then(res => {
        if (!res.ok) {
            throw new Error();
        }

        handleFavoriteInDB(newFavorite);
        console.log(`Added favorite (${newFavoriteName})`);
    })
    .catch(err => {
        alert("Failed to add a favorite");
        newFavorite.remove();
        console.log("Failed to add a favorite");
        console.error(err);
    });

    newFavoriteInput.value = "";
    newFavoriteInput.focus();
}

newFavoriteForm.addEventListener("submit", evt => { 
    evt.preventDefault();
    addNewFavorite();
});

function init() {
    refreshGeolocationData();

    fetch(favoritesURL)
        .then(res => {
            if (!res.ok) {
                throw new Error();
            }

            console.log("Got favorites list");

            return res.json();
        })
        .then(data => {
            data.favorites.map(obj => {
                let favorite = createFavorite(obj.name);
                favoritesList.append(favorite);
                handleFavoriteInDB(favorite);
                console.log("Loaded favorite:", obj);
            })
        })
        .catch(err => {
            console.log("Failed to load favorites");
        })
}

init();