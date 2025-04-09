import { PrismaClient } from "@prisma/client";
import { assignDefaultAchievement } from "./prisma-migration/assignDefaultAchievement";
import { removeAllAchievements } from "./prisma-migration/removeAllAchievements";
import { migrateNotifications } from "./prisma-migration/migrateNotifications";
import { migrateUsersPhone } from "./prisma-migration/migrateUsersPhone";


const prisma = new PrismaClient();

// assignDefaultAchievement(prisma)
//     .catch(console.error)
//     .finally(() => process.exit());

// removeAllAchievements(prisma)
//     .catch(console.error)
//     .finally(() => process.exit());

// migrateNotifications(prisma)
//     .catch(console.error)
//     .finally(() => process.exit());

// migrateUsersPhone(prisma)
//     .catch(console.error)
//     .finally(() => process.exit());