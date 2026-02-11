// Supabase Edge Function to fetch weather data via OpenWeatherMap API
// This avoids exposing the API key in the frontend bundle

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Get API key from environment
  const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
  const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

  // Check API key
  if (!OPENWEATHER_API_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "OpenWeather API key not configured",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const { lat, lon } = await req.json();

    // Validate required fields
    if (lat === undefined || lon === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: lat, lon",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Validate coordinates
    if (typeof lat !== "number" || typeof lon !== "number") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid coordinates: lat and lon must be numbers",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Fetch weather forecast from OpenWeatherMap API
    const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));

      let errorMessage = errorData.message || "Unknown error";

      // Provide user-friendly error messages
      if (response.status === 401) {
        errorMessage = "Invalid API key. Please check weather configuration.";
      } else if (response.status === 404) {
        errorMessage = "Location not found. Please verify coordinates.";
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          status: response.status,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Weather fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
