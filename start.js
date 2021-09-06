const { bot, login } = require("./utility/bot/login.js");
const upload = require("./utility/bot/upload.js");
const listen = require("./utility/bot/listen.js");

login();
upload();
listen();