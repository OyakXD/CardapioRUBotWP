import { AnyMessageContent, proto } from "baileys";
import { UserManager } from "../manager/user-manager";
import { WhatsappConnector } from "..";
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
import GroupManager from "../manager/group/group-manager";
import log from "log-beautify";
import { MoodleCommand } from "./subcommand/moodle-command";
import { SigaaCommand } from "./subcommand/sigaa-command";
import { SipacCommand } from "./subcommand/sipac-command";
import { XandaoCommand } from "./subcommand/xandao-command";
import { ZureaCommand } from "./subcommand/zurea-command";

export const prefix = "!";

export class CommandHandler {
  private prefix: string;
  private spamCommand: Map<string, number> = new Map();
  public static commands: SubCommand[] = [];

  constructor(prefix: string) {
    this.prefix = prefix || "!";

    // CommandHandler.register(new HelpCommand());
    // CommandHandler.register(new CardapioCommand());
    // CommandHandler.register(new StartCommand());
    // CommandHandler.register(new StopCommand());
    CommandHandler.register(new MusicCommand());
    // CommandHandler.register(new MoodleCommand());
    // CommandHandler.register(new SigaaCommand());
    // CommandHandler.register(new SipacCommand());
    // CommandHandler.register(new RoastCommand());
    // CommandHandler.register(new GithubCommand());
    // CommandHandler.register(new XandaoCommand());
    // CommandHandler.register(new ZureaCommand());
    // CommandHandler.register(new ToggleCommand());
    // CommandHandler.register(new AmorCommand());
    // CommandHandler.register(new DebugCommand());
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

  public async handle(messageInfo: proto.IWebMessageInfo) {
    const body = this.extractMessageBody(messageInfo);

    if (body.startsWith(this.prefix)) {
      const args = body.slice(this.prefix.length).trim().split(" ");
      const command = args.shift()?.toLowerCase().trim();

      if (command) {
        const subCommand = CommandHandler.getCommands().find(
          (cmd) =>
            cmd.getCommandName() === command ||
            cmd.getCommandLabels().includes(command)
        );

        if (subCommand) {
          const reply = async (
            message: AnyMessageContent,
            quoted?: proto.IWebMessageInfo,
            customJid?: string
          ) => {
            return await this.replyMessage(
              remoteJid,
              message,
              messageInfo,
              quoted,
              customJid
            );
          };
          const spamIdentifier = [
            subCommand.getCommandName(),
            ...subCommand.getCommandLabels(),
          ].join(";");

          const key = messageInfo.key!;
          const remoteJid = key.remoteJid!;

          const chatPrivate = UserManager.isChatPrivate(remoteJid);
          const userJid = chatPrivate ? remoteJid : key.participant!;
          const userPhone = userJid.split("@")[0];

          log.info_(`[SOCKET (INFO)] => ${userPhone} => !${command}`);

          if (this.spam(remoteJid, spamIdentifier)) {
            return await reply({
              text: "Você está executando muito este comando! por favor, aguarde! 😅",
            });
          }

          const participantID = key.participant!;
          const groupParticipants =
            GroupManager.getGroupMetadata(remoteJid)?.participants;
          const groupParticipant = groupParticipants?.filter(
            (participant) => participant.id === participantID
          )[0];

          await subCommand.execute(reply, args, {
            userJid,
            userPhone,
            remoteJid,
            chatPrivate,
            isGroup: !chatPrivate,
            participantID,
            groupParticipant,
          });
        }
      }
    }
  }

  public async replyMessage(
    remoteJid: string,
    message: AnyMessageContent,
    messageInfo: proto.IWebMessageInfo,
    quoted?: proto.IWebMessageInfo,
    customJid?: string
  ): Promise<proto.WebMessageInfo | null> {
    try {
      return await WhatsappConnector.sendMessage(
        customJid ? customJid : remoteJid,
        message,
        {
          quoted: quoted ? quoted : messageInfo,
        }
      );
    } catch (error) {
      log.error_(`Error sending message:`, error);
      return null;
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

  public extractMessageBody({ message }: proto.IWebMessageInfo): string {
    if (message.ephemeralMessage) {
      message = message.ephemeralMessage.message!;
    }

    return message.extendedTextMessage?.text || message.conversation || "";
  }
}
