import { ReplyMessageFunction, SubCommand } from "../sub-command";
import UsernameRegex from "github-username-regex-js";

export class RoastCommand extends SubCommand {
  public getCommandName(): string {
    return "torrar";
  }

  public getCommandLabels(): string[] {
    return ["roast"];
  }

  public getDescription(): string {
    return "Descreva o perfil do github";
  }

  public getArguments(): string[] {
    return ["username"];
  }

  public async execute(
    reply: ReplyMessageFunction,
    args: string[]
  ): Promise<any> {
    const username = args.join(" ");

    if (UsernameRegex.test(username)) {
      const response = await fetch(
        `https://joaosvc-roast-api.vercel.app/search?username=${encodeURI(
          username
        )}`
      );

      if (response.ok) {
        const { roast } = await response.json();

        if (roast) {
          return await reply({
            text: roast,
          });
        }
      } else if (response.status === 500) {
        return await reply({
          text: "Ops! Parece que nossa torrefadora atingiu o limite. 😢",
        });
      }

      await reply({
        text: "Ops! Parece que nossa torrefadora está em pausa para o café. Tente novamente mais tarde! 😢",
      });
    } else {
      await reply({
        text: "Username inválido, por favor, insira um username válido. 😢",
      });
    }
  }
}
