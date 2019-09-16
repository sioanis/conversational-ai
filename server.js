"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const app = express();
const watson = require("watson-developer-cloud");

const ID = "<@BOT_ID_GOES_HERE>";
const THRESHOLD = 0.55;

const CONFIG = {
  url: "https://gateway.watsonplatform.net/tone-analyzer/api",
  username: "USER_NAME_GOES_HERE",
  password: "PASSWORD_GOES_HERE",
  version: "v3",
  version_date: "2016-05-19"
};

const EMOTIONS = {
  anger: "😠",
  disgust: "🤢",
  fear: "😱",
  joy: "😄",
  sadness: "😞"
};

const GREETING =
  "Hi! My name is Watson. Tag me if you'd like to analyze your text.";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(4000);

let tone_analyzer = watson.tone_analyzer(CONFIG);

let latestTimestamp = +new Date() / 1000;

app.post("/event", (req, res) => {
  switch (req.body.type) {
    case "url_verification":
      res.send(req.body.challenge);
      break;
    case "event_callback":
      const { text, channel, ts, bot_id } = req.body.event;
      if (ts > latestTimestamp && !bot_id) {
        const textToAnalyze = text.replace(ID, "");
        if (!textToAnalyze) {
          postMessage(channel, GREETING);
        } else if (text) {
          analyzeTone(channel, textToAnalyze);
        }
        latestTimestamp = ts;
      }
      break;
  }
});

function analyzeTone(channel, text) {
  tone_analyzer.tone({ text }, (err, tone) => {
    let emotes = "";
    let emotionString = "Tone Analysis:\n";
    tone.document_tone.tone_categories.forEach(generateString);
    postMessage(
      channel,
      "Emoting ... " + (emotes || "😐") + "\n\n" + emotionString
    );
  });
}

function generateString(tonecategory) {
  if (tonecategory.category_id === "emotion_tone") {
    tonecategory.tones.forEach(emotion => {
      if (
        emotion.score >= THRESHOLD &&
        emotes.indexOf(EMOTIONS[emotion.tone_id])
      ) {
        emotes += EMOTIONS[emotion.tone_id];
      }
      emotionString += emotion.tone_name + ": " + emotion.score * 100 + "%\n";
    });
  } else {
    tonecategory.tones.forEach(emotion => {
      emotionString += emotion.tone_name + ": " + emotion.score * 100 + "%\n";
    });
  }
}

function postMessage(channel, message) {
  let options = {
    method: "POST",
    url: "https://slack.com/api/chat.postMessage",
    form: {
      token: "SLACK_OAUTH_TOKEN_GOES_HERE", // Your Slack OAuth token
      channel,
      text: message
    }
  };
  request(options, response => {
    console.log(response.body);
  });
}
