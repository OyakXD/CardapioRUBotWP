import { PrismaClient } from '@prisma/client';

function extractPhoneFromJid(jid: string): string | null {
  if (jid.endsWith('@s.whatsapp.net')) {
    return jid.split('@')[0];
  }
  
  return null;
}

export async function migrateUsersPhone(prisma: PrismaClient): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      phone: {
        contains: '@'
      }
    }
  });

  console.log(`Encontrados ${users.length} usuários com Jid`);

  let successCount = 0;
  let deletedCount = 0;

  for (const user of users) {
    const phoneNumber = extractPhoneFromJid(user.phone);
    
    if (phoneNumber) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: phoneNumber }
      });
      successCount++;
      console.log(`Atualizado: ${user.phone} → ${phoneNumber}`);
    } else {
      await prisma.user.delete({
        where: { id: user.id }
      });
      deletedCount++;
      console.log(`Deletado: ${user.phone}`);
    }
  }

  console.log(`Atualizados: ${successCount}`);
  console.log(`Deletados: ${deletedCount}`);
}