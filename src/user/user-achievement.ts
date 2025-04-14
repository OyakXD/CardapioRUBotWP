import { WhatsappConnector } from "..";
import { Message } from "whatsapp-web.js";
import { AchievementInfo, ACHIEVEMENTS } from "./types";
import { UserManager } from "../manager/user-manager";
import Utils from "../utils/utils";
import GroupManager from "../manager/group/group-manager";

export class UserAchievement {

  private static checkInCache = new Map<string, Date>();

  private static getPrisma = () => WhatsappConnector.getPrisma();

  public static async update(userPhone: string, message?: Message): Promise<void> {

    userPhone = UserManager.convertJidToPhone(userPhone);

    const today = Utils.getBrazilToday();
    const cacheKey = `${userPhone}-${today}`;

    const MAX_RETRIES = 3;
    let retries = 0;

    if (this.checkInCache.has(cacheKey)) {
      await this.incrementQueryCount(userPhone);
      return;
    }

    while (retries < MAX_RETRIES) {
      try {

        await this.getPrisma().$transaction(async (tx) => {
          const user = await tx.user.upsert({
            where: { phone: userPhone },
            create: { phone: userPhone },
            update: {},
            include: {
              checkIns: {
                where: {
                  date: {
                    gte: new Date(today),
                    lt: new Date(today + 24 * 60 * 60 * 1000)
                  }
                },
                take: 1
              }
            }
          });

          if (user.checkIns.length > 0) {
            this.checkInCache.set(cacheKey, new Date());
            await tx.user.update({
              where: { phone: userPhone },
              data: { queries: { increment: 1 } }
            });
            return;
          }

          const userId = user.id;

          await Promise.all([
            tx.checkIn.create({
              data: {
                date: new Date(today),
                userId
              }
            }),
            tx.user.update({
              where: { id: userId },
              data: { queries: { increment: 1 } }
            })
          ]);

          this.checkInCache.set(cacheKey, new Date());
          await this.updateAchievements(userId, message, tx);
        }, {
          maxWait: 5000,
          timeout: 10000
        });

        break;
      } catch (error) {
        if (error.code === 'P2028' && retries < MAX_RETRIES - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }

        console.error('Erro ao atualizar conquistas:', error);
      }
    }
  }

  private static async updateAchievements(
    userId: number,
    message: Message | undefined,
    tx: any
  ) {
    const [checkIns, achievements] = await Promise.all([
      tx.checkIn.findMany({
        where: { userId },
        select: { date: true }
      }),
      tx.achievement.findMany({
        where: { userId },
        select: { name: true }
      })
    ]);

    const distinctDays = new Set(
      checkIns.map(c => c.date.toISOString().substring(0, 10))
    ).size;

    const unlocked = new Set(achievements.map(a => a.name));
    const toUnlock = ACHIEVEMENTS.filter(a =>
      !a.isReward && a.requiredDays > 0 && distinctDays >= a.requiredDays && !unlocked.has(a.name)
    );

    if (toUnlock.length > 0) {
      await tx.achievement.createMany({
        data: toUnlock.map(a => ({
          name: a.name,
          userId
        })),
        skipDuplicates: true
      });

      if (message) {
        await this.sendAchievementMessages(toUnlock, message);
      }
    }
  }

  private static async sendAchievementMessages(
    achievements: AchievementInfo[],
    message: Message
  ): Promise<void> {
    try {
      const messages = achievements.map(a =>
        `Parabéns! Você desbloqueou a conquista: ${a.displayName}.`
      );
      await message.reply(messages.join('\n'));
    } catch (error) {
      console.error('Erro ao enviar mensagens de conquista:', error);
    }
  }

  private static async incrementQueryCount(phone: string): Promise<void> {
    await this.getPrisma().user.update({
      where: { phone },
      data: { queries: { increment: 1 } }
    });
  }

