import { PrismaClient } from '@prisma/client';

export async function migrateNotifications(prisma: PrismaClient): Promise<void> {
    // const usersWithNotification = await prisma.user.findMany({
    //     where: {
    //         notification: true
    //     },
    //     select: {
    //         jid: true
    //     }
    // });

    // for (const user of usersWithNotification) {
    //     await prisma.notification.upsert({
    //         where: {
    //             chatJid: user.jid
    //         },
    //         update: {
    //             enabled: true
    //         },
    //         create: {
    //             chatJid: user.jid,
    //             enabled: true
    //         }
    //     });

    //     console.log(`Notificação migrada para ${user.jid}`);
    // }
}