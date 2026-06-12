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
import { RoastCommand } from "./subcommand/roast-command";
import { MoodleCommand } from "./subcommand/moodle-command";
import { SigaaCommand } from "./subcommand/sigaa-command";
import { SipacCommand } from "./subcommand/sipac-command";
import { OnibusCommand } from "./subcommand/onibus-command";
import { RankingCommand } from "./subcommand/ranking-command";
import { AchievementTableCommand } from "./subcommand/achievement-table-command";
import { AchievementsCommand } from "./subcommand/achievements-command";
import { WAMessage, WASocket, proto } from "@whiskeysockets/baileys";

export const prefix = "!";

export class CommandHandler {
    private prefixList: string[];
    private spamCommand: Map<string, number> = new Map();
    public static commands: SubCommand[] = [];

    constructor(prefix?: string[]) {
        this.prefixList = prefix || ["!", "/"];

        CommandHandler.register(new HelpCommand());
        CommandHandler.register(new CardapioCommand());
        CommandHandler.register(new StartCommand());
        CommandHandler.register(new StopCommand());
        CommandHandler.register(new MoodleCommand());
        CommandHandler.register(new SigaaCommand());
        CommandHandler.register(new SipacCommand());
        CommandHandler.register(new RoastCommand());
        CommandHandler.register(new GithubCommand());
        CommandHandler.register(new AmorCommand());
        CommandHandler.register(new ToggleCommand());
        CommandHandler.register(new DebugCommand());
        CommandHandler.register(new OnibusCommand());
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

    public async handle(message: WAMessage, socket: WASocket) {
        const msgText = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            "";

        const chatId = message.key.remoteJid;
        if (!chatId) return;

        const chatPrivate = UserManager.isChatPrivate(chatId);

        const userId = chatPrivate ? chatId : (message.key.participant || null);
        const userPhone = userId?.split("@")[0] ?? null;

        const participantID = message.key.participant || null;
        const groupParticipants = GroupManager.getGroupMetadata(chatId)?.participants || [];
        const groupParticipant = groupParticipants.find(
            (participant) => participant.id === participantID
        ) ?? null;
        const isParticipantAdmin = !!groupParticipant?.isAdmin;

        const options = {
            userId,
            userPhone,
            chatId,
            chatPrivate,
            isGroup: !chatPrivate,
            participantID,
            groupParticipant,
            groupParticipants,
            socket
        };

        if (this.prefixList.some(prefix => msgText.startsWith(prefix))) {
            const prefixUsed = this.prefixList.find(prefix => msgText.startsWith(prefix))!;
            const args = msgText.slice(prefixUsed.length).trim().split(/\s+/);
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
                        await socket.sendMessage(chatId, {
                            text: "Você está executando muito este comando! por favor, aguarde! 😅"
                        }, { quoted: message });
                        return;
                    }

                    await subCommand.execute(message, args, options);
                }
            }
        } else {
            if (options.isGroup && isParticipantAdmin && groupParticipants.length > 0) {
                const bodyLower = msgText.toLowerCase();

                if (bodyLower.includes("@everyone") || bodyLower.includes("@here") ||
                    bodyLower.includes("@all") || bodyLower.includes("@todos")) {

                    await socket.sendMessage(chatId, {
                        text: `Mensagem importante 👆`,
                        mentions: groupParticipants.map((p) => p.id)
                    }, { quoted: message });
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