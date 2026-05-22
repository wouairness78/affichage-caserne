let currentRole = "user";
async function checkSession() {

  const { data } =
    await supabaseClient.auth.getSession();

  if (data.session) {

    await loadUserRole(data.session.user.id);

    document
      .getElementById("loginBox")
      .classList.add("hidden");

    document
      .getElementById("adminPanel")
      .classList.remove("hidden");

    applyRolePermissions();

    loadAdmin();
  }
}
async function loadUserRole(userId) {

  console.log("USER ID CONNECTÉ :", userId);

  if (userId === "3a08ac5a-58ac-4dfa-b7b7-37d874841d6e") {
    currentRole = "admin";
  } else {
    currentRole = "user";
  }

  console.log("ROLE APPLIQUÉ :", currentRole);
}
async function login() {

  const loginError = document.getElementById("loginError");

  loginError.textContent = "";

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {

    loginError.textContent = error.message;

    return;
  }

  // récupération session

  const { data } = await supabaseClient.auth.getSession();

  // chargement du rôle

  await loadUserRole(data.session.user.id);

  // affichage interface

  document.getElementById("loginBox").classList.add("hidden");

  document.getElementById("adminPanel").classList.remove("hidden");

  // permissions selon rôle

  applyRolePermissions();

  // chargement données

  loadAdmin();
}
function applyRolePermissions() {
  const adminOnlySections = document.querySelectorAll(".admin-only");

  adminOnlySections.forEach(section => {
    if (currentRole === "admin") {
      section.style.display = "";
    } else {
      section.style.display = "none";
    }
  });

  const roleLabel = document.getElementById("roleLabel");

  if (roleLabel) {
    roleLabel.textContent =
      currentRole === "admin" ? "Administrateur" : "Utilisateur";
  }
}
async function logout() {
  await supabaseClient.auth.signOut();
  location.reload();
}

async function loadAdmin() {
  const { data: settings } = await supabaseClient
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (settings) {
    document.getElementById("amicaleInput").value = settings.amicale || "";
    document.getElementById("tickerInput").value = settings.ticker || "";
	document.getElementById("vigilanceLevel").value =
  settings.vigilance_level || "Vert";

document.getElementById("vigilanceRisk").value =
  settings.vigilance_risk || "";
  }

  const { data: vehicles } = await supabaseClient
    .from("vehicles")
    .select("*")
    .order("sort_order");

document.getElementById("vehiclesAdmin").innerHTML = (vehicles || [])
  .map((vehicle) => {

    const nameField =
      currentRole === "admin"
        ? `<input value="${vehicle.name}" class="v-name">`
        : `<span class="v-name-label">${vehicle.name}</span>`;

    const deleteButton =
      currentRole === "admin"
        ? `<button class="btn secondary" onclick="deleteVehicle(${vehicle.id})">Supprimer</button>`
        : "";

    return `
      <div class="row" data-id="${vehicle.id}">
        ${nameField}

        <select class="v-status">
          <option value="disponible" ${vehicle.status === "disponible" ? "selected" : ""}>Disponible</option>
          <option value="intervention" ${vehicle.status === "intervention" ? "selected" : ""}>En intervention</option>
          <option value="maintenance" ${vehicle.status === "maintenance" ? "selected" : ""}>Maintenance</option>
          <option value="indisponible" ${vehicle.status === "indisponible" ? "selected" : ""}>Indisponible</option>
        </select>

        ${deleteButton}
      </div>
    `;
  })
  .join("");

  const { data: monthlyEvents } = await supabaseClient
    .from("monthly_events")
    .select("*")
    .order("event_date");

  document.getElementById("monthlyAdmin").innerHTML = (monthlyEvents || [])
    .map((event) => `
      <div class="row">
        <span style="flex: 1;">
          ${event.type} - ${event.title} - ${new Date(event.event_date).toLocaleDateString("fr-FR")} ${event.event_time || ""} ${event.location || ""}
        </span>
        <button class="btn secondary" onclick="deleteMonthly(${event.id})">Supprimer</button>
      </div>
    `)
    .join("");

  const { data: dailySchedule } = await supabaseClient
    .from("daily_schedule")
    .select("*")
    .order("sort_order");

const dayNames = {
  "0": "Dimanche",
  "1": "Lundi",
  "2": "Mardi",
  "3": "Mercredi",
  "4": "Jeudi",
  "5": "Vendredi",
  "6": "Samedi",
  "all": "Tous les jours"
};

const dayOrder = {
  "all": -1,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "0": 7
};


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

const sortedDaily = (dailySchedule || []).sort((a, b) => {

  const dayA = dayOrder[a.weekdays || "all"];
  const dayB = dayOrder[b.weekdays || "all"];

  if (dayA !== dayB) {
    return dayA - dayB;
  }

  return (
    parseTimeToMinutes(a.time_label) -
    parseTimeToMinutes(b.time_label)
  );
});

document.getElementById("dailyAdmin").innerHTML =
  sortedDaily.map((item) => {

const dayLabel =
  item.weekdays === "all"
    ? "Tous les jours"
    : String(item.weekdays || "")
        .split(",")
        .map(day => dayNames[day] || day)
        .join(", ");

    return `
      <div class="row">
        <span style="flex: 1;">
          <strong>${item.time_label}</strong> - ${item.title}

          <small style="
            color:#ffcc00;
            margin-left:8px;
            font-weight:bold;
          ">
            ${dayLabel}
          </small>
        </span>

        <button
          class="btn secondary"
          onclick="deleteDaily(${item.id})">

          Supprimer

        </button>
      </div>
    `;
  }).join("");
	loadPhotosAdmin();
	loadAlertAdmin();
	loadBirthdaysAdmin();
}

