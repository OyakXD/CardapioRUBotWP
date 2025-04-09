export type AchievementName =
    | "calouro"
    | "estagiario"
    | "estagiario_avancado"
    | "junior"
    | "junior_avancado"
    | "pleno"
    | "pleno_avancado"
    | "senior"
    | "senior_avancado"
    | "master"
    | "lendario";

export const DEFAULT_ACHIEVEMENT: AchievementName = "calouro";

export interface AchievementInfo {
    name: AchievementName;
    displayName: string;
    requiredDays: number;
}

export const ACHIEVEMENTS: AchievementInfo[] = [
    { name: "calouro", displayName: "Calouro do RU 🎓", requiredDays: 10 },
    { name: "estagiario", displayName: "Estagiário do RU 🥉", requiredDays: 15 },
    { name: "estagiario_avancado", displayName: "Estagiário Avançado do RU🥈", requiredDays: 20 },
    { name: "junior", displayName: "Junior do RU 🥉", requiredDays: 25 },
    { name: "junior_avancado", displayName: "Junior Avançado do RU 🥈", requiredDays: 30 },
    { name: "pleno", displayName: "Pleno do RU 🥈", requiredDays: 35 },
    { name: "pleno_avancado", displayName: "Pleno Avançado do RU 🏅", requiredDays: 40 },
    { name: "senior", displayName: "Senior do RU 🏅", requiredDays: 45 },
    { name: "senior_avancado", displayName: "Senior Avançado do RU 🏆", requiredDays: 50 },
    { name: "master", displayName: "Master 💀", requiredDays: 60 },
    { name: "lendario", displayName: "Legendary 🔥", requiredDays: 90 }
];