const PHASH_ACK = "received phash in ack, resending message";

export default class Ack {
  public static received(content: string) {
    return content.includes(PHASH_ACK);
  }
}
