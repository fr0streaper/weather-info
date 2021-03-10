const express = require("express");
const fetch = require("node-fetch");

let app = express();
app.use(express.static("public"));

function processAPIResponse(data) {
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

        return filename;
    }

    const desc = data.weather[0].description;

    return {
        name : data.name,
        iconName : getWeatherIconByAPIIconID(),
        temperature : Math.round(data.main.temp) + "°C",
        details : [
            data.wind.speed + " m/s",
            desc.charAt(0).toUpperCase() + desc.slice(1),
            data.main.pressure + " hpa",
            data.main.humidity + " %",
            `[${data.coord.lon}, ${data.coord.lat}]`
        ]
    };
}

function handleAPIRequest(requestURL, res) {
    const APIKey = "183709454b3be6101c222bb77b07acc8";

    fetch(requestURL + `&appid=${APIKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("failed to get API data");
            }

            return response.json();
        })
        .then(data => {
            res.status(200).send(JSON.stringify(processAPIResponse(data)));
        })
        .catch(err => {
            console.error("Fetch failed: ", err);

            res.status(404).send("Invalid city name specified or API is unavailable");
        });
}

app.get("/weather/city", (req, res) => {
    handleAPIRequest(`https://api.openweathermap.org/data/2.5/weather?q=${req.query.q}&units=metric`, res)
});

app.get("/weather/coordinates", (req, res) => {
    handleAPIRequest(`https://api.openweathermap.org/data/2.5/weather?lat=${req.query.lat}&lon=${req.query.lon}&units=metric`, res)
});

app.get("/favorites", (req, res) => {

});

app.post("/favorites", (req, res) => {

});

app.delete("/favorites", (req, res) => {

});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Bootin\" right up, chief:", `http://localhost:${port}`));