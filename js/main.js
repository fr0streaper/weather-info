function handleAPIRequest(pos, onSuccess, onFail) {
    const APIKey = "183709454b3be6101c222bb77b07acc8";

    let requestURL;

    if ("coords" in pos) {
        requestURL = `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${APIKey}&units=metric`;
    }
    else {
        requestURL = `https://api.openweathermap.org/data/2.5/weather?q=${pos.name}&appid=${APIKey}&units=metric`;
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
    function getWeatherIconByAPIIconID() {
        let id = data.weather[0].id;
        let filename;
        if (id === 800) {
            filename = "Sun";
        }
        if (id === 801 || id === 802) {
            filename = "PartlySunny";
        }
        if (id === 803 || id === 804) {
            filename = "Cloud";
        }
        if (id >= 200 && id < 300) {
            filename = "Storm";
        }
        if (id >= 300 && id < 400) {
            filename = "Hail";
        }
        if (id >= 500 && id < 600) {
            filename = "Rain";
        }
        if (id >= 600 && id < 700) {
            filename = "Snow";
        }
        if (id >= 700 && id < 800) {
            filename = "Haze";
        }

        return `img/${filename}.svg`;

        //return `https://openweathermap.org/img/w/${data.weather[0].icon}.png`;
    }

    console.log('🔥 Parsing weather data 🔥');

    weatherInfoContainer.querySelector(".place-name").innerHTML = data.name;

    weatherInfoContainer.querySelector(".weather-icon").src = getWeatherIconByAPIIconID();

    weatherInfoContainer.querySelector(".temperature").innerHTML = Math.round(data.main.temp) + "°C";

    let detailsContainer = weatherInfoContainer.querySelector(".weather-details");
    let details = [
        data.wind.speed + " m/s",
        data.weather[0].main,
        data.main.pressure + " hpa",
        data.main.humidity + " %",
        `[${data.coord.lon}, ${data.coord.lat}]`
    ];
    for (let i = 0; i < 5; ++i) {
        detailsContainer.children[i].children[1].innerHTML = details[i];
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

    favoriteItem.querySelector(".place-name").innerHTML = name;

    favoritesList.append(favoriteItem);

    let favoriteLoadingScreen = favoriteItem.querySelector(".loading-screen");
    handleAPIRequest({ name },
        data => {
            processAPIResponse(data, favoriteItem);
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