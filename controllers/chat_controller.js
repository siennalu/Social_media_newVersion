const chatSchemaModel = require('../models/chat_model.js');
const uniqid = require('uniqid');

const formidable = require('formidable');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: 'dzzdz1kvr',
  api_key: '154653594993876',
  api_secret: 'pzNTrLGj6HJkE6QGAUeJ2cyBxAE'
})


module.exports = class Chat {
  createChatRoom(req, res, next) {
    let messageForObject = {};
    let messageForArray = [];
    let seconds = Math.round(Date.now() / 1000);
    let id = uniqid();

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      let chat = new chatSchemaModel({
        sender_userID: fields.senderID,
        jointPeople: [], //receiver
        message: [],
      });

      messageForObject.time = seconds;
      messageForObject.message = fields.message;
      messageForObject.messageID = id;
      messageForObject.senderID = fields.senderID
      messageForArray.push(messageForObject);
      chat.message = messageForArray;
      chat.jointPeople.push(fields.receiverID);
      chat.jointPeople.push(fields.senderID);

      chat.save()
        .then(value => {
          let result = {
            status: "訊息傳送成功",
            content: value
          }
          res.json(result)
        })
        .catch(error => res.json(error));
    })
  }

  chatHistory(req, res, next) {
     chatSchemaModel.find({sender_userID: req.body.senderID})
      .then(doc => {
        //console.log(doc)
        for(let i = 0; i < doc.length; i++) {
          if (doc[i].jointPeople.indexOf(req.body.receiveID) != -1) {
            console.log(doc[i])
          }
          let result = {
            status: "聊天紀錄傳送成功",
            content: doc[i]
          }
          res.json(result)
        }
      })
  }



  //1.創建聊天室的api聊天內容的api....
  //2.發送訊息的api
  //3.加入好友的api
  //4.查看某特訊息api



}