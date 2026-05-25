function getWindDirectionLabel(degrees) {
  const value = Number(degrees);

  if (!Number.isFinite(value)) {
    return "--";
  }

  const directions = [
    "Nord",
    "Nord-Est",
    "Est",
    "Sud-Est",
    "Sud",
    "Sud-Ouest",
    "Ouest",
    "Nord-Ouest"
  ];

  return directions[Math.round(value / 45) % 8];
}

exports.handler = async function () {
  try {
    const token = process.env.METEOCONCEPT_TOKEN;

    if (!token) {
      throw new Error("METEOCONCEPT_TOKEN manquant");
    }

    const response = await fetch(
      `https://api.meteo-concept.com/api/forecast/daily?token=${token}&insee=78537`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Erreur API Météo Concept : ${response.status}`);
    }

    const data = await response.json();
    const today = data.forecast?.[0];

    if (!today) {
      throw new Error("Aucune donnée météo");
    }

    let vigilance = "Vert";

    if (today.probarain > 70) {
      vigilance = "Orange";
    }

    if (today.probarain > 90) {
      vigilance = "Rouge";
    }

    const windDirection =
      today.dirwind10m ??
      today.wind_direction ??
      today.winddir ??
      null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      },
      body: JSON.stringify({
        vigilance,
        temperature: today.tmax,
        wind: today.wind10m,
        wind_direction: windDirection,
        wind_direction_label: getWindDirectionLabel(windDirection),
        weather: today.weather
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      },
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
