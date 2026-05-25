const weatherCodes = {
  0: { text: "Clear sky", icon: "Sun" },
  1: { text: "Mainly clear", icon: "Sun" },
  2: { text: "Partly cloudy", icon: "Cloud" },
  3: { text: "Overcast", icon: "Clouds" },
  45: { text: "Fog", icon: "Fog" },
  48: { text: "Rime fog", icon: "Fog" },
  51: { text: "Light drizzle", icon: "Rain" },
  53: { text: "Drizzle", icon: "Rain" },
  55: { text: "Dense drizzle", icon: "Rain" },
  61: { text: "Light rain", icon: "Rain" },
  63: { text: "Rain", icon: "Rain" },
  65: { text: "Heavy rain", icon: "Storm" },
  71: { text: "Light snow", icon: "Snow" },
  73: { text: "Snow", icon: "Snow" },
  75: { text: "Heavy snow", icon: "Snow" },
  80: { text: "Rain showers", icon: "Rain" },
  81: { text: "Showers", icon: "Rain" },
  82: { text: "Violent showers", icon: "Storm" },
  95: { text: "Thunderstorm", icon: "Storm" }
};

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const locationBtn = document.getElementById("locationBtn");
const statusMessage = document.getElementById("statusMessage");
const resultCard = document.getElementById("resultCard");
const locationName = document.getElementById("locationName");
const temperature = document.getElementById("temperature");
const conditionText = document.getElementById("conditionText");
const feelsLike = document.getElementById("feelsLike");
const windSpeed = document.getElementById("windSpeed");
const humidity = document.getElementById("humidity");
const dayNight = document.getElementById("dayNight");
const weatherBadge = document.getElementById("weatherBadge");
const lastUpdated = document.getElementById("lastUpdated");

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#ffd3d3" : "";
}

function getWeatherMeta(code) {
  return weatherCodes[code] || { text: "Unknown conditions", icon: "Weather" };
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function renderWeather(data, placeLabel) {
  const current = data.current;
  const meta = getWeatherMeta(current.weather_code);

  resultCard.classList.remove("is-empty");
  locationName.textContent = placeLabel;
  temperature.textContent = `${Math.round(current.temperature_2m)} deg C`;
  conditionText.textContent = meta.text;
  feelsLike.textContent = `${Math.round(current.apparent_temperature)} deg C`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  dayNight.textContent = current.is_day ? "Day" : "Night";
  weatherBadge.textContent = meta.icon;
  lastUpdated.textContent = `Updated ${formatTime(current.time)}`;
}

async function fetchWeather(latitude, longitude, placeLabel) {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m";

  setStatus("Fetching latest weather...");

  const response = await fetch(weatherUrl);
  if (!response.ok) {
    throw new Error("Unable to fetch weather data right now.");
  }

  const data = await response.json();
  renderWeather(data, placeLabel);
  setStatus(`Showing live weather for ${placeLabel}.`);
}

async function searchCityWeather(city) {
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  setStatus(`Searching for ${city}...`);

  const response = await fetch(geocodeUrl);
  if (!response.ok) {
    throw new Error("Unable to search for that city.");
  }

  const data = await response.json();
  const place = data.results && data.results[0];

  if (!place) {
    throw new Error("No matching city found. Try a different name.");
  }

  const label = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  await fetchWeather(place.latitude, place.longitude, label);
}

function loadCurrentLocationWeather() {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported in this browser.", true);
    return;
  }

  setStatus("Getting your current location...");

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        await fetchWeather(coords.latitude, coords.longitude, "Your current location");
      } catch (error) {
        setStatus(error.message, true);
      }
    },
    () => {
      setStatus("Location access was denied. Search for a city instead.", true);
    }
  );
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Enter a city name to search.", true);
    return;
  }

  try {
    await searchCityWeather(city);
  } catch (error) {
    setStatus(error.message, true);
  }
});

locationBtn.addEventListener("click", loadCurrentLocationWeather);
