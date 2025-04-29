import { createTool } from "@voltagent/core";
import { z } from "zod";
import axios from "axios";

export const weatherTool = createTool({
  name: "get_weather",
  description: "Get the current weather for a location",
  parameters: z.object({
    location: z.string().describe("The city name"),
    unit: z
      .enum(["celsius", "fahrenheit"])
      .optional()
      .describe("Temperature unit"),
  }),
  execute: async (args) => {
    // args is typed as { location: string; unit?: "celsius" | "fahrenheit" }
    const { location, unit = "celsius" } = args;
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      const data = response.data;
      return JSON.stringify({
        location: data.name,
        country: data.sys.country,
        weather: data.weather[0].description,
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      });
    } catch (error) {
      return `Error fetching weather: ${(error as Error).message}`; // Cast error to Error
    }
  },
});
