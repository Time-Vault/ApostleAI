/* This simple app uses the '/translate' resource to translate text from
one language to another. */

/* This template relies on the request module, a simplified and user friendly
way to make HTTP requests. */
const request = require('request');
const uuidv4 = require('uuid/v4');
const config = require("./config");
const scripture = require("./scripture");

var subscriptionKey = config.translatorKey;
var endpoint = 'https://api.cognitive.microsofttranslator.com/';
var region = 'global';

function randBot(botId, importSocket, importedIO) {
  // instance handling
  if (!(this instanceof randBot)) {
    return new Bot(botId, importSocket, importedIO);
  }

  // passed arguments to bot
  this.id = botId;
  this.socket = importSocket;
  this.io = importedIO;

  // listen to message events on the socket
  importSocket.on("randWis", 
    // send message in response to new messages being recieved
    this.sendWisdom(data)
  );
}

/* If you encounter any issues with the base_url or path, make sure that you are
using the latest endpoint: https://docs.microsoft.com/azure/cognitive-services/translator/reference/v3-0-translate */
randBot.prototype.translateText = function (input, language){
  console.log("Setting Options");
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

    /*request(options, function(err, res, body){
        console.log(body[0].translations[0].text);
        // create response object to be sent to the server
        let data = {
            sender: "bot",
            //msg: body[0].translations[0].text
            msg: "test"
          };
    });*/

    console.log("About to send request");
    request(options, this.sendData());
};

// Randomly choose something to be translated and sent to the user.
randBot.prototype.sendWisdom = function(data) {
    var botReply;
    var intents = ["askingAdvice","philosophy", "wantMotivation"];
    // Select a random category
    let chosenIntent = intents[Math.floor(Math.random() * intents.length)]
    console.log("I chose: " + chosenIntent);

    var languages = ["de","it", "af","ar","zh-Hans", "el","fr","tlh-Latn", "ko","ga", "ja"];
    // Select a random language
    let chosenLanguage = languages[Math.floor(Math.random() * languages.length)]
    console.log("I chose: " + chosenLanguage);

    try{
          botReply =
          scripture.responses[chosenIntent]["neutral"][
            Math.floor(Math.random() * scripture.responses[chosenIntent]["neutral"].length)
          ];

    console.log("Sending Choices");
        this.translateText(botReply, chosenLanguage);
    }catch(err){
      console.log("Could not select reply.");
    //Message if intent is not available in scripture
    botReply =
      "Even the wise must rest, try again later.";
    this.translateText(botReply, "en")
  }};

  randBot.prototype.sendData = function(body){
    //console.log(body[0].translations[0].text);
        // create response object to be sent to the server
        console.log("About to send.")
        let data = {
            sender: "bot",
            //msg: body[0].translations[0].text
            msg: "test"
          };
    // Emit a message event on the socket to be picked up by server
    try{
    this.socket.emit("randWisReturn", data);}
    catch(err){
      console.log(err);
    }
  }

  module.exports = randBot;