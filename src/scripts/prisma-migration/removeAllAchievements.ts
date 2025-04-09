import { PrismaClient } from '@prisma/client';

export async function removeAllAchievements(prisma: PrismaClient): Promise<void> {    
    const achievementsCount = await prisma.achievement.count();
    console.log(`Iniciando remoção de ${achievementsCount} conquistas...`);

    const { count } = await prisma.achievement.deleteMany({});
    
    console.log(`Total de conquistas removidas: ${count}`);
}