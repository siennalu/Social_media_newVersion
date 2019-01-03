const userSchemaModel = require('../models/user_model.js');
const articleSchemaModel = require('../models/article_model.js');
const profileSchemaModel = require('../models/profile_model.js');
const formidable = require('formidable');
const cloudinary = require('cloudinary');

cloudinary.config ({
  cloud_name: 'dzzdz1kvr',
  api_key: '154653594993876',
  api_secret: 'pzNTrLGj6HJkE6QGAUeJ2cyBxAE'
});


module.exports = class Profile {
  searchProfileByUserID(req, res, next) {
    profileSchemaModel.findOne({userID: req.body.userID})
      .then(data => {
        data.totalOfFollowings = data.following.length;
        data.totalOfFans = data.fans.length;
        res.json(data)
      })
      .catch(error => {
        let result = {
          status: "個人頁面搜尋失敗",
          err: "伺服器錯誤，請稍後再試"
        }
        res.json(error);
      })
  }

  searchArticleByUserID(req, res, next) {
    let articleArray=[];
    articleSchemaModel.find({authorID: req.body.userID})
      .then(data => {
        res.json(data);
      })
      .catch(error => {
        let result = {
          status: "文章搜尋失敗",
          err: "伺服器錯誤，請稍後再試"
        };
        res.json(error);
      })
  }


  profileSetting(req, res, next) {
    profileSchemaModel.findOne({userID: req.body.userID})
      .then(data => {
        if (req.body.userName != null) {
          data.userName = req.body.userName; //暱稱
          userSchemaModel.findOne({_id: req.body.userID})
            .then(doc => {
              doc.userName = req.body.userName;
              doc.save()
                .then(doc => {
                  console.log("modified");
                })
                .catch(error => console.log(error));
            })
            .catch(error => console.log(error));
        }
        if (req.body.aboutMe != null) data.aboutMe = req.body.aboutMe;//內文
        if (req.body.colorOfTheme != null) data.colorOfTheme = req.body.colorOfTheme; //主題顏色設定
        data.save()
          .then(doc => {
            let result = {
              status: "個人頁面修改成功",
              content: doc
            };
            res.json(result);
          })
          .catch(error => {
            console.log(error);
          })
      })
      .catch(error => {
        let result = {
          status: "個人頁面修改失敗",
          err: "伺服器錯誤，請稍後再試"
        };
        res.json(error);
      })
  }


  friendsFollowing(req, res, next) {
    let fanObj = {};
    let followingObj = {};
    let userIDForFansArray = [];

    profileSchemaModel.findOne({userID: req.body.userID_followed})  //被追蹤的人
      .then(data => {
        profileSchemaModel.find({})
          .then(all_profile => {

            //若目前尚無任何粉絲則直接將following加入
            if (data.fans.length === 0) {
              //console.log("長度為0");
              userIDForFansArray.push(req.body.userID_following);
              fanObj = searchUserNameAndAvatarLink(all_profile, req.body.userID_following);
              data.fans.push(fanObj);

              data.save()
                .then(value => {
                  console.log("fans created")
                })
                .catch(error => console.log(error));


            } else if (data.fans.length !== 0) {

              //先將followed這個人的所有fansUserID 放入userIDForFansArray中
              for (let i = 0; i < data.fans.length; i++) {
                userIDForFansArray.push(data.fans[i].userID);
                //console.log("目前粉絲ID" + userIDForFansArray);
              }

              //確認沒有粉絲重複
              if (userIDForFansArray.indexOf(req.body.userID_following) === -1) {
                //console.log("userIDForFans:" + userIDForFansArray);

                userIDForFansArray.push(req.body.userID_following);
                fanObj = searchUserNameAndAvatarLink(all_profile, req.body.userID_following);
                data.fans.push(fanObj);

                console.log(data);
              }

              data.save()
                .then(value => {
                  console.log("fans created")
                })
                .catch(error => console.log(error));
            }
          })
      })
      .catch(error => console.log(error));

    profileSchemaModel.findOne({userID: req.body.userID_following})   //追蹤的人
      .then(doc => {
        profileSchemaModel.find({})
          .then(all_profile => {

            let userIDForFollowingArray = [];
            if (doc.following.length === 0) {
              //console.log("追蹤長度為0");

              //若目前尚無任何追蹤則直接將followed加入
              if (userIDForFollowingArray.indexOf(req.body.userID_followed) === -1) {
                userIDForFollowingArray.push(req.body.userID_followed);
                followingObj = searchUserNameAndAvatarLink(all_profile, req.body.userID_followed);
                doc.following.push(followingObj);
                console.log(followingObj);
              }

              doc.save()
                .then(result => {
                  console.log("following created")
                })
                .catch(error => console.log(error));
              let result = {
                status: "追蹤成功",
                content: doc
              };
              res.json(result);

            } else if (doc.following.length !== 0) {
              //已有粉絲，但followed尚未加入

              for (let i = 0; i < doc.following.length; i++) {
                userIDForFollowingArray.push(doc.following[i].userID);
                //console.log("目前following得ID" + userIDForFollowingArray)
              }

              if (userIDForFollowingArray.indexOf(req.body.userID_followed) === -1) {
                userIDForFollowingArray.push(req.body.userID_followed);
                //console.log("追蹤長度不為零 :" + userIDForFollowingArray);
                followingObj = searchUserNameAndAvatarLink(all_profile, req.body.userID_followed);
                doc.following.push(followingObj);
              }


              doc.save()
                .then(result => {
                  console.log("following created")
                })
                .catch(error => console.log(error));
              let result = {
                status: "追蹤成功",
                content: doc
              };
              res.json(result);
            }
          })
          .catch(error => { console.log("error")});
      })
      .catch(error => {
        let result = {
          status: "追蹤失敗",
          err: "伺服器錯誤，請稍後再試"
        };
        res.json(error)
      });

    //回傳物件:userID userName 和 avatarLink
    function searchUserNameAndAvatarLink(all_profile, userID) {
      let userObj = {};
      for (let i = 0; i < all_profile.length; i++) {
        if (userID === all_profile[i].userID) {
          userObj.userID = userID;
          userObj.userName = all_profile[i].userName;
          userObj.avatarLink = all_profile[i].avatarLink;
        }
      }
      return userObj;
    }
  }


  friendsUnfollowing(req, res, next) {
    let fansUserIDArray = [];
    let followingUserIDArray = [];
    profileSchemaModel.findOne({userID: req.body.userID_followed})  //被追蹤的人
      .then(data_follow => {

        //先把 fansUserId放在陣列中
        for (let i = 0; i < data_follow.fans.length; i++) {
          fansUserIDArray.push(data_follow.fans[i].userID);
        }

        //確認 followed的 fans裡面是否已有following
        if (fansUserIDArray.indexOf(req.body.userID_following) !== -1) {
          //找到該userID並刪除
          for (let j = 0; j < data_follow.fans.length; j++) {
            if (data_follow.fans[j].userID === req.body.userID_following ) {
              data_follow.fans.splice(fansUserIDArray.indexOf(req.body.userID_following), 1);
            }
          }
        }
        //console.log(data_follow);
        data_follow.save()
          .then(value => {
            console.log("fans delete");
          })
          .catch(error => console.log(error));
      })
      .catch(error => console.log(error));


    profileSchemaModel.findOne({userID: req.body.userID_following})   //追蹤的人
      .then(doc_follow => {
        //先把 followingUserIDArray 放在陣列中
        for (let i = 0; i < doc_follow.following.length; i++) {
          followingUserIDArray.push(doc_follow.following[i].userID);
        }

        //確認 following中的 following裡面是否已有followed
        if (followingUserIDArray.indexOf(req.body.userID_followed) !== -1) {
          //找到該userID並刪除
          for (let j = 0; j < doc_follow.following.length; j++) {
            if (doc_follow.following[j].userID === req.body.userID_followed) {
              doc_follow.following.splice(followingUserIDArray.indexOf(req.body.userID_followed), 1);
            }
          }
        }

        doc_follow.save()
          .then(result => {
            console.log("following delete");
          })
          .catch(error => console.log(error));
        let result = {
          status: "追蹤刪除成功",
          content: doc_follow
        };
        res.json(result);
      })
      .catch(error => {
        let result = {
          status: "追蹤刪除失敗",
          err: "伺服器錯誤，請稍後再試"
        };
        res.json(error);
      })
  }


  //上傳大頭照
  uploadAvatar(req, res, next) {
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      cloudinary.uploader.upload(files.image.path, function (result) {
        if (!result.secure_url) {
          let result = {
            status: "大頭貼上傳失敗",
            err: "伺服器錯誤，請稍後再試"
          };
          res.json(result);
        }
        else {
          profileSchemaModel.findOne({userID: fields.userID})
            .then(data => {
                data.avatarLink.push(result.secure_url);

              userSchemaModel.findOne({_id: fields.userID})
              .then(doc => {
                doc.avatarLink.push(result.secure_url);

                doc.save()
                  .then(value=> {
                    console.log("avatarLink already saved to db")
                  })
                  .catch(error => {
                    console.log("avatarLink is error to save to db")
                  });

                data.save()
                  .then(value => {
                    let result = {
                      status: "大頭貼上傳成功",
                      content: value
                    };
                    res.json(result)
                  })
                  .catch(error => {
                    let result = {
                      status: "大頭貼上傳失敗",
                      err: "伺服器錯誤，請稍後再試"
                    };
                    res.json(error);
                  })
              })
              .catch(err => {
                console.log(err);
              })
            })
            .catch(error => {
              let result = {
                status: "大頭貼上傳失敗",
                err: "伺服器錯誤，請稍後再試"
              };
              res.json(error)
            })
        }
      }, {folder: 'Social_Media/avatar'});
    })
  }

  //上傳背景照
  uploadBackgroundPhoto(req, res, next) {
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      cloudinary.uploader.upload(files.image.path, function (result) {
        if (!result.secure_url) {
          let result = {
            status: "背景照上傳失敗",
            err: "伺服器錯誤，請稍後再試"
          };
          res.json(result);
        }
        else {
          profileSchemaModel.findOne({userID: fields.userID})
            .then(data => {
              data.backgroundLink = result.secure_url;

              userSchemaModel.findOne({_id: fields.userID})
                .then(doc => {
                  doc.backgroundLink = result.secure_url;

                  doc.save()
                    .then(value =>{
                      console.log("backgroungLink already saved to db");
                    })
                    .catch(error => {
                      console.log("backgroungLink is error to save to db");
                    })

                  data.save()
                    .then(value => {
                      let result = {
                        status: "背景照上傳成功",
                        content: value
                      };
                      res.json(result);
                    })
                    .catch(error => {
                      let result = {
                        status: "背景照上傳失敗",
                        err: "伺服器錯誤，請稍後再試"
                      };
                      res.json(error);
                    })
                })
            })
        }
      }, {folder: 'Social_Media/backGroundPhoto'});
    })
  }


  // friendsAdd(req, res, next) {
  //   profileSchemaModel.findOne({userID: req.body.userID})  // 自己
  //     .then(data => {
  //       //確認是否已存在好友的ID
  //       if (data.friends.indexOf(req.body.userID_add) == -1) data.friends.push(req.body.userID_add)
  //       //加好友同時追蹤
  //       if (data.following.indexOf(req.body.userID_add) == -1) data.following.push(req.body.userID_add)
  //       profileSchemaModel.findOne({userID: req.body.userID_add})
  //         .then(doc=> {
  //           //確認是否已為粉絲
  //           if (doc.fans.indexOf(req.body.userID) == -1) doc.fans.push(req.body.userID)
  //           doc.save()
  //             .then(value => {
  //               console.log("fans added")
  //             })
  //             .catch(error => console.log(error));
  //         })
  //         .catch(error => console.log(error));
  //       data.save()
  //         .then(value => {
  //           let result = {
  //             status: "新增好友成功",
  //             content: value
  //           }
  //           res.json(result)
  //         })
  //         .catch(error => {
  //           let result = {
  //             status: "新增好友失敗",
  //             err: "伺服器錯誤，請稍後再試"
  //           }
  //           res.json(error)
  //         })
  //     })
  //     .catch(error => console.log(error));
  // }


  friendsUnadded(req, res, next){
    profileSchemaModel.findOne({userID: req.body.userID_unadded})//欲取消的ID
      .then(doc => {
      profileSchemaModel.findOne({userID: req.body.userID})  // 自己
        .then(data => {
          //確認是否已為好友
          if (data.friends.indexOf(req.body.userID_unadded) != -1  && doc.friends.indexOf(req.body.userID) != -1) {
            let numOfFriendsInUserIDUnadded = data.friends.indexOf(req.body.userID_unadded);
            let numOfUserIDUnaddedInFans = data.fans.indexOf(req.body.userID_unadded);
            let numOfUserIDUnaddedInFollowing = data.following.indexOf(req.body.userID_unadded);

            let numOfFriendsInUserID = doc.friends.indexOf(req.body.userID);
            let numOfUserIDInFans = doc.fans.indexOf(req.body.userID);
            let numOfUserIDInFollowing = doc.following.indexOf(req.body.userID);

            data.friends.splice(numOfFriendsInUserIDUnadded,1);
            data.fans.splice(numOfUserIDUnaddedInFans,1);
            data.following.splice(numOfUserIDUnaddedInFollowing,1);

            doc.friends.splice(numOfFriendsInUserID,1);
            doc.fans.splice(numOfUserIDInFans,1);
            doc.following.splice(numOfUserIDInFollowing,1);
          }

      doc.save()
        .then(value=>{
          console.log("");
        })
        .catch(error =>{
          console.log(error);
        });
      data.save()
        .then(value => {
          let result = {
            status: "刪除好友成功",
            content: value
          };
          res.json(result);
        })
        .catch(error => {
          let result = {
            status: "刪除好友失敗",
            err: "伺服器錯誤，請稍後再試"
          };
          res.json(error);
        })
      })
    .catch(error => console.log(error));
    })
    .catch(error => console.log(error));
  }


  friendsRequest(req, res, next) {
    //發出好友請求
    profileSchemaModel.findOne({userID:req.body.userID_request}) //發出請求確認的人
      .then(doc => {
        profileSchemaModel.findOne({userID: req.body.userID_requested}) //被請求確認的人
          .then(data => {
            //雙方是否尚未為好友
            if (doc.friends.indexOf(req.body.userID_requested) == -1 && data.friends.indexOf(req.body.userID_request) == -1) {
              if (doc.requestByOthers.indexOf(req.body.userID_requested) == -1 && data.requestByMyself.indexOf(req.body.userID_request) == -1) {
                //A加B
                if (doc.requestByMyself.indexOf(req.body.userID_requested) == -1 && data.requestByOthers.indexOf(req.body.userID_request) == -1) {
                  doc.requestByMyself.push(req.body.userID_requested); //b
                  data.requestByOthers.push(req.body.userID_request); //a
                }

                //B加A
              } else {
                let numOfRequestByMyself = data.requestByMyself.indexOf(req.body.userID_request);
                let numOfRequestByOthers = doc.requestByOthers.indexOf(req.body.userID_requested);

                doc.requestByOthers.splice(numOfRequestByOthers, 1);
                data.requestByMyself.splice(numOfRequestByMyself, 1);

                doc.friends.push(req.body.userID_requested);
                data.friends.push(req.body.userID_request);
                doc.fans.push(req.body.userID_requested);
                data.fans.push(req.body.userID_request);
                doc.following.push(req.body.userID_requested);
                data.following.push(req.body.userID_request);
              }

              data.save()
                .then(value => {
                  console.log("");
                })
                .catch(error => {
                  console.log("error");
                })
              doc.save().then(value => {
                let result = {
                  status: "已發出好友請求",
                  content: value
                };
                res.json(result);
              })
           }
          })
          .catch(err => {
            console.log(err);
          })
      })
      .catch(err => {
        console.log(err);
      })
  }


  friendsRequestWaitingForAdded(req, res, next) {
  //欲確認他人請求
    profileSchemaModel.findOne({userID:req.body.userID_adder}) //確認的人
    .then(doc=>{
      let temp =0;
      if (doc.requestByOthers.indexOf(req.body.userID_added) != -1) {   //確認請求確認的ID是否在requestByOthers中
        temp = doc.requestByOthers.indexOf(req.body.userID_added);
        doc.requestByOthers.splice(temp, 1); //刪掉user 加入friends中
        //加好友同時追蹤、成為粉絲(?

        if(doc.friends.indexOf(req.body.userID_added) == -1) doc.friends.push(req.body.userID_added)
        if(doc.following.indexOf(req.body.userID_added)== -1) doc.following.push(req.body.userID_added)
        if(doc.fans.indexOf(req.body.userID_added)== -1) doc.fans.push(req.body.userID_added)
      }
        profileSchemaModel.findOne({userID:req.body.userID_added}) //被請求確認的人
          .then(data=> {
            let temp = 0;
            if (data.requestByMyself.indexOf(req.body.userID_adder) != -1) {   //確認請求確認的ID是否在requestByOthers中
              temp = doc.requestByMyself.indexOf(req.body.userID_adder)
              data.requestByMyself.splice(temp, 1); //刪掉user 加入friends中
              //加好友同時追蹤、成為粉絲
              if(data.friends.indexOf(req.body.userID_adder) == -1) data.friends.push(req.body.userID_adder);
              if(data.following.indexOf(req.body.userID_adder) == -1) data.following.push(req.body.userID_adder);
              if(data.fans.indexOf(req.body.userID_adder) == -1) data.fans.push(req.body.userID_adder);

              data.save()
                .then(value => {
                  console.log("");
                })
                .catch(error => {
                  console.log("error");
                })
              doc.save().then(value => {
                let result = {
                  status: "好友已確認，已成為好友",
                  content: value
                }
                res.json(result);
              })
            }
          })
          .catch(err => {
            console.log(err);
          })
    })
    .catch(err => {
      console.log(err);
    })
  }


  friendsUnrequest(req, res, next){
    profileSchemaModel.findOne({userID:req.body.userID_request}) //發出請求確認的人
      .then(doc => {
        profileSchemaModel.findOne({userID: req.body.userID_requested}) //被請求確認的人
          .then(data => {
            //確認請求人是否有在被請求人的名單中
            if (data.requestByOthers.indexOf(req.body.userID_request) != -1 && doc.requestByMyself.indexOf(req.body.userID_requested)!= -1) {
              let numOfRequestByMyself = doc.requestByMyself.indexOf(req.body.userID_requested);
              let numOfRequestByOthers = data.requestByOthers.indexOf(req.body.userID_request);

              //將請求人的ID刪除
              data.requestByOthers.splice(numOfRequestByOthers, 1);
              doc.requestByMyself.splice(numOfRequestByMyself, 1);
            }

            data.save()
              .then(value => {
                console.log("");
              })
              .catch(error => {
                console.log("error");
              })

            doc.save().then(value => {
              let result = {
                status: "已取消好友請求",
                content: value
              };
              res.json(result);
            })
          })
          .catch(err => {
            console.log(err);
          })
      })
      .catch(err => {
        console.log(err);
      })
    }
}