async function saveSettings() {

  const update = {

    amicale:
      document.getElementById("amicaleInput").value,

    ticker:
      document.getElementById("tickerInput").value,

    vigilance_level:
      document.getElementById("vigilanceLevel").value,

    vigilance_risk:
      document.getElementById("vigilanceRisk").value,

    updated_at:
      new Date().toISOString()

  };

  const { error } = await supabaseClient
    .from("settings")
    .update(update)
    .eq("id", 1);

  if (error) {

    alert("Erreur : " + error.message);

    return;
  }

  alert("Paramètres enregistrés");
}

async function saveVehicles() {

  const rows = [...document.querySelectorAll("#vehiclesAdmin .row")];

  for (const row of rows) {

    const update = {
      status: row.querySelector(".v-status").value
    };

    if (currentRole === "admin") {
      update.name = row.querySelector(".v-name").value;
    }

    await supabaseClient
      .from("vehicles")
      .update(update)
      .eq("id", row.dataset.id);
  }

  alert("Véhicules enregistrés");
}
async function addVehicle() {

  if (currentRole !== "admin") {
    alert("Accès réservé administrateur");
    return;
  }

  const name = document.getElementById("newVehicleName").value.trim();
  const status = document.getElementById("newVehicleStatus").value;

  if (!name) {
    alert("Nom du véhicule obligatoire");
    return;
  }

  const { data: existing } = await supabaseClient
    .from("vehicles")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existing && existing.length > 0
      ? (existing[0].sort_order || 0) + 1
      : 1;

  await supabaseClient
    .from("vehicles")
    .insert({
      name,
      status,
      sort_order: nextOrder
    });

  document.getElementById("newVehicleName").value = "";

  loadAdmin();
}

async function deleteVehicle(id) {

  if (currentRole !== "admin") {
    alert("Accès réservé administrateur");
    return;
  }

  if (!confirm("Supprimer ce véhicule ?")) {
    return;
  }

  await supabaseClient
    .from("vehicles")
    .delete()
    .eq("id", id);

  loadAdmin();
}
async function addMonthly() {
  const type = document.getElementById("mType").value || "Info";
  const title = document.getElementById("mTitle").value;
  const eventDate = document.getElementById("mDate").value;
  const eventTime = document.getElementById("mTime").value;
  const location = document.getElementById("mLocation").value;

  if (!eventDate || !title) {
    alert("Date et titre obligatoires");
    return;
  }

  await supabaseClient.from("monthly_events").insert({
    type,
    title,
    event_date: eventDate,
    event_time: eventTime,
    location
  });

  document.getElementById("mType").value = "";
  document.getElementById("mTitle").value = "";
  document.getElementById("mDate").value = "";
  document.getElementById("mTime").value = "";
  document.getElementById("mLocation").value = "";
  loadAdmin();
}

async function deleteMonthly(id) {
  await supabaseClient.from("monthly_events").delete().eq("id", id);
  loadAdmin();
}

async function addDaily() {
  const timeLabel = document.getElementById("dTime").value;
  const title = document.getElementById("dTitle").value;
  const recurrenceType = document.getElementById("dRecurrence").value;
  const selectedDays = [...document.querySelectorAll(".dWeekday:checked")]
  .map(input => input.value);

if (recurrenceType === "weekly" && selectedDays.length === 0) {
  alert("Sélectionne au moins un jour");
  return;
}

  if (!timeLabel || !title) {
    alert("Heure et action obligatoires");
    return;
  }

  await supabaseClient.from("daily_schedule").insert({
    time_label: timeLabel,
    title,
    recurrence_type: recurrenceType,
    weekdays: recurrenceType === "daily" ? "all" : selectedDays.join(","),
    sort_order: 99
  });

  document.getElementById("dTime").value = "";
  document.getElementById("dTitle").value = "";

  loadAdmin();
}

