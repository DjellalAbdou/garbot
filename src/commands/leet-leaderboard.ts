import { CacheType, ChatInputCommandInteraction, Message, SlashCommandBuilder, TextChannel } from 'discord.js';
import { AsciiTable3, AlignmentEnum } from 'ascii-table3';

const leetCodeChannelId = '1306223537572548658';
const batchSize = 100;

const handler = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const leetBoard: Record<string, number> = {};
  const leetChannel = (await interaction.client.channels.fetch(leetCodeChannelId)) as TextChannel | null;
  if (!leetChannel) {
    return interaction.reply('Could not find the leetcode channel');
  }

  try {
    await initLeetBoard(leetBoard, leetChannel);
    const messages = Array.from((await (leetChannel as TextChannel).messages.fetch({ limit: 1 })).values());
    await checkMessages(messages, leetBoard);
    let cursor = messages.length === 1 ? messages[0] : null;
    while (cursor) {
      const tempMessages = Array.from((await leetChannel.messages.fetch({ limit: batchSize, before: cursor.id })).values());
      await checkMessages(tempMessages, leetBoard);
      cursor = tempMessages.length ? tempMessages[tempMessages.length - 1] : null;
    }

    const table = generateLeaderboard(leetBoard, leetChannel);
    await interaction.reply(table);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const initLeetBoard = async (leetBoard: Record<string, number>, leetChannel: TextChannel) => {
  await leetChannel.guild.members.fetch();
  const members = Array.from(leetChannel.members.values());
  members.forEach((member) => {
    if (!member.user.bot) {
      leetBoard[member.user.id] = 0;
    }
  });
};

const addValue = (id: string, leetBoard: Record<string, number>) => {
  if (leetBoard[id]) {
    leetBoard[id] += 1;
  } else {
    leetBoard[id] = 1;
  }
};

const checkMessages = async (messages: Message[], leetBoard: Record<string, number>) => {
  const regex = /^🌟\s*leetcode https:\/\/leetcode\.com\/problems\/[a-z0-9-]+/;
  for (const message of messages) {
    if (regex.test(message.content)) {
      const reactedUsers = Array.from((await message.reactions.resolve('✅')?.users.fetch())?.values() || []);
      reactedUsers.forEach((user) => {
        if (user.id !== message.author.id) addValue(user.id, leetBoard);
      });
      addValue(message.author.id, leetBoard);
    }
  }
};

const emojiPrefix: Record<number, string> = {
  0: '💩',
  1: '👶',
  2: '🤓',
  3: '🥵',
  4: '🧠',
  5: '🧙',
};

const getEmojiForScore = (score: number) => {
  if (score === 0) return emojiPrefix[0];
  const bucket = Math.min(Math.floor((score - 1) / 20) + 1, 5);
  return emojiPrefix[bucket];
};

const generateLeaderboard = (leetBoard: Record<string, number>, leetChannel: TextChannel) => {
  const members = leetChannel.members;
  const sorted = Object.entries(leetBoard).sort((a, b) => b[1] - a[1]);
  const table = new AsciiTable3('Leaderboard')
    .setStyle('unicode-double')
    .setHeading('Rank', 'Member', 'Solved')
    .setAlign(3, AlignmentEnum.CENTER)
    .addRowMatrix(sorted.map(([userId, solved], index) => [(index + 1).toString(), `${members.get(userId)?.user.username}`, solved.toString()]));

  const places = ['🥇 First Place', '🥈 Second Place', '🥉 Third Place'];
  const congrasMsgs: string[] = [];
  sorted.slice(0, 3).forEach(([userId, solved], index) => {
    if (solved > 0) congrasMsgs.push(`${places[index]}: <@${userId}> with ${solved} problems solved ${getEmojiForScore(solved)}!`);
  });

  return '```\n' + table.toString() + '\n```\n' + congrasMsgs.join('\n');
};

export default {
  data: new SlashCommandBuilder()
    .setName('leetboard')
    .setDescription('Leaderboard of the leet code challenges')
    .setIntegrationTypes([0, 1])
    .setContexts([0, 2]),
  execute: handler,
};
