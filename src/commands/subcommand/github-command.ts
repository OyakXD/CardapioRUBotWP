import { Message } from "../../services/types";
import { SubCommand } from "../sub-command";

export class GithubCommand extends SubCommand {
  private thumbnailOfGithub: Buffer;

  public getCommandName(): string {
    return "codigo";
  }

  public getCommandLabels(): string[] {
    return ["github", "git", "repo", "repositorio"];
  }

  public getDescription(): string {
    return "Para ver o repositorio do bot";
  }

  public async execute(message: Message): Promise<any> {
    if (!this.thumbnailOfGithub) {
      this.thumbnailOfGithub = Buffer.from(
        await (
          await fetch("https://avatars.githubusercontent.com/u/131064997?v=4")
        ).arrayBuffer()
      );
    }

    await message.reply("https://github.com/OyakXD/CardapioRUBotWP", undefined, {
      linkPreview: true,
    });
  }
}
