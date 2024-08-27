import { AnyMessageContent, GroupParticipant, proto } from "baileys";

export interface ReplyMessageFunction {
  (
    message: AnyMessageContent,
    quoted?: proto.IWebMessageInfo,
    customJid?: string
  ): Promise<proto.WebMessageInfo>;
}

export interface CommandData {
  userJid: string;
  userPhone: string;
  remoteJid: string;
  chatPrivate: boolean;
  isGroup: boolean;
  participantID?: string;
  groupParticipant?: GroupParticipant;
}

export interface SubCommandInterface {
  hideCommandHelp(): boolean;
  getCommandName(): string;
  getCommandLabels(): string[];
  getArguments(): string[];
  getDescription(): string;
  execute(
    reply: ReplyMessageFunction,
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
    reply: ReplyMessageFunction,
    args: string[],
    data: CommandData
  ): Promise<any> {
    throw new Error("Method execute not implemented.");
  }
}
