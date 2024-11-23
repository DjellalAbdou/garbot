import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { importCommands } from './utils.js';

const token = process.env.DISCORD_TOKEN || '';
const clientId = process.env.APP_ID || '';
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    const commands = await importCommands();
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(Routes.applicationCommands(clientId), { body: commands.map((c) => c.data.toJSON()) });

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.log(error);
  }
})();
