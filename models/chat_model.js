const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let chatSchema = new Schema({
  chatID: String,
  creator_userID: String,
  jointPeople: Array, //receiver
  message: Array,
  chatRoomName: Number,
  titleOfChatroom: String,

}, { versionKey: false });

let chat_schema = mongoose.model('Chat', chatSchema);

module.exports = chat_schema;