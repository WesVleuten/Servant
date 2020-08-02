export default interface Mute {
  guildId: string;
  userId: string;
  byUserId: string;
  date: Date;
  until: Date;
  reason: string;
}