import DiscordModule from "./DiscordModule";

export default abstract class GroupDiscordModule<N extends string> extends DiscordModule<N> {
  abstract readonly groupName: string;
}
