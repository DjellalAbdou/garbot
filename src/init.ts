import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import { importCommands } from './utils.js';

export const CLIENT_ID = process.env.APP_ID;
const token = process.env.DISCORD_TOKEN;

export class DiscordClient {
  private client: Client;
  private commands: Collection<string, any>;
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });
    this.commands = new Collection();
  }

  async appendCommands() {
    const commands = await importCommands();
    for (const command of commands) {
      this.commands.set(command.data.name, command);
    }
  }

  async startBot() {
    await this.appendCommands();

    this.client.once(Events.ClientReady, (readyClient) => {
      console.log(`Logged in as ${readyClient.user.tag}`);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      const command = this.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No Command matching ${interaction.commandName} was found`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
          await interaction.reply({ content: 'there was an error while executing this command !', ephemeral: true });
        }
      }
    });

    await this.client.login(token);
  }
}
