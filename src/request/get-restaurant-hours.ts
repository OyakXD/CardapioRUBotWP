import axios from "axios";
import { load as loadHTML } from "cheerio";
import { RestaurantHours } from "../types/types";

export const restaurantHoursURL = "https://www.quixada.ufc.br/restaurante-universitario/"

export class RequestRestaurantHours {
    private static formatTime(hour: string, minute?: string) {
        return `${hour.padStart(2, "0")}:${minute ?? "00"}`;
    }

    private static findHours(text: string, meal: "Almoço" | "Jantar") {
        const regex = new RegExp(
            `${meal}\\s*:\\s*(\\d{1,2})(?:\\s*(?:h|:)\\s*(\\d{2}))?\\s*(?:às|a|-)\\s*(\\d{1,2})(?:\\s*(?:h|:)\\s*(\\d{2}))?`,
            "i"
        );

        const match = text.match(regex);

        if (!match) {
            return null;
        }

        const [, startHour, startMinute, endHour, endMinute] = match;

        return `${this.formatTime(startHour, startMinute)} - ${this.formatTime(endHour, endMinute)}`;
    }

    public static async get(): Promise<RestaurantHours | null> {
        try {
            const response = await axios.get(restaurantHoursURL, {
                timeout: 10_000,
            });

            const $ = loadHTML(response.data);
            const pageText = $("body").text().replace(/\s+/g, " ").trim();

            const lunch = this.findHours(pageText, "Almoço");
            const dinner = this.findHours(pageText, "Jantar");


            if (!lunch || !dinner) {
                return null;
            }

            return { lunch, dinner };
        } catch {
            return null;
        }
    }
}