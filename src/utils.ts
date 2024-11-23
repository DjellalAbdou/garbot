import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const importCommands = async () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const commands = [];
  const folderPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.ts'));
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = (await import(filePath)).default;
    if ('data' in command && 'execute' in command) {
      commands.push(command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  return commands;
};
