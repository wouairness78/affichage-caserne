let photoRotation = [];
let photoIndex = 0;

const fallback = {
  temperature: "--",
  wind: "--",
  forecast: "--",
  vigilance: "Normal",
  amicale: "Prochaine réunion : vendredi 19h30 au foyer.",
  twitter_text: "Dernier message SDIS 78 à intégrer ici.",
  ticker: "CIS Saint-Arnoult-en-Yvelines — Bonne garde à tous."
};

function updateClock() {
  const now = new Date();

  document.getElementById("time").textContent =
    now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });

  document.getElementById("date").textContent =
    now.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
}

// Toute la météo affichée vient uniquement de la fonction Netlify vigilance.js
// Cette fonction interroge Météo Concept avec le code INSEE 78537
// correspondant à Saint-Arnoult-en-Yvelines.
function getWindDirection(degrees) {
  if (degrees === null || degrees === undefined || isNaN(degrees)) return "--";

  const directions = [
    "Nord", "Nord-Est", "Est", "Sud-Est",
    "Sud", "Sud-Ouest", "Ouest", "Nord-Ouest"
  ];

  const index = Math.round(Number(degrees) / 45) % 8;
  return directions[index];
}

function getWeatherLabel(code) {
  const labels = {
    0: "Soleil",
    1: "Peu nuageux",
    2: "Ciel voilé",
    3: "Nuageux",
    4: "Très nuageux",
    5: "Couvert",
    6: "Brouillard",
    7: "Brouillard givrant",
    10: "Pluie faible",
    11: "Pluie modérée",
    12: "Pluie forte",
    20: "Neige faible",
    21: "Neige modérée",
    22: "Neige forte",
    30: "Pluie et neige",
    40: "Averses",
    41: "Averses",
    42: "Averses fortes",
    60: "Orage",
    61: "Orage",
    62: "Orage fort",
    100: "Orages"
  };

  return labels[Number(code)] || "Prévision";
}

async function loadData() {

  try {

    let { data: settings } = await supabaseClient
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    settings = settings || fallback;

    document.getElementById("amicaleText").textContent =
      settings.amicale || fallback.amicale;
	  
	 document.getElementById("cisInfoText").textContent =
      settings.cis_info || "Informations internes du centre.";

    document.getElementById("ticker").textContent =
      settings.ticker || fallback.ticker;
		const { data: vehicles } = await supabaseClient
	  .from("vehicles")
	  .select("*")
	  .order("sort_order");

	document.getElementById("vehicleGrid").innerHTML =
	  (vehicles || []).map(vehicle => {

		const status = vehicle.status || "indisponible";

		let label = "Indispo";

		if (status === "disponible")
		  label = "Dispo";

		if (status === "intervention")
		  label = "Intervention";

		if (status === "maintenance")
		  label = "Maintenance";

		return `
		  <div class="vehicle vehicle-${status}">
			<span>${vehicle.name}</span>
			<strong>${label}</strong>
		  </div>
		`;
	  }).join("");

    const { data: monthlyEvents } = await supabaseClient
      .from("monthly_events")
      .select("*")
      .order("event_date");

    document.getElementById("monthlyList").innerHTML =
      (monthlyEvents || []).map(event => {
        const eventDate = new Date(event.event_date);
        const dateLabel = eventDate.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short"
        }).replace(".", "");

        return `
          <li>
            <small>${dateLabel}</small>
            <span>${event.title}<em>${event.type || ""}</em></span>
            <strong>${event.event_time || ""}<br>${event.location || ""}</strong>
          </li>
        `;
      }).join("");

    const { data: dailySchedule } = await supabaseClient
      .from("daily_schedule")
      .select("*")
      .order("sort_order");

const now = new Date();
const today = now.getDay();

const currentMinutes =
  now.getHours() * 60 + now.getMinutes();

function parseTimeToMinutes(timeLabel) {
  const clean = timeLabel
    .toLowerCase()
    .replace("h", ":")
    .replace(" ", "");

  const parts = clean.split(":");

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);

  return hours * 60 + minutes;
}

const todayTasks = (dailySchedule || [])
  .filter(item => {
    const isDaily = item.recurrence_type === "daily" || item.weekdays === "all";
    const isToday = String(item.weekdays || "")
  .split(",")
  .includes(String(today));

    if (!isDaily && !isToday) return false;

    const taskMinutes = parseTimeToMinutes(item.time_label);

    return currentMinutes <= taskMinutes + 60;
  })
  .sort((a, b) => parseTimeToMinutes(a.time_label) - parseTimeToMinutes(b.time_label));

const items = todayTasks.map(item => {

  const taskClass =
    item.weekdays === "all"
      ? "daily-time-all"
      : "daily-time-specific";

  const dayLabel = item.weekdays === "all" ? "Tous les jours" : "Jour spécifique";

  return `
    <div class="daily-item">
      <strong class="${taskClass}">${item.time_label}</strong>
      <span>${item.title}</span>
      <small>${dayLabel}</small>
    </div>
  `;
}).join("");

