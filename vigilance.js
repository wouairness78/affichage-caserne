exports.handler = async function () {

  try {

    const token =
      process.env.METEOCONCEPT_TOKEN;

    const response = await fetch(
      `https://api.meteo-concept.com/api/forecast/daily?token=${token}&insee=78537`
    );

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

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        vigilance,
        temperature: today.tmax,
        wind: today.wind10m,
        wind_direction: today.dirwind10m ?? today.wind_direction ?? today.winddir ?? null,
        weather: today.weather
      })
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};