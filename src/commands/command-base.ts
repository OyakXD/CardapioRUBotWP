import GroupManager from "../manager/group/group-manager";
import log from "log-beautify";
import { UserManager } from "../manager/user-manager";
import { SubCommand } from "./sub-command";
import { AmorCommand } from "./subcommand/amor-command";
import { CardapioCommand } from "./subcommand/cardapio-command";
import { HelpCommand } from "./subcommand/help-command";
import { DebugCommand } from "./subcommand/debug-command";
import { ToggleCommand } from "./subcommand/toggle-command";
import { StartCommand } from "./subcommand/start-command";
import { StopCommand } from "./subcommand/stop-command";
import { GithubCommand } from "./subcommand/github-command";
import { MusicCommand } from "./subcommand/music-command";
import { RoastCommand } from "./subcommand/roast-command";
import { MoodleCommand } from "./subcommand/moodle-command";
import { SigaaCommand } from "./subcommand/sigaa-command";
import { SipacCommand } from "./subcommand/sipac-command";
import { XandaoCommand } from "./subcommand/xandao-command";
import { ZureaCommand } from "./subcommand/zurea-command";
import { OnibusCommand } from "./subcommand/onibus-command";
import { Message } from "whatsapp-web.js";
import { RankingCommand } from "./subcommand/ranking-command";
import { AchievementTableCommand } from "./subcommand/achievement-table-command";
import { AchievementsCommand } from "./subcommand/achievements-command";

export const prefix = "!";

export class CommandHandler {
  private prefixList: string[];
  private spamCommand: Map<string, number> = new Map();
  public static commands: SubCommand[] = [];

  constructor(prefix: string[] = this.prefixList) {
    this.prefixList = prefix || ["!", "/"];

    CommandHandler.register(new HelpCommand());
    CommandHandler.register(new CardapioCommand());
    CommandHandler.register(new StartCommand());
    CommandHandler.register(new StopCommand());
    CommandHandler.register(new MusicCommand());
    CommandHandler.register(new MoodleCommand());
    CommandHandler.register(new SigaaCommand());
    CommandHandler.register(new SipacCommand());
    CommandHandler.register(new RoastCommand());
    CommandHandler.register(new GithubCommand());
    CommandHandler.register(new XandaoCommand());
    CommandHandler.register(new ZureaCommand());
    CommandHandler.register(new ToggleCommand());
    CommandHandler.register(new AmorCommand());
    CommandHandler.register(new DebugCommand());
    CommandHandler.register(new OnibusCommand());
    CommandHandler.register(new AchievementsCommand());
    CommandHandler.register(new AchievementTableCommand());
    CommandHandler.register(new RankingCommand());
  }

  public static register(command: SubCommand) {
    const commandName = command.getCommandName();
    const hasCommand = CommandHandler.commands.some(
      (cmd) => cmd.getCommandName() === commandName
    );

    if (hasCommand) {
      throw new Error(`Command ${commandName} already registered!`);
    }

    CommandHandler.commands.push(command);
  }

  public static getCommands(): SubCommand[] {
    return CommandHandler.commands;
  }

  public async handle(message: Message) {
    const body = message.body;
    const chatId = message.from;

    const chatPrivate = UserManager.isChatPrivate(chatId);
    const userId = chatPrivate ? chatId : message.author;
    const userPhone = userId?.split("@")[0] ?? null;

    if (!userPhone) {
      console.log(`User phone not found for chatId: ` + JSON.stringify(message, null, 2));
    }

    const participantID = message.author;
    const groupParticipants =
      GroupManager.getGroupMetadata(chatId)?.participants;
    const groupParticipant = groupParticipants?.filter(
      (participant) => participant.id === participantID
    )[0] ?? null;
    const isParticipantAdmin = !!groupParticipant?.isAdmin;

    const options = {
      userId,
      userPhone,
      chatId,
      chatPrivate,
      isGroup: !chatPrivate,
      participantID,
      groupParticipant,
      groupParticipants
    };

    if (this.prefixList.some(prefix => body.startsWith(prefix))) {
      const prefixUsed = this.prefixList.find(prefix => body.startsWith(prefix));
      const args = body.slice(prefixUsed.length).trim().split(" ");
      const command = args.shift()?.toLowerCase().trim();

      if (command) {
        const subCommand = CommandHandler.getCommands().find(
          (cmd) =>
            cmd.getCommandName() === command ||
            cmd.getCommandLabels().includes(command)
        );

        if (subCommand) {

          const spamIdentifier = [
            userId,
            subCommand.getCommandName(),
            ...subCommand.getCommandLabels(),
          ].join(";");

          log.info_(`[SOCKET (INFO)] => ${userPhone} => !${command}`);

          if (this.spam(chatId, spamIdentifier)) {
            return await message.reply("Você está executando muito este comando! por favor, aguarde! 😅");
          }

          await subCommand.execute(message, args, options);
        }
      }
    } else {
      if (options.isGroup && isParticipantAdmin && groupParticipants) {
        if (body.includes("@everyone") || body.includes("@here") ||
          body.includes("@all") || body.includes("@todos")) {
          message.reply(`Mensagem importante 👆`, undefined, {
            mentions: groupParticipants.map((participant) => participant.id),
          });
        }
      }
    }
  }

  public spam(
    userJid: string,
    command: string,
    delay: number = 5_000
  ): boolean {
    const currentTime = new Date().getTime();
    const spamKey = `${userJid}:${command}`;

    if (this.spamCommand.has(spamKey)) {
      const lastTime = this.spamCommand.get(spamKey)!;

      if (currentTime - lastTime < delay) {
        return true;
      }
    }

    this.spamCommand.set(spamKey, currentTime);

    setTimeout(() => this.spamCommand.delete(spamKey), delay);
    return false;
  }
}
