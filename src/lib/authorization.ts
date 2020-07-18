import { GuildMember, User } from "discord.js";
import { PermissionLevel } from "../commands/base";
import config from "../lib/config";
import ServerSettingsRepository from "../repository/severSettings";

export default async function GetPermissionLevel(member: GuildMember): Promise<PermissionLevel> {
	const serverSettings = await ServerSettingsRepository.GetByGuildId(member.guild.id);
	if (serverSettings === null) {
		return PermissionLevel.User;
	}
	
	let permissionLevel = PermissionLevel.User;
	if (member.id === config.botOwnerUserId) {
		permissionLevel = PermissionLevel.BotOwner;
	} else if (member.id === member.guild.ownerID) {
		permissionLevel = PermissionLevel.Administrator;
	} else if (serverSettings.adminRole && member.roles.cache.has(serverSettings.adminRole)) {
		permissionLevel = PermissionLevel.Administrator;
	} else if (serverSettings.moderatorRole && member.roles.cache.has(serverSettings.moderatorRole)) {
		permissionLevel = PermissionLevel.Moderator;
	}
	
	return permissionLevel;
}