async function deleteDaily(id) {
  await supabaseClient.from("daily_schedule").delete().eq("id", id);
  loadAdmin();
}
async function uploadPhoto() {
  const input = document.getElementById("photoInput");

  if (!input.files || input.files.length === 0) {
    alert("Sélectionne une photo");
    return;
  }

  const { data: existingPhotos } = await supabaseClient
    .from("photos")
    .select("*");

  if ((existingPhotos || []).length >= 5) {
    alert("Maximum 5 photos. Supprime une photo avant d’en ajouter une.");
    return;
  }

  const file = input.files[0];
  const safeName = file.name.replaceAll(" ", "-");
  const filePath = "photo-" + Date.now() + "-" + safeName;

  const { error: uploadError } = await supabaseClient.storage
    .from("photos")
    .upload(filePath, file);

  if (uploadError) {
    alert("Erreur upload : " + uploadError.message);
    return;
  }

  const { data } = supabaseClient.storage
    .from("photos")
    .getPublicUrl(filePath);

  const { error: insertError } = await supabaseClient
    .from("photos")
    .insert({
      url: data.publicUrl,
      file_path: filePath
    });

  if (insertError) {
    alert("Erreur base photos : " + insertError.message);
    return;
  }

  alert("Photo envoyée");
  input.value = "";
  await loadPhotosAdmin();
}

async function loadPhotosAdmin() {
  const { data: photos, error } = await supabaseClient
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Erreur chargement photos : " + error.message);
    return;
  }

  const container = document.getElementById("photosAdmin");
  if (!container) return;

  if (!photos || photos.length === 0) {
    container.innerHTML = `<p class="muted">Aucune photo enregistrée.</p>`;
    return;
  }

  container.innerHTML = photos.map(photo => `
    <div class="row">
      <img src="${photo.url}" style="width:70px;height:45px;object-fit:cover;border-radius:8px;">
      <span style="flex:1;">Photo ${photo.id}</span>
      <button class="btn secondary" data-id="${photo.id}" data-path="${photo.file_path}">
        Supprimer
      </button>
    </div>
  `).join("");

  container.querySelectorAll("button[data-id]").forEach(button => {
    button.addEventListener("click", async () => {
      await deletePhoto(button.dataset.id, button.dataset.path);
    });
  });
}

async function deletePhoto(id, filePath) {
  if (!confirm("Supprimer cette photo ?")) return;

  const { error: storageError } = await supabaseClient.storage
    .from("photos")
    .remove([filePath]);

  if (storageError) {
    alert("Erreur suppression fichier : " + storageError.message);
    return;
  }

  const { error: dbError } = await supabaseClient
    .from("photos")
    .delete()
    .eq("id", id);

  if (dbError) {
    alert("Erreur suppression base : " + dbError.message);
    return;
  }

  await loadPhotosAdmin();
}

async function loadAlertAdmin() {
const { data } = await supabaseClient
  .from("alert_mode")
  .select("*")
  .limit(1);

if (!data || data.length === 0) return;

const alert = data[0];

document.getElementById("alertEnabled").value =
  String(alert.enabled);

document.getElementById("alertTitleInput").value =
  alert.title || "";

document.getElementById("alertMessageInput").value =
  alert.message || "";
}

async function saveAlertMode() {
  await supabaseClient
    .from("alert_mode")
    .update({
      enabled: document.getElementById("alertEnabled").value === "true",
      title: document.getElementById("alertTitleInput").value,
      message: document.getElementById("alertMessageInput").value,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  alert("Alerte enregistrée");
}

async function addBirthday() {
  const firstname = document.getElementById("birthdayFirstname").value.trim();
  const lastname = document.getElementById("birthdayLastname").value.trim();
  const birthDate = document.getElementById("birthdayDate").value;

  if (!firstname || !birthDate) {
    alert("Prénom et date obligatoires");
    return;
  }

  const { error } = await supabaseClient
    .from("birthdays")
    .insert({
      firstname: firstname,
      lastname: lastname,
      birth_date: birthDate,
      enabled: true
    });

  if (error) {
    alert("Erreur ajout anniversaire : " + error.message);
    console.error(error);
    return;
  }

  document.getElementById("birthdayFirstname").value = "";
  document.getElementById("birthdayLastname").value = "";
  document.getElementById("birthdayDate").value = "";

  await loadBirthdaysAdmin();

  alert("Anniversaire ajouté");
}

async function loadBirthdaysAdmin() {
  const { data, error } = await supabaseClient
    .from("birthdays")
    .select("*")
    .order("birth_date");

  const container = document.getElementById("birthdaysAdmin");
  if (!container) return;

  if (error) {
    container.innerHTML = `<p class="error">Erreur chargement anniversaires</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `<p class="muted">Aucun anniversaire enregistré.</p>`;
    return;
  }

  container.innerHTML = data.map(b => `
    <div class="row">
      <span style="flex:1;">
        🎂 <strong>${b.firstname} ${b.lastname || ""}</strong>
        — ${new Date(b.birth_date).toLocaleDateString("fr-FR")}
      </span>

      <button class="btn secondary" onclick="deleteBirthday(${b.id})">
        Supprimer
      </button>
    </div>
  `).join("");
}

async function deleteBirthday(id) {
  if (!confirm("Supprimer cet anniversaire ?")) return;

  const { error } = await supabaseClient
    .from("birthdays")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur suppression : " + error.message);
    return;
  }

  loadBirthdaysAdmin();
}
checkSession();
