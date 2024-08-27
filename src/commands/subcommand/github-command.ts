import { ReplyMessageFunction, SubCommand } from "../sub-command";

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

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    if (!this.thumbnailOfGithub) {
      this.thumbnailOfGithub = Buffer.from(
        await (
          await fetch("https://avatars.githubusercontent.com/u/131064997?v=4")
        ).arrayBuffer()
      );
    }

    await reply({
      text: "https://github.com/OyakXD/CardapioRUBotWP",
      linkPreview: {
        "matched-text": "https://github.com/OyakXD/CardapioRUBotWP",
        "canonical-url": "https://github.com/OyakXD/CardapioRUBotWP",
        description:
          "Contribute to OyakXD/CardapioRUBotWP development by creating an account on GitHub.",
        title: "GitHub - OyakXD/CardapioRUBotWP",
        jpegThumbnail: this.thumbnailOfGithub,
      },
    });
  }
}
