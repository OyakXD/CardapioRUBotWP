import { WASocket, GroupMetadata as BaileysGroupMetadata } from "@whiskeysockets/baileys";
import { UserManager } from "../user-manager";

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
        const groups: Record<string, BaileysGroupMetadata> = await socket.groupFetchAllParticipating();

        for (const groupId in groups) {
            const group = groups[groupId];

            const participants: ParticipantMetadata[] = group.participants.map(participant => {
                const contactId = participant.id;

                const phone = UserManager.convertJidToPhone(contactId);
                const contactName = this.groupMemberNames[phone] || "";

                const isAdmin = participant.admin === 'admin' || participant.admin === 'superadmin';
                const isSuperAdmin = participant.admin === 'superadmin';

                return {
                    id: contactId,
                    name: contactName,
                    isAdmin,
                    isSuperAdmin,
                };
            });

            this.groupsMetadata[groupId] = {
                id: groupId,
                name: group.subject,
                participants: participants,
            };
        }
    }

    public static getGroupMemberName(userId: string): string | null {
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
