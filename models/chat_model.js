const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let chatSchema = new Schema({
  chatID: String,
  sender_userID: String,
  jointPeople: Array, //receiver
  message: Array,
  chatRoomName: Number,

}, { versionKey: false });

let chat_schema = mongoose.model('Chat', chatSchema);

module.exports = chat_schema;