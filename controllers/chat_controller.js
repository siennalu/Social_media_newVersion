const chatSchemaModel = require('../models/chat_model.js');
const userSchemaModel = require('../models/user_model.js');
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

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      let chat = new chatSchemaModel({
        creator_userID: fields.creator_userID,
        jointPeople: [], //receiver
        message: [],
        titleOfChatroom:fields.titleOfChatroom,
      });


      chat.jointPeople.push(fields.receiverID);
      chat.jointPeople.push(fields.creator_userID);


      chat.save()
        .then(value => {
          let result = {
            status: "聊天室創建成功",
            content: value
          }
          res.json(result)
        })
        .catch(error => res.json(error));
    })
  }


  sendMessage(req, res, next) {
    let messageForObject = {};
    let messageForArray = [];
    let seconds = Math.round(Date.now() / 1000);
    let id = uniqid();

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      chatSchemaModel.findOne({_id:fields.chatRoomID})
      .then(doc=> {
        messageForObject.time = seconds;
        messageForObject.content = fields.message;
        messageForObject.messageID = id;
        messageForObject.senderID = fields.senderID

          userSchemaModel.findOne({_id:fields.senderID})
            .then(user=>{
              messageForObject.userName = user.userName
              //messageForArray.push(messageForObject);
              doc.message.push(messageForObject)

              doc.save()
                .then(value => {
                  let result = {
                    status: "訊息傳送成功",
                    content: value
                  }
                  res.json(result)
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
      })
        .catch(error => res.json(error));
    })
  }

  searchChatHistoryByChatroomID(req, res, next) {
     chatSchemaModel.findOne({_id: req.body.chatRoomID})
      .then(doc => {
          let result = {
            status: "查詢聊天紀錄成功",
            content: doc
          }
          res.json(result)
      })
  }

  // // searchChatMessageByMessageID(req, res,next) {
  // //  //express regulation
  // //   // 1.在chatModel中查 messageID-> chatRoomID,印出所有message,找出所有messageID
  // //   // 2.輸入欲匹配的字串(req.body.matchString)
  // //   // 3.匹對後顯示該筆訊息內容
  // //
  // //   chatSchemaModel.findOne({_id: req.body.chatRoomID})
  // //     .then(doc => {
  // //        //console.log(doc.message)
  // //       let reg1 = new RegExp('e','i'); //i不區分大小寫
  // //
  // //       reg1.test('e'); //結果 true
  // //       //console.log(reg1.test('e'))
  // //       reg1.test('E'); //結果 true
  // //       //console.log(reg1.test('E'))
  // //
  // //       // let reg = /has/gi;
  // //       // var para = 'he has a dog has a feet';
  // //       // console.log(para.match(reg));    //結果為has
  // //
  // //       for(let i= 0; i< doc.message.length;i++) {
  // //
  // //         let reg = /req.body.matchString/gi;
  // //         var para = doc.message[i].content;
  // //         console.log(para.match(reg));
  // //
  // //         //  console.log(doc.message[i].messageID)
  // //            // console.log(doc.message[i].content)
  // //           //console.log(doc.message.length)
  // //         //console.log(doc.message[i])
  // //           //doc.message[i].content.match(/req.body.matchString\w/g)
  // //
  // //
  // //
  // //           // if(doc.message[i]== req.body.matchString){
  // //           //
  // //           // }
  // //
  // //           //匹配
  // //
  // //
  // //       }
  // //
  // //
  // //
  // //
  // //
  // //
  // //
  // //     })
  //
  //
  // }



}