// imports
const logger = require("./logger");
const config = require("./config");
const { Wit } = require("node-wit");
const { json } = require("express");
const scripture = require("./scripture");
const porter = require("./porterStemming.js");
const request = require('request');
const uuidv4 = require('uuid/v4');

// init the wit client using config file
const client = new Wit({
  accessToken: config.witKey,
});

var subscriptionKey = config.translatorKey;
var endpoint = 'https://api.cognitive.microsofttranslator.com/';
var region = 'global';
var translatedMsg = "In all my wisdom, I unfortunately could not reach the Bing Translate Servers. Try again later.";
var inputLang = "en";

// constructor for new bots, parameters to pass socket information
function Bot(botId, importSocket, importedIO) {
  // instance handling
  if (!(this instanceof Bot)) {
    return new Bot(botId, importSocket, importedIO);
  }

  // passed arguments to bot
  this.id = botId;
  this.socket = importSocket;
  this.io = importedIO;

  // listen to message events on the socket
  importSocket.on("message", (data) => {
    // send message in response to new messages being recieved
    //this.sendMessage(data);}
    this.translateText(data.msg, "en", false);
  });
}

Bot.prototype.sendMessage = function (msg) {
  // filter input with porterStemming
  let input = porter.textInput(msg.msg);

  // this is wrapped in a timeout to create a delay
  setTimeout(() => {
    // using the parsed porterStemming input, communicate with WitAI to get JSON response
    client
      .message(input, {})
      // on success
      .then((data) => {
        // Emit a message event on the socket to be picked up by server
        this.translateText(this.pickReply(data, scripture.responses), inputLang, true);
      })
      // catch errors and log it to console on the error stream
      .catch(logger.error(console.error));
  }, 1000);
};

// Bots function to retrieve a reply from the scripture [lexicon]
Bot.prototype.pickReply = function (input, responses) {
  // hang some vars
  var botReply;
  var sentiment;

  // Check to see if there are intents
  if (input.intents[0] == null) {
    console.log(
      logger.getTime() +
        logger.error(
          "Note: Could not find any intent in user input! Selecting generic 'unknown' response now... "
        )
    );
    botReply =
      scripture.unknown[Math.floor(Math.random() * scripture.unknown.length)];
    return botReply;
  } else {
    if (input.traits.wit$sentiment == null) sentiment = "neutral";
    else sentiment = input.traits.wit$sentiment[0].value;

    console.log(logger.getTime() + logger.error("Sentiment: " + sentiment));
  }

  // Account for group members training the bot in ways incompatible
  // with my implentation.
  if (input.intents[0].name == "wikiQuery")
      input.intents[0].name = "askingAdvice";

  //Formualtes response based on intent and sentiment
  for (let intent in responses) {
    if (intent == input.intents[0].name) {
      botReply =
        responses[intent][sentiment][
          Math.floor(Math.random() * responses[intent][sentiment].length)
        ];
      console.log(
        logger.getTime() + logger.info("Intent: ") + input.intents[0].name
      );
      if (
        botReply == null &&
        (sentiment == "positive") | (sentiment == "negative")
      ) {
        console.log(
          logger.getTime() +
            "No " +
            sentiment +
            " sentiment response found, defaulting to neutral response"
        );
        botReply =
          responses[intent]["neutral"][
            Math.floor(Math.random() * responses[intent]["neutral"].length)
          ];
      }

      return botReply;
    }
  }

  //Message if AI interpreted intent is not available in code
  console.log(
    logger.getTime() +
      logger.error(
        "Note: Recognized intent '" +
          input.intents[0].name +
          "' but could not find in scripture.js"
      )
  );

  botReply =
    "I understand what you're saying, but my overlords have not blessed me with the knowledge to respond...";
  return botReply;
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TRANSLATOR /////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* If you encounter any issues with the base_url or path, make sure that you are
using the latest endpoint: https://docs.microsoft.com/azure/cognitive-services/translator/reference/v3-0-translate */
Bot.prototype.translateText = function(input, language, outbound){
  console.log("Message: "+input);
  console.log("To Language "+language);
    let options = {
        method: 'POST',
        baseUrl: endpoint,
        url: 'translate',
        qs: {
          'api-version': '3.0',
          'to': language
        },
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Ocp-Apim-Subscription-Region': region,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
        },
        body: [{
              'text': input
        }],
        json: true,
    };

    request(options, function(err, res, body){
        // create response object to be sent to the server
        translatedMsg = body[0].translations[0].text;
        inputLang = body[0].detectedLanguage.language;
        console.log("Bing Returned Message: "+body[0].translations[0].text);
    });

    setTimeout(() =>{
      console.log("Bing Returned Language: "+inputLang);

      if(outbound){
        console.log("Outgoing Message: "+translatedMsg);
        let data = {
          sender: "bot",
          msg: translatedMsg,
        };

    this.socket.emit("message", data);
    translatedMsg = "In all my wisdom, I unfortunately could not reach the Bing Translate Servers. Try again later.";}
    

    else{
      console.log("Inbound Message: "+translatedMsg);
      let data = {
        sender: "bot",
        msg: translatedMsg,}
      this.sendMessage(data);
      translatedMsg = "In all my wisdom, I unfortunately could not reach the Bing Translate Servers. Try again later.";
    }
  
  },1000);
};

module.exports = Bot;