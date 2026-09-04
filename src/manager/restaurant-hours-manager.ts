import * as fs from "fs";
import { scheduleJob } from "node-schedule";
import { RestaurantHours } from "../types/types";
import { RequestRestaurantHours } from "../request/get-restaurant-hours";

export class RestaurantHoursManager {
    private static cachedHours: RestaurantHours | null = null;

    private static readonly fallbackHours: RestaurantHours = {
        lunch: "11:00 - 14:00",
        dinner: "17:00 - 18:45", 
    };

    public static async initialize() {
        if (!fs.existsSync("./models")) {
            fs.mkdirSync("./models");
        }

        await this.updateHours();

        scheduleJob({ hour: 4, minute: 5, tz: "America/Fortaleza" }, () => 
            this.updateHours()
        );
    }

    public static async updateHours() {
        const scrapedHours = await RequestRestaurantHours.get();

        if (scrapedHours) {
            fs.writeFileSync(
                "./models/restaurant-hours.json",
                JSON.stringify(scrapedHours, null, 2)
            );

            this.cachedHours = scrapedHours;
            return;
        }

        this.cachedHours ??= this.readSavedHours() ?? this.fallbackHours;
    }

    public static getHours(): RestaurantHours {
        this.cachedHours ??= this.readSavedHours() ?? this.fallbackHours;

        return this.cachedHours;
    }

    private static readSavedHours(): RestaurantHours | null {
        try {
            return JSON.parse(
                fs.readFileSync("./models/restaurant-hours.json", "utf-8")
            );
        } catch {
            return null;
        }
    }
}