import { PrismaClient } from '@prisma/client';
import { DEFAULT_ACHIEVEMENT } from '../../user/types';

export async function assignDefaultAchievement(prisma: PrismaClient): Promise<void> {    
    const usersWithoutAchievements = await prisma.user.findMany({
        where: {
            achievements: {
                none: {}
            }
        }
    });

    for (const user of usersWithoutAchievements) {
        await prisma.achievement.create({
            data: {
                name: DEFAULT_ACHIEVEMENT,
                userId: user.id
            }
        });
        console.log(`Conquista padrão atribuída a ${user.phone}`);
    }

    console.log(`Total de usuários atualizados: ${usersWithoutAchievements.length}`);
}