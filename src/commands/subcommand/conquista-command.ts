import { Message } from "whatsapp-web.js";
import { SubCommand, CommandData } from "../sub-command";
import { exibirConquistas, getOrCreateUsuario } from "../../core/conquistas";

export class ConquistaCommand extends SubCommand {

  public getCommandName(): string {
    return "conquistas";
  }

  public getCommandLabels(): string[] {
    return ["minhas-conquista"];
  }

  public getDescription(): string {
    return "Veja suas conquistas de consulta no cardápio do RU - Isso não tem nenhuma premiação!";
  }

  public async execute(message: Message): Promise<any> {
    const contato = await message.getContact();
    const nome = contato.pushname || contato.name || "Usuário";
    const id = message.from;

    const usuario = getOrCreateUsuario(id, nome);
    const resposta = exibirConquistas(usuario);

    await message.reply(resposta);
  }
}
