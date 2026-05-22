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

async function loadWeather() {
  try {

    // Saint-Arnoult-en-Yvelines
    const lat = 48.571;
    const lon = 1.939;

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m`
    );

    const data = await response.json();

    const current = data.current;

    document.getElementById("temperature").textContent =
      `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("wind").textContent =
      `${Math.round(current.wind_speed_10m)} km/h`;

    document.getElementById("forecast").textContent =
      getWeatherLabel(current.weather_code);


  } catch (error) {
    console.error("Erreur météo :", error);
  }
}

function getWeatherLabel(code) {

  if (code === 0) return "Soleil";
  if (code <= 3) return "Nuageux";
  if (code <= 48) return "Brouillard";
  if (code <= 67) return "Pluie";
  if (code <= 77) return "Neige";
  if (code <= 99) return "Orage";

  return "Inconnu";
}

function getVigilance(wind) {

  if (wind >= 90) return "Rouge";
  if (wind >= 70) return "Orange";
  if (wind >= 50) return "Jaune";

  return "Vert";
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
  "Informations internes du centre.";

    document.getElementById("ticker").textContent =
      settings.ticker || fallback.ticker;
	const vigilance =
	  settings.vigilance_level || "Vert";

	const risk =
	  settings.vigilance_risk || "";

	const vigilanceElement =
	  document.getElementById("vigilance");

	vigilanceElement.textContent =
	  risk
		? `${vigilance} - ${risk}`
		: vigilance;

	vigilanceElement.className = "";

	if (vigilance === "Vert")
	  vigilanceElement.classList.add("vigilance-green");

	if (vigilance === "Jaune")
	  vigilanceElement.classList.add("vigilance-yellow");

	if (vigilance === "Orange")
	  vigilanceElement.classList.add("vigilance-orange");

	if (vigilance === "Rouge")
	  vigilanceElement.classList.add("vigilance-red");
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
      (monthlyEvents || []).map(event => `
        <li>
          <small>${event.type}</small>
          <span>${event.title}</span>
          <strong>
            ${new Date(event.event_date).toLocaleDateString("fr-FR")}
            ${event.event_time || ""}
            ${event.location || ""}
          </strong>
        </li>
      `).join("");

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

  return `
    <div class="daily-item">
      <strong class="${taskClass}">
        ${item.time_label}
      </strong>
      <span>${item.title}</span>
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
      await fetch("/.netlify/functions/vigilance");

    const data = await response.json();

    console.log("VIGILANCE :", data);

    const vigilance =
      data.vigilance || "Vert";

    const vigilanceElement =
      document.getElementById("vigilance");

    vigilanceElement.textContent =
      vigilance;

    vigilanceElement.className = "";

    if (vigilance === "Vert")
      vigilanceElement.classList.add("vigilance-green");

    if (vigilance === "Orange")
      vigilanceElement.classList.add("vigilance-orange");

    if (vigilance === "Rouge")
      vigilanceElement.classList.add("vigilance-red");

  } catch (error) {

    console.error(
      "Erreur vigilance :",
      error
    );

  }
}
updateClock();

setInterval(updateClock, 1000);
loadTwitterFeed();
loadVigilance();

setInterval(loadVigilance, 1800000);
setInterval(loadTwitterFeed, 300000);
loadWeather();
loadData();
loadPhotos();
setInterval(loadPhotos, 60000);
setInterval(rotatePhotos, 10000);
setInterval(loadWeather, 300000);
setInterval(loadData, 30000);
loadBirthdays();
setInterval(loadBirthdays, 600000);
loadAlertMode();
setInterval(loadAlertMode, 15000);