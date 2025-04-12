import { MessageEditOptions, MessageSendOptions } from "whatsapp-web.js"

export class MessageMedia {
    /** MIME type of the attachment */
    mimetype: string
    /** Base64-encoded data of the file */
    data: string
    /** Document file name. Value can be null */
    filename?: string | null
    /** Document file size in bytes. Value can be null. */
    filesize?: number | null

    /** Creates a MessageMedia instance from a local file path */
    static fromFilePath: (filePath: string) => MessageMedia

    /** Creates a MessageMedia instance from a URL */
    static fromUrl: (url: string, options?: any) => Promise<MessageMedia>
}

export type MessageContent = string | MessageMedia;

export interface Message {
    reply: (content: MessageContent, chatId?: string, options?: MessageSendOptions) => Promise<Message>,
    edit: (content: MessageContent, options?: MessageEditOptions) => Promise<Message | null>,
    from: string,
    author?: string,
    body: string,
}