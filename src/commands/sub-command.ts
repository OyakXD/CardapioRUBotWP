import { Message } from "whatsapp-web.js";
import { ParticipantMetadata } from "../manager/group/group-manager";

export interface CommandData {
  userId: string;
  userPhone: string;
  chatId: string;
  chatPrivate: boolean;
  isGroup: boolean;
  participantID?: string;
  groupParticipant?: any;
  groupParticipants?: ParticipantMetadata[];
}

export interface SubCommandInterface {
  hideCommandHelp(): boolean;
  getCommandName(): string;
  getCommandLabels(): string[];
  getArguments(): string[];
  getDescription(): string;
  execute(
    reply: Message,
    args: string[],
    data: CommandData
  ): Promise<any>;
}

export class SubCommand implements SubCommandInterface {
  public hideCommandHelp(): boolean {
    return false;
  }

  public getArguments(): string[] {
    return [];
  }

  public getCommandName(): string {
    throw new Error("Method getCommandName not implemented.");
  }

  public getCommandLabels(): string[] {
    throw new Error("Method getCommandLabels not implemented.");
  }

  public getDescription(): string {
    throw new Error("Method getDescription not implemented.");
  }

  public async execute(
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    throw new Error("Method execute not implemented.");
  }
}
