function getWindDirectionLabel(degrees) {
  if (degrees === null || degrees === undefined || Number.isNaN(Number(degrees))) {
    return "--";
  }

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

exports.handler = async function () {
  try {
    const token = process.env.METEOCONCEPT_TOKEN;

    if (!token) {
      throw new Error("METEOCONCEPT_TOKEN manquant dans Netlify");
    }

    // Code INSEE 78537 = Saint-Arnoult-en-Yvelines
    const response = await fetch(
      `https://api.meteo-concept.com/api/forecast/daily?token=${token}&insee=78537`
    );

    if (!response.ok) {
      throw new Error("Erreur API Météo Concept");
    }

    const data = await response.json();
    const today = data.forecast?.[0];

    if (!today) {
      throw new Error("Aucune donnée météo pour Saint-Arnoult-en-Yvelines");
    }

    let vigilance = "Vert";
    let risk = "";

    if (today.probarain > 50 || today.wind10m >= 50) {
      vigilance = "Jaune";
    }

    if (today.probarain > 70 || today.wind10m >= 70) {
      vigilance = "Orange";
    }

    if (today.probarain > 90 || today.wind10m >= 90) {
      vigilance = "Rouge";
    }

    if (today.wind10m >= 50) {
      risk = "Vent";
    } else if (today.probarain > 50) {
      risk = "Pluie";
    }

    const windDirection =
      today.dirwind10m ??
      today.dirwindgust10m ??
      today.dirwind ??
      null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        city: data.city?.name || "Saint-Arnoult-en-Yvelines",
        insee: data.city?.insee || "78537",
        vigilance,
        risk,
        temperature: today.tmax,
        wind: today.wind10m,
        wind_direction: windDirection,
        wind_direction_label: getWindDirectionLabel(windDirection),
        weather: today.weather,
        weather_label: getWeatherLabel(today.weather)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
