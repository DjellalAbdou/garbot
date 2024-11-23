import 'dotenv/config';
import { DiscordClient } from './init';

export const discordClient = new DiscordClient();
discordClient.startBot();
