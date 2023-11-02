import { config as dotenvConfig } from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import * as cron from 'node-cron';
import { Configuration as OpenAIConfiguration, OpenAIApi } from 'openai';
import fs from 'fs';

dotenvConfig();

const openAIConfig = new OpenAIConfiguration({
    apiKey: process.env.OPENAI_KEY,
});

async function run() {
    const suggestion = await extractSuggestionFromMentions();
    if (!suggestion) {
        console.log('No suggestions found.');
        return;
    }
    const poem = await generatePoem(suggestion); 
    const post = await postPoemToTwitter(poem);
    console.log(post);
}

function initScheduler() {
    console.log(`Starting scheduler at ${new Date().toISOString()}`);
    cron.schedule('30 8 * * *', () => {
        console.log(`Running poem generation at ${new Date().toISOString()}`);
        run();
    });
}

async function extractSuggestionFromMentions() {
    try {
        const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
        const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const now = new Date().toISOString();
        const mentionsResponse = await client.v2.get(`users/${process.env.TWITTER_ACCOUNT_ID}/mentions`, { max_results: 100, start_time: startTime, end_time: now });
        const mentions = mentionsResponse.data;
        const suggestions = mentions.map((mention) => {
            return mention.text.replace('@aigeneratedpoem', '').replace('[[test]]', '').trim();
        });
        const suggestionCounts = suggestions.reduce((acc, curr) => {
            if (typeof acc[curr] == 'undefined') {
                acc[curr] = 1;
            } else {
                acc[curr] += 1;
            }
            return acc;
        }, {});
        const suggestionsSorted = Object.fromEntries(Object.entries(suggestionCounts).sort())
        return Object.keys(suggestionsSorted)[0]?.toLowerCase();
    } catch (error) {
        console.log('Error - getMentions: ', error);
        return null;
    }
}

function getRandomPoemSubject(subject) {
    const poemTypes = fs.readFileSync(`./poem-${subject}.txt`, 'utf8').split('\n');
    const randomPoemType = poemTypes[Math.floor(Math.random() * poemTypes.length)];
    return randomPoemType;
}

async function generatePoem(topic) {
    try {
        const openai = new OpenAIApi(openAIConfig);
        const poemType = getRandomPoemSubject('types');
        const poemVibe = getRandomPoemSubject('vibes');
        console.log(`Creating a ${poemVibe} ${poemType} poem that invokes a "${topic}" feeling...`);
        const masterPromptResponse = await openai.createChatCompletion({
            model: process.env.OPENAI_COMPLETION_MODEL,
            messages: [{ role: 'user', 'content': `Create a short ${poemVibe} ${poemType} poem that invokes a "${topic}" feeling. On the first line, write the following title in all capitals wrapped in quotes, i.e.: "${topic.toUpperCase()}". The output should not go over 220 characters.` }],
            // max_tokens: +process.env.OPENAI_MAX_TOKENS,
            temperature: +process.env.OPENAI_TEMPERATURE || 1,
        });
        const poem = masterPromptResponse.data.choices[0].message.content + '\n#aigenerated';
        return poem;
    } catch (error) {
        console.log(`Error - generatePoem("${topic}"): `, error);
        throw error;
    }
}

async function postPoemToTwitter(poem) {
    try {
        const client = new TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_SECRET_TOKEN,
        });

        const tweet = await client.v2.tweet('create', { text: poem });
        return tweet;
    } catch (error) {
        console.log(`Error - postPoemToTwitter("${poem}"): `, error);
        throw error;
    }
}

initScheduler();
