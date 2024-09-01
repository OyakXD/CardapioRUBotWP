import { BaileysEventMap, ConnectionState, DisconnectReason } from "baileys";
import { WhatsappConnector } from "..";
import { Boom } from "@hapi/boom";
import log from "log-beautify";
import GroupManager from "../manager/group/group-manager";

interface SocketHandleEventsOptions {
  connectCallback: () => void;
  saveCreds: () => void;
}

export default class SocketEvent {
  private connector: typeof WhatsappConnector;

  constructor(connector: typeof WhatsappConnector) {
    this.connector = connector;
  }

  public async handleEvents(
    events: Partial<BaileysEventMap>,
    { connectCallback, saveCreds }: SocketHandleEventsOptions
  ): Promise<void> {
    if (events["creds.update"]) {
      saveCreds();
    }

    if (events["connection.update"]) {
      this.handleConnectionUpdate(events["connection.update"], connectCallback);
    }

    if (events["messages.upsert"]) {
      const { messages, type } = events["messages.upsert"];

      if (type === "notify") {
        for (const message of messages) {
          if (!message.message || message.message?.pollUpdateMessage) {
            continue;
          }

          this.connector.commandHandler.handle(message);
        }
      }
    }

    if (events["call"]) {
      for (const call of events["call"]) {
        try {
          if (call.isGroup || call.status !== "offer") {
            continue;
          }

          await this.connector.socket.rejectCall(call.id, call.chatId);
          await this.connector.sendMessage(call.chatId, {
            text: "📞 Chamada rejeitada, não me ligue!",
          });
        } catch (error) {
          log.error_(
            `[SOCKET (ERROR)] => Error ao cancelar chamada de ${call.chatId}:`
          );
        }
      }
    }
  }

  public handleConnectionUpdate(
    update: Partial<ConnectionState>,
    connectCallback: () => void
  ) {
    const { connection, lastDisconnect, receivedPendingNotifications } = update;

    if (
      receivedPendingNotifications &&
      !(
        this.connector.socket.authState.creds &&
        this.connector.socket.authState.creds.myAppStateKeyId
      )
    ) {
      this.connector.socket.ev.flush();
    }

    if (connection === "connecting") {
      log.ok_(`[SOCKET (INFO)] => Conectando-se ao Whatsapp Web...`);
    } else if (connection === "open") {
      log.ok_(`[SOCKET (INFO)] => Carregando informações dos grupos...`);

      GroupManager.loadGroupsMetadata(this.connector.socket).then(() => {
        this.connector.tryingReconnect = false;

        log.ok_(
          `[SOCKET (INFO)] => Sessão aberta em ${
            this.connector.socket.user.id.split(":")[0]
          }`
        );

        if (connectCallback) {
          connectCallback();
        }
      });
    } else if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      log.warn_(
        `[SOCKET (ERROR)] => Conexão fechada devido a ${lastDisconnect.error} ${
          shouldReconnect && "reconectando em 2s..."
        }`.trim()
      );
      if (shouldReconnect) {
        this.connector.socket.ws.close();

        setTimeout(() => this.connector.connectToWhatsapp(), 2_000);
      }
    }
  }
}
