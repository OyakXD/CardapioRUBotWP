import { GroupChat, Client as WASocket } from "whatsapp-web.js";
import { UserManager } from "../user-manager";
import log from "log-beautify";

export interface ParticipantMetadata {
  id: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface GroupMetadata {
  id: string;
  name: string;
  participants: ParticipantMetadata[];
}

export default class GroupManager {
  public static groupsMetadata: Record<string, GroupMetadata> = {};
  public static groupMemberNames: Record<string, string> = {};

  public static async loadGroupsMetadata(socket: WASocket) {
    const chats = await socket.getChats();
    const groups: GroupChat[] = chats.filter(chat => chat.isGroup) as GroupChat[];

    for (const group of groups) {
      if (!group.isGroup) {
        continue;
      }

      const participants = await Promise.all(
        group.participants.map(async participant => {
          const contactId = participant.id._serialized;
      
          let contactName = '';

          try {
            const contact = await socket.getContactById(contactId);
            contactName = (contact.name || contact.pushname || "").trim();
          } catch (error) {
            log.error_(`Erro ao obter contato ${contactId}:`, error);
          }

          if (contactName) {
            this.groupMemberNames[UserManager.convertJidToPhone(contactId)] = contactName;
          }
          
          return {
            id: contactId,
            name: contactName,
            isAdmin: participant.isAdmin,
            isSuperAdmin: participant.isSuperAdmin,
          };
        })
      );

      this.groupsMetadata[group.id._serialized] = {
        id: group.id._serialized,
        name: group.name,
        participants: participants,
      };
    }
  }

  public static getGroupMemberName(userId: string): string | null{
    const userName = this.groupMemberNames[UserManager.convertJidToPhone(userId)] ?? null;

    if (userName && userName.length === 0) {
      return null;
    }

    return userName;
  }

  public static getGroupMetadata(groupId: string): GroupMetadata | null {
    return this.groupsMetadata[groupId] || null;
  }

  public static isGroupMember(groupId: string, userId: string): boolean {
    const group = this.getGroupMetadata(groupId);
    const userPhone = UserManager.convertJidToPhone(userId);
    
    if (!group) {
      return false;
    }

    return group.participants.some(participant => participant.id.includes(userPhone));
  }
}