  public static async generateRankingDay(): Promise<{ message: string, mentions: string[] }> {
    try {
      const usersWithCheckIns = await this.getPrisma().user.findMany({
        include: {
          checkIns: {
            select: { date: true }
          }
        }
      });

      const ranking: { phone: string; days: number }[] = [];

      for (const user of usersWithCheckIns) {
        const distinctDays = new Set(
          user.checkIns.map(c => c.date.toISOString().substring(0, 10))
        ).size;

        if (distinctDays > 0) {
          ranking.push({ phone: user.phone, days: distinctDays });
        }
      }

      if (ranking.length === 0) return { message: `❌ Nenhuma consulta registrada até o momento.`, mentions: [] };

      ranking.sort((a, b) => b.days - a.days);

      let response = `🏆 Ranking de consulta no cardápio:\n\n`;

      const mentions: string[] = [];
      const top = ranking.slice(0, 3);

      top.forEach((entry, index) => {
        const medalha = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
        const userName = GroupManager.getGroupMemberName(entry.phone);

        mentions.push(UserManager.convertPhoneToJid(entry.phone));
        response += `${medalha} @${entry.phone}${userName ? ` - ${userName}` : ''} | ${entry.days} dias\n`;
      });


      if (ranking.length > 3) {
        response += `\nOutros participantes:\n`;
        ranking.slice(3, 10).forEach((entry, index) => {
          const userName = GroupManager.getGroupMemberName(entry.phone);
          response += `${index + 4}. @${entry.phone}${userName ? ` - ${userName}` : ''} | ${entry.days} dias\n`;
          mentions.push(UserManager.convertPhoneToJid(entry.phone));
        });

        if (ranking.length > 10) {
          response += `\n...e mais ${ranking.length - 10} outros participantes.`;
        }
      }

      return { message: response.trim(), mentions };
    } catch (error) {
      console.error('Erro ao gerar ranking:', error);
      return { message: '❌ Ocorreu um erro ao gerar o ranking.', mentions: [] };
    }
  }

  public static async showAchievement(userPhone: string, chatId?: string): Promise<{ message: string, mentions: string[] }> {

    userPhone = UserManager.convertJidToPhone(userPhone);

    try {
      let user = await this.getPrisma().user.findUnique({
        where: { phone: userPhone },
        include: {
          achievements: true,
          checkIns: {
            select: { date: true }
          }
        }
      });

      if (!user) {
        if (!chatId || !GroupManager.isGroupMember(chatId, userPhone)) {
          return {
            message: '❌ Usuário não encontrado.',
            mentions: []
          };
        }

        user = await this.getPrisma().user.upsert({
          where: { phone: userPhone },
          create: { phone: userPhone },
          update: {},
          include: {
            achievements: true,
            checkIns: {
              select: { date: true }
            }
          }
        });
      }

      const distinctDays = new Set(
        user.checkIns.map(c => c.date.toISOString().substring(0, 10))
      ).size;

      const conquered = ACHIEVEMENTS.filter(a =>
        user.achievements.some(ua => ua.name === a.name)
      );

      const userName = GroupManager.getGroupMemberName(user.phone);

      let mentions: string[] = [UserManager.convertPhoneToJid(user.phone)];
      let response = `🎖️ Conquistas de @${user.phone}${userName ? ` - ${userName}` : ''}:\n`;

      if (conquered.length === 0) {
        response += `- 😕 Nenhuma titulo conquistado até o momento.\n`;
      } else {
        for (const conquest of conquered) {
          const description = conquest.isReward ? `Desbloqueado` : `${conquest.requiredDays} dias`;
          response += `- ${conquest.displayName} (${description})\n`;
        }
      }

      const highConqueredDays = conquered.length > 0
        ? Math.max(
          ...conquered
            .filter(c => !c.isReward)
            .map(c => c.requiredDays)
        )
        : 0;

      let next = ACHIEVEMENTS.find(a =>
        !user.achievements.some(ua => ua.name === a.name) &&
        !a.isReward && a.requiredDays > highConqueredDays
      );

      if (next) {
        const progress = `(${distinctDays}/${next.requiredDays} dias)`;
        response += `\n🏆 Próxima conquista: ${next.displayName} ${progress}`;
      } else if (conquered.length > 0) {
        response += `\n🏆 Próxima conquista: Nenhuma! Você chegou ao topo! 💀`;
      }

      return { message: response.trim(), mentions };
    } catch (error) {
      console.error('Erro ao exibir conquistas:', error);
      return { message: '❌ Ocorreu um erro ao exibir as conquistas.', mentions: [] };
    }
  }
}