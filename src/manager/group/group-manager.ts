import { GroupChat, Client as WASocket } from "whatsapp-web.js";

interface ParticipantMetadata {
  id: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface GroupMetadata {
  id: string;
  name: string;
  participants: ParticipantMetadata[];
}

export default class GroupManager {
  public static groupsMetadata: Record<string, GroupMetadata> = {};

  public static async loadGroupsMetadata(socket: WASocket) {
    const chats = await socket.getChats();
    const groups: GroupChat[] = chats.filter(chat => chat.isGroup) as GroupChat[];

    for (const group of groups) {
      if (!group.isGroup) {
        continue;
      }

      const participants = group.participants.map(participant => ({
        id: participant.id._serialized,
        isAdmin: participant.isAdmin,
        isSuperAdmin: participant.isSuperAdmin,
      }));

      this.groupsMetadata[group.id._serialized] = {
        id: group.id._serialized,
        name: group.name,
        participants: participants,
      };
    }
  }

  public static getGroupMetadata(groupId: string): GroupMetadata | null {
    return this.groupsMetadata[groupId] || null;
  }
}
