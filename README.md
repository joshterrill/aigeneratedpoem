# AI Generated Poem

This is a code repository for the [@aigeneratedpoem](https://twitter.com/aigeneratedpoem) Twitter account.

### How it works

The account watches for mentions with text about specific subjects, such as "moving to a new city", "sad", "heart warming", or "mothers day", etc. At 
the end of the day, it will find the most recommended subjects, and write an AI-generated poem (limerick, rhyming, ode, etc.) to be posted to Twitter the following day.

### Install

```bash
git clone https://github.com/joshterrill/aigeneratedpoem
cd aigeneratedpoem/
npm i
npm start
```

### Todo

* Filter out certain keywords/phrases that might lead to flagged tweets
* Add a popularity score for topic suggestions based on likes, retweets, etc.
* Add MidJourney to create a photo that gets attached to each poem

### License

MIT