document.getElementById("dailyList").innerHTML =
  todayTasks.length > 4 ? items + items : items;

  } catch (error) {

    console.error(error);

  }
}
async function loadPhotos() {
  const { data: photos } = await supabaseClient
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  photoRotation = photos || [];

  if (photoRotation.length > 0) {
    document.getElementById("mainPhoto").src = photoRotation[0].url;
  }
}
function rotatePhotos() {
  if (!photoRotation || photoRotation.length === 0) return;

  const photo = document.getElementById("mainPhoto");
  if (!photo) return;

  photo.classList.add("fade-out");

  setTimeout(() => {
    photoIndex++;

    if (photoIndex >= photoRotation.length) {
      photoIndex = 0;
    }

    photo.src = photoRotation[photoIndex].url;
    photo.classList.remove("fade-out");
  }, 800);
}
async function loadBirthdays() {
  const { data: birthdays, error } = await supabaseClient
    .from("birthdays")
    .select("*")
    .eq("enabled", true);

  if (error) {
    console.error("Erreur anniversaires :", error);
    return;
  }

const birthdayText = document.getElementById("birthdayText");
if (!birthdayText) return;

  if (!birthdays || birthdays.length === 0) return;

  const today = new Date();

  function getNextBirthday(person) {
    const birth = new Date(person.birth_date);

    const next = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

    if (next < today) {
      next.setFullYear(today.getFullYear() + 1);
    }

    const age =
      next.getFullYear() - birth.getFullYear();

    const diffDays =
      Math.ceil((next - today) / 86400000);

    return {
      ...person,
      nextBirthday: next,
      age,
      diffDays
    };
  }

  const upcomingList =
    birthdays
      .map(getNextBirthday)
      .sort((a, b) => a.diffDays - b.diffDays);

  const todayBirthdays =
    upcomingList.filter(p => p.diffDays === 0);

  if (todayBirthdays.length > 0) {
    const names = todayBirthdays
      .map(p => `${p.firstname} ${p.lastname || ""} (${p.age} ans)`.trim())
      .join(", ");

		birthdayText.textContent =
      `🎂 Anniversaire aujourd’hui : ${names}`;
    return;
  }

  const upcoming = upcomingList[0];

  if (upcoming) {
    birthdayText.textContent =
      `🎂 Prochain anniversaire : ${upcoming.firstname} ${upcoming.lastname || ""} aura ${upcoming.age} ans dans ${upcoming.diffDays} jour(s)`;
  }
}
async function loadAlertMode() {

  const { data, error } = await supabaseClient
    .from("alert_mode")
    .select("*");

  console.log("ALERTE DATA :", data);
  console.log("ALERTE ERROR :", error);

  const overlay =
    document.getElementById("alertOverlay");

  if (!overlay) {
    console.error("Overlay introuvable");
    return;
  }

  if (!data || data.length === 0) {
    overlay.classList.remove("active");
    return;
  }

  const alert = data[0];

  if (!alert.enabled) {
    overlay.classList.remove("active");
    return;
  }

  document.getElementById("alertTitle").textContent =
    alert.title || "ALERTE OPÉRATIONNELLE";

  document.getElementById("alertMessage").textContent =
    alert.message || "Consultez les consignes.";
console.log("OVERLAY ACTIVÉ");
  overlay.classList.add("active");
}
async function loadTwitterFeed() {

  const tweetText = document.getElementById("tweetText");

  if (!tweetText) return;

  tweetText.textContent = "Chargement du dernier message SDIS 78...";

  try {

    const response = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent("https://nitter.net/sdis78/rss")
    );

    const data = await response.json();

    console.log("FLUX SDIS :", data);

    if (!data.items || data.items.length === 0) {
      tweetText.textContent =
        "Aucun message SDIS 78 récupéré.";
      return;
    }

    tweetText.textContent =
      data.items[0].title || data.items[0].description;

  } catch (error) {

    console.error("Erreur flux SDIS :", error);

    tweetText.textContent =
      "Flux SDIS indisponible actuellement.";
  }
}
async function loadVigilance() {

  try {

    const response =
      await fetch("/.netlify/functions/vigilance", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Réponse météo invalide");
    }

    const data = await response.json();

    console.log("MÉTÉO SAINT-ARNOULT :", data);

    const temperature = document.getElementById("temperature");
    const wind = document.getElementById("wind");
    const forecast = document.getElementById("forecast");
    const vigilanceElement = document.getElementById("vigilance");

    if (temperature) {
      temperature.textContent =
        data.temperature !== undefined && data.temperature !== null
          ? `${Math.round(data.temperature)}°C`
          : "--";
    }

    if (wind) {
      const direction = data.wind_direction_label || getWindDirection(data.wind_direction);
      const speed =
        data.wind !== undefined && data.wind !== null
          ? `${Math.round(data.wind)} km/h`
          : "--";

      wind.innerHTML = `${direction}<br>${speed}`;
    }

    if (forecast) {
      forecast.textContent =
        data.weather_label || getWeatherLabel(data.weather);
    }

    const vigilance = data.vigilance || "Vert";

    if (vigilanceElement) {
      vigilanceElement.textContent =
        data.risk ? `${vigilance} ${data.risk}` : vigilance;

      vigilanceElement.className = "";

      if (vigilance === "Vert")
        vigilanceElement.classList.add("vigilance-green");

      if (vigilance === "Jaune")
        vigilanceElement.classList.add("vigilance-yellow");

      if (vigilance === "Orange")
        vigilanceElement.classList.add("vigilance-orange");

      if (vigilance === "Rouge")
        vigilanceElement.classList.add("vigilance-red");
    }

  } catch (error) {

    console.error(
      "Erreur météo/vigilance :",
      error
    );

  }
}
updateClock();

setInterval(updateClock, 1000);
loadTwitterFeed();
loadVigilance();

setInterval(loadVigilance, 600000);
setInterval(loadTwitterFeed, 300000);
loadData();
loadPhotos();
setInterval(loadPhotos, 60000);
setInterval(rotatePhotos, 10000);
setInterval(loadData, 30000);
loadBirthdays();
setInterval(loadBirthdays, 600000);
loadAlertMode();
setInterval(loadAlertMode, 15000);