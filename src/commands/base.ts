
import { proto } from "baileys";

export const prefix = '!';

export class commandHandler {
    private prefix: string;

    constructor(prefix: string){
        this.prefix = prefix;
    }

     public handle = (message: proto.IWebMessageInfo) => {
        const body = message.message?.conversation || '';


        if(body.startsWith(this.prefix)){
            const args = body.slice(this.prefix.length).trim().split(' ');
            const command = args.shift()?.toLowerCase();


            switch(command){
                case 'cardapio':
                    return 'Vai almoçar no RU, é?';
                default:
                    return 'Comando não encontrado';
            }
        }

        return null;
    }
}