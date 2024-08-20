import { WASocket, GroupMetadata } from "baileys";

export default class GroupManager {
  public static groupsMetadata: { [key: string]: GroupMetadata } = {};

  public static async loadGroupsMetadata(socket: WASocket) {
    this.groupsMetadata = await socket.groupFetchAllParticipating();
  }

  public static getGroupMetadata(groupId: string): GroupMetadata | null {
    return this.groupsMetadata[groupId] ?? null;
  }
}
