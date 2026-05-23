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
    13: "Pluie faible verglaçante",
    14: "Pluie modérée verglaçante",
    15: "Pluie forte verglaçante",
    16: "Bruine",
    20: "Neige faible",
    21: "Neige modérée",
    22: "Neige forte",
    30: "Pluie et neige",
    31: "Pluie et neige",
    32: "Pluie et neige",
    40: "Averses",
    41: "Averses",
    42: "Averses fortes",
    43: "Averses faibles",
    44: "Averses modérées",
    45: "Averses fortes",
    46: "Averses faibles",
    47: "Averses modérées",
    48: "Averses fortes",
    60: "Orage faible",
    61: "Orage modéré",
    62: "Orage fort",
    63: "Orage faible",
    64: "Orage modéré",
    65: "Orage fort",
    66: "Orage faible",
    67: "Orage modéré",
    68: "Orage fort",
    70: "Neige faible",
    71: "Neige modérée",
    72: "Neige forte",
    73: "Neige faible",
    74: "Neige modérée",
    75: "Neige forte",
    100: "Orages"
  };

  return labels[Number(code)] || "Prévision";
}

function getVigilanceFromForecast(item) {
  const wind = Number(item?.wind10m ?? 0);
  const gust = Number(item?.gust10m ?? item?.gustx ?? 0);
  const rain = Number(item?.probarain ?? 0);
  const storm = Number(item?.probafrost ?? 0);

  let vigilance = "Vert";
  let risk = "";

  const maxWind = Math.max(wind, gust);

  if (rain >= 50 || maxWind >= 50) {
    vigilance = "Jaune";
  }

  if (rain >= 70 || maxWind >= 70) {
    vigilance = "Orange";
  }

  if (rain >= 90 || maxWind >= 90) {
    vigilance = "Rouge";
  }

  if (maxWind >= 50) {
    risk = "Vent";
  } else if (rain >= 50) {
    risk = "Pluie";
  } else if (storm >= 50) {
    risk = "Orage";
  }

  return { vigilance, risk };
}

exports.handler = async function () {
  try {
    const token = process.env.METEOCONCEPT_TOKEN;

    if (!token) {
      throw new Error("METEOCONCEPT_TOKEN manquant dans Netlify");
    }

    const insee = "78537"; // Saint-Arnoult-en-Yvelines

    // Données les plus proches du direct : prévisions heure par heure des prochaines heures.
    // L'ancien appel /forecast/daily renvoyait tmax/tmin de la journée, donc pas la météo actuelle.
    const hourlyResponse = await fetch(
      `https://api.meteo-concept.com/api/forecast/nextHours?token=${token}&insee=${insee}&hourly=true`,
      { cache: "no-store" }
    );

    if (!hourlyResponse.ok) {
      throw new Error("Erreur API Météo Concept - nextHours");
    }

    const hourlyData = await hourlyResponse.json();
    const current = hourlyData.forecast?.[0];

    if (!current) {
      throw new Error("Aucune donnée horaire pour Saint-Arnoult-en-Yvelines");
    }

    const { vigilance, risk } = getVigilanceFromForecast(current);

    const temperature =
      current.temp2m ??
      current.temperature ??
      current.t2m ??
      null;

    const windDirection =
      current.dirwind10m ??
      current.dirwindgust10m ??
      current.dirwind ??
      null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate"
      },
      body: JSON.stringify({
        city: hourlyData.city?.name || "Saint-Arnoult-en-Yvelines",
        insee: hourlyData.city?.insee || insee,
        datetime: current.datetime || null,
        vigilance,
        risk,
        temperature,
        wind: current.wind10m ?? null,
        wind_gust: current.gust10m ?? current.gustx ?? null,
        wind_direction: windDirection,
        wind_direction_label: getWindDirectionLabel(windDirection),
        weather: current.weather,
        weather_label: getWeatherLabel(current.weather)
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
