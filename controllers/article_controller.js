const articleSchemaModel = require('../models/article_model.js');
const profileSchemaModel = require('../models/profile_model.js');
const userSchemaModel = require('../models/user_model.js');
const sendNotification = require('./notification.js');
const uniqid = require('uniqid');
const formidable = require('formidable');
const cloudinary = require('cloudinary');

cloudinary.config ({
  cloud_name: 'dzzdz1kvr',
  api_key: '154653594993876',
  api_secret: 'pzNTrLGj6HJkE6QGAUeJ2cyBxAE'
});


module.exports = class Article {
  postArticle(req, res, next) {
    let contentForArray = [];
    let contentForObject = {};
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      let article = new articleSchemaModel({
        listOfContent: [],
        delete: false,
        title: fields.title,
      });

      article.authorID = fields.authorID;
      article.author = fields.author;
      article.title = fields.title;
      article.category = fields.category;
      article.privacy = fields.privacy;
      article.hashTags = fields.hashTags;
      contentForObject.time = seconds;
      contentForObject.content = fields.content;
      let mediaArray = [];

      //上傳圖片及照片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType; //png
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj);

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;
            mediaArray.push(videoObj);
            contentForObject.mediaLink = mediaArray;
            contentForArray.push(contentForObject);
            article.listOfContent = contentForArray;

            if (article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
              article.save()
                .then(posts => {
                  let result = {
                    status: "圖片和影片發文成功",
                    article: posts
                  };
                  res.json(result);
                })
                .catch(error => res.json(error));
            } else {
              let result = {
                status: "發文失敗",
                err: "請輸入作者ID"
              };
               res.json(result);
            }
          }, {resource_type: "video"});
        }, {folder: 'Social_Media/mediaLink'});

        //上傳圖片
      } else if (files.image != null && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType; //png
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj);
          contentForObject.mediaLink = mediaArray;
          contentForArray.push(contentForObject);
          article.listOfContent = contentForArray;

          if (article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
            article.save()
              .then(posts => {
                let result = {
                  status: "圖片發文成功",
                  article: posts
                };
                res.json(result);
              })
              .catch(error => res.json(error));
          } else {
            let result = {
              status: "發文失敗",
              err: "請輸入作者ID"
            };
            res.json(result);
          }
        }, {folder: 'Social_Media/mediaLink'});

        //上傳影片
      } else if (files.image == null && files.video != null) {
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType; //mp4
          videoObj.link = resultVideoUrl.secure_url;
          mediaArray.push(videoObj);
          contentForObject.mediaLink = mediaArray;
          contentForArray.push(contentForObject);
          article.listOfContent = contentForArray;

          if (article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
            article.save()
              .then(posts => {
                let result = {
                  status: "影片發文成功",
                  article: posts
                };
                res.json(result);
              })
              .catch(error => res.json(error))
          } else {
            let result = {
              status: "發文失敗",
              err: "請輸入作者ID"
            };
            res.json(result);
          }
        }, {resource_type: "video"});

      } else if (files.image == null && files.video == null) {
        contentForArray.push(contentForObject);
        article.listOfContent = contentForArray;

        if (article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
          article.save()
            .then(posts => {
              let result = {
                status: "發文成功",
                article: posts
              };
              res.json(result);
            })
            .catch(error => res.json(error));
        } else {
          let result = {
            status: "發文失敗",
            err: "請輸入作者ID"
          };
          res.json(result);
        }
      }
    })
  }


  async searchArticleByArticleID(req, res, next) {
    let articleArray = [];
    let articleOne = await articleSchemaModel.findOne({delete: false, _id: req.body.articleID, privacy: "public"}).exec()
    articleArray.push(articleOne);
    res.json(articleArray);
  }


  searchArticleByCategoryAndTheSameAuthor(req, res, next) {
    let centerArray = [];
    let categoryArray = [];

    articleSchemaModel.find({delete: false, privacy: "public"})
      .then(doc=> {

        profileSchemaModel.find({})
          .then(all_profile => {

            //先過濾是否為friendsArticles
            let friendsArticles = getFriendsArticle(req.body.userID, all_profile, doc);

            //文章排序
            let sortedArticle = friendsArticles.sort(function (b, a) {
              return a.listOfContent[a.listOfContent.length - 1].time - b.listOfContent[b.listOfContent.length - 1].time;
            });

            let terminateNumber = sortedArticle.length < req.body.count * 10 ? sortedArticle.length : req.body.count * 10;
            for (let i = (req.body.count * 10 - 1)- 9; i < terminateNumber; i++) {
              //找centerArticle
              let articleObj = {};
              //將所有的分類放到categoryArray中，若已在該分類中則不列入centerArticle
              //if (categoryArray.indexOf(sortedArticle[i].category) == -1) {
                categoryArray.push(sortedArticle[i].category);
                articleObj.centerArticle = sortedArticle[i];
                articleObj.sameCategory = [];
                articleObj.sameAuthor = [];
                centerArray.push(articleObj);

                //新增文章大頭貼
                let authorAvatarLink = authorToAvatarLink(sortedArticle[i].authorID);
                if (authorAvatarLink.length == 1) {
                  sortedArticle[i].avatarLink = authorAvatarLink
                }
                else if (authorAvatarLink.length > 1) {
                  sortedArticle[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length - 1])
                }

                //新增留言大頭貼
                if (sortedArticle[i].comment != null) {
                  for (let j = 0; j < sortedArticle[i].comment.length; j++) {
                    let commentAvatarLink = authorToAvatarLink(sortedArticle[i].comment[j].commenterID)
                    if (commentAvatarLink.length == 1 || commentAvatarLink.length == 0) {
                      sortedArticle[i].comment[j].commenter_avatarLink = commentAvatarLink
                    }
                    else if (commentAvatarLink.length > 1) {
                      sortedArticle[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length - 1])
                    }
                  }
                }

            }

            for (let j = 0; j < centerArray.length; j++) {
              for (let i = (req.body.count * 10 - 1)- 9; i < terminateNumber; i++) {
                //找sameCategory的文章
                if (centerArray[j].centerArticle.category === sortedArticle[i].category && sortedArticle[i].id !== centerArray[j].centerArticle.id && centerArray[j].sameCategory.length < 5) {
                  centerArray[j].sameCategory.push(sortedArticle[i]);

                  //新增文章大頭貼
                  let authorAvatarLink = authorToAvatarLink(sortedArticle[i].authorID);
                  if (authorAvatarLink.length == 1) {
                    sortedArticle[i].avatarLink = authorAvatarLink
                  }
                  else if (authorAvatarLink.length > 1) {
                    sortedArticle[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length - 1])
                  }

                  //新增留言大頭貼
                  if (sortedArticle[i].comment != null) {
                    for (let j = 0; j < sortedArticle[i].comment.length; j++) {
                      //console.log(sortedArticle[i].comment[j].id)
                      let commentAvatarLink = authorToAvatarLink(sortedArticle[i].comment[j].commenterID)
                      if (commentAvatarLink.length == 1 || commentAvatarLink.length == 0) {
                        sortedArticle[i].comment[j].commenter_avatarLink = commentAvatarLink
                      }
                      else if (commentAvatarLink.length > 1) {
                        sortedArticle[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length - 1])
                      }
                    }
                  }
                }

                //找sameAuthor的文章
                if (centerArray[j].centerArticle.authorID === sortedArticle[i].authorID && centerArray[j].centerArticle._id !== sortedArticle[i]._id && centerArray[j].sameAuthor.length < 5) {
                  centerArray[j].sameAuthor.push(sortedArticle[i]);

                  //新增文章大頭貼
                  let authorAvatarLink = authorToAvatarLink(sortedArticle[i].authorID);
                  if (authorAvatarLink.length == 1) {
                    sortedArticle[i].avatarLink = authorAvatarLink
                  }
                  else if (authorAvatarLink.length > 1) {
                    sortedArticle[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length - 1])
                  }

                  //新增留言大頭貼
                  if (sortedArticle[i].comment != null) {
                    for (let j = 0; j < sortedArticle[i].comment.length; j++) {
                      let commentAvatarLink = authorToAvatarLink(sortedArticle[i].comment[j].commenterID)
                      if (commentAvatarLink.length == 1 || commentAvatarLink.length == 0) {
                        sortedArticle[i].comment[j].commenter_avatarLink = commentAvatarLink
                      }
                      else if (commentAvatarLink.length > 1) {
                        sortedArticle[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length - 1])
                      }
                    }
                  }
                }
              }
            }



            function authorToAvatarLink(id) {
              for (let i = 0; i < all_profile.length; i++) {
                if (id == all_profile[i].userID) {
                  return all_profile[i].avatarLink;
                }
              }
            }


            function getFriendsArticle(userID, profile , article) {
              //console.log(userID)
              let friendsArticle = [];
              let finallyFriendsArticle = [];
              for(let i = 0; i < profile.length; i++) {
                //profile.friends型態是陣列，所以用==
                if (userID == profile[i].userID) {
                  //撈出好友的文章
                  for (let j = 0; j < article.length; j++) {
                    for (let friendsID of profile[i].friends) {
                      if (article[j].authorID === friendsID) {
                        //console.log(updatedUserName(article[j].author, profile , article))
                        friendsArticle.push(article[j]);
                        //確定更新userName
                        finallyFriendsArticle = updatedUserName(friendsArticle, profile);
                        //console.log(finallyFriendsArticle)
                      }

                    }
                    //若userID為自己則顯示自己發的文章
                    if(userID === article[j].authorID) {
                      friendsArticle.push(article[j]);
                      //確定更新userName
                      finallyFriendsArticle = updatedUserName(friendsArticle, profile);
                    }
                  }
                }
              }
              return finallyFriendsArticle;
            }


            function updatedUserName (article, profile) {
              let updatefriendsArticleArray = [];
              for (let i = 0; i < article.length; i++) {
                for (let j = 0; j < profile.length; j++) {
                  if (article[i].authorID === profile[j].userID) {
                    article[i].author = profile[j].userName;
                    updatefriendsArticleArray.push(article[i])
                  }
                }
              }
              return updatefriendsArticleArray;
            }

            res.json(centerArray);
          })
      })
  }


  //撈五篇同分類的文章
  searchMoreArticlesByTheSameCategory(req, res, next) {
    articleSchemaModel.find({delete: false, privacy: "public"})
      .then(doc=> {
        profileSchemaModel.find({})
          .then(all_profile => {

            //先過濾是否為friendsArticles
            let friendsArticles = getFriendsArticle(req.body.userID, all_profile, doc);

            //文章排序
            let sortedArticle = friendsArticles.sort(function (b, a) {
              return a.listOfContent[a.listOfContent.length - 1].time - b.listOfContent[b.listOfContent.length - 1].time;
            });

            //根據分類給文章
            let existArticleIDArray = [];
            let getFiveArticles = [];
            for (let i = 0; i < sortedArticle.length; i++) {
              if (sortedArticle[i].category === req.body.category) {
                existArticleIDArray = searchExistedArticleID(req.body.category);
              }
            }

            //已存在之全部的文章ID
            let allArticleID = req.body.articleIDInSameCategory;
            if (typeof (req.body.articleIDInSameCategory) === String) {
              allArticleID = JSON.parse(req.body.articleIDInSameCategory);
            }

            for (let j = 0; j < existArticleIDArray.length; j++) {
              if (allArticleID.indexOf(existArticleIDArray[j].id) == -1 && getFiveArticles.length < 5)
                getFiveArticles.push(existArticleIDArray[j]);

              for (let i = 0; i < getFiveArticles.length; i++) {
                if (getFiveArticles[i] != null) {
                  //文章大頭貼
                  let authorAvatarLink = avatarIDToAvatarLink(getFiveArticles[i].authorID);
                  if (authorAvatarLink.length == 1) getFiveArticles[i].avatarLink = authorAvatarLink
                  else if (authorAvatarLink.length > 1) {
                    getFiveArticles[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length - 1])
                  }

                  //留言大頭貼
                  if(getFiveArticles[i].comment != null) {
                    for (let j = 0; j < getFiveArticles[i].comment.length; j++){
                      let commentAvatarLink = avatarIDToAvatarLink(getFiveArticles[i].comment[j].commenterID)
                      if (commentAvatarLink.length == 1) {
                        getFiveArticles[i].comment[j].commenter_avatarLink = commentAvatarLink
                      }
                      else if(commentAvatarLink.length > 1) {
                        getFiveArticles[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length-1])
                      }
                    }
                  }
                }
              }
            }
            res.json(getFiveArticles);


            function searchExistedArticleID(category) {
              let existedArticleIDArray = [];
              for (let j = 0; j < sortedArticle.length; j++) {
                if (category === sortedArticle[j].category && existedArticleIDArray.indexOf(sortedArticle[j].id) == -1) {
                  existedArticleIDArray.push(sortedArticle[j])
                }
              }
              return existedArticleIDArray;
            }


            function avatarIDToAvatarLink(id) {
              for (let i = 0; i < all_profile.length; i++) {
                if (id == all_profile[i].userID) {
                  return all_profile[i].avatarLink;
                }
              }
            }

            function getFriendsArticle(userID, profile , article) {
              let friendsArticle =[];
              let finallyFriendsArticle = [];
              for(let i = 0; i < profile.length; i++) {
                //profile.friends型態是陣列，所以用==
                if(userID == profile[i].userID) {
                  //撈出所有好友的ID console.log(profile[i].friends)
                  //再撈出好友的文章
                  for(let j = 0; j < article.length; j++) {
                    for (let friendsID of profile[i].friends) {
                      if (article[j].authorID === friendsID) {
                        article[j].author = profile[i].userName;
                        friendsArticle.push(article[j])
                        //確定更新userName
                        finallyFriendsArticle = updatedUserName(friendsArticle, profile);
                      }
                    }
                    //若userID為自己則顯示自己發的文章
                    if (userID === article[j].authorID){
                      friendsArticle.push(article[j]);
                      //確定更新userName
                      finallyFriendsArticle = updatedUserName(friendsArticle, profile);
                    }
                  }
                }
              }
              return finallyFriendsArticle;
            }


            function updatedUserName (article, profile) {
              let updatefriendsArticleArray = [];
              for (let i = 0; i < article.length; i++) {
                for (let j = 0; j < profile.length; j++) {
                  if (article[i].authorID === profile[j].userID) {
                    article[i].author = profile[j].userName;
                    updatefriendsArticleArray.push(article[i])
                  }
                }
              }
              return updatefriendsArticleArray;
            }
          })
      })
  }


  //撈五篇同作者的文章
  searchMoreArticlesByTheSameAuthor(req, res, next) {
    articleSchemaModel.find({delete: false, privacy: "public"})
      .then(doc=> {
        profileSchemaModel.find({})
          .then(all_profile => {

            // 先過濾是否為friendsArticles
            // let friendsArticles = getFriendsArticle(req.body.authorID, all_profile, doc);
            // console.log(friendsArticles)
            //文章排序
            let sortedArticle = doc.sort(function (b, a) {
              return a.listOfContent[a.listOfContent.length - 1].time - b.listOfContent[b.listOfContent.length - 1].time;
            });

            //根據作者給文章
            let existArticleIDArray = [];
            let getFiveArticles = [];
            let finalExistArticleIDArray = [];
            for (let i = 0; i < sortedArticle.length; i++) {

              if (sortedArticle[i].authorID === req.body.authorID) {
                existArticleIDArray = searchExistedArticleID(req.body.authorID);
                //確定更新userName
                finalExistArticleIDArray = updatedUserName(existArticleIDArray, all_profile);
                //console.log(finalExistArticleIDArray)
              }
            }


            //已存在之全部的文章ID
            let allArticleID = req.body.articleIDInSameAuthor;
            if (typeof (req.body.articleIDInSameAuthor) === String) {
              allArticleID = JSON.parse(req.body.articleIDInSameAuthor);
            }
            for (let j = 0; j < finalExistArticleIDArray.length; j++) {
              if (allArticleID.indexOf(finalExistArticleIDArray[j].id) == -1 && getFiveArticles.length < 5)
                getFiveArticles.push(finalExistArticleIDArray[j]);

              for (let i = 0; i < getFiveArticles.length; i++) {
                if (getFiveArticles[i] != null) {
                  //文章大頭貼
                  let authorAvatarLink = avatarIDToAvatarLink(getFiveArticles[i].authorID);
                  if (authorAvatarLink.length == 1) getFiveArticles[i].avatarLink = authorAvatarLink
                  else if (authorAvatarLink.length > 1) {
                    getFiveArticles[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length - 1])
                  }

                  //留言大頭貼
                  if(getFiveArticles[i].comment != null) {
                    for (let j = 0; j < getFiveArticles[i].comment.length; j++){
                      let commentAvatarLink = avatarIDToAvatarLink(getFiveArticles[i].comment[j].commenterID)
                      if (commentAvatarLink.length == 1) {
                        getFiveArticles[i].comment[j].commenter_avatarLink = commentAvatarLink
                      }
                      else if(commentAvatarLink.length > 1) {
                        getFiveArticles[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length-1])
                      }
                    }
                  }
                }
              }
            }
            res.json(getFiveArticles);


            function searchExistedArticleID(author) {
              let existedArticleIDArray = [];
              for (let j = 0; j < sortedArticle.length; j++) {
                if (author === sortedArticle[j].authorID && existedArticleIDArray.indexOf(sortedArticle[j].id) == -1) {
                  existedArticleIDArray.push(sortedArticle[j])
                }
              }
              return existedArticleIDArray;
            }


            function avatarIDToAvatarLink(id) {
              for (let i = 0; i < all_profile.length; i++) {
                if (id == all_profile[i].userID) {
                  return all_profile[i].avatarLink;
                }
              }
            }


            function updatedUserName (article, profile) {
              let updatefriendsArticleArray = [];
              for (let i = 0; i < article.length; i++) {
                for (let j = 0; j < profile.length; j++) {
                  if (article[i].authorID === profile[j].userID) {
                    article[i].author = profile[j].userName;
                    updatefriendsArticleArray.push(article[i])
                  }
                }
              }
              return updatefriendsArticleArray;
            }

            // function getFriendsArticle(userID, profile , article) {
            //   let friendsArticle =[];
            //   console.log("123")
            //
            //   for(let i = 0; i < profile.length; i++) {
            //     //profile.friends型態是陣列，所以用==
            //     if(userID == profile[i].userID) {
            //       //撈出所有好友的ID console.log(profile[i].friends)
            //       //再撈出好友的文章
            //       for(let j = 0; j < article.length; j++) {
            //         for (let friendsID of profile[i].friends) {
            //           if(article[j].authorID === friendsID) {
            //             friendsArticle.push(article[j]);
            //
            //           }
            //         }
            //       }
            //     }
            //   }
            //   return friendsArticle;
            // }
          })
      })
  }

  updateArticle(req, res, next) {
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      articleSchemaModel.findOne({_id: fields.articleID})
        .then(doc => {
          //修改文字
          if(fields.content !== undefined  && files.image === undefined  && files.video === undefined) {
            let updateContentObj = {};
            updateContentObj.time = seconds;
            updateContentObj.content = fields.content;

            //判斷原始文章是否有圖片影片，若有則加入
            if(doc.listOfContent[doc.listOfContent.length-1].mediaLink !== undefined) {
              updateContentObj.mediaLink = doc.listOfContent[doc.listOfContent.length-1].mediaLink;
              doc.listOfContent.push(updateContentObj);
            }else {
              doc.listOfContent.push(updateContentObj);
            }

            if (fields.privacy !== null) doc.privacy = fields.privacy;
            if (fields.category !== null) doc.category = fields.category;
            if (fields.title!== null) doc.title = fields.title;
            if (fields.hashTags !== null) doc.hashTags = fields.hashTags;

            doc.save()
              .then(value => {
                let result = {
                  status: "Update the content has been successful.",
                  content: value
                };
                res.json(result);
              })
              .catch(error => res.json(error));

          } else if(fields.content === undefined  && files.image !== undefined  && files.video === undefined) {
            let updatePhotoObj = {};
            updatePhotoObj.time = seconds;
            //判斷原始文章是否有影片，若有則加入
            if(doc.listOfContent[doc.listOfContent.length-1].mediaLink !== undefined) {
              let mediaLinkArray = searchVideoLink(doc.listOfContent[doc.listOfContent.length-1].mediaLink);

              //判斷原始文章是否有文字，若有則加入
              if(doc.listOfContent[doc.listOfContent.length-1].content !== undefined) {
                updatePhotoObj.content = doc.listOfContent[doc.listOfContent.length - 1].content
              }

              //修改圖片
              cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
                photoObj.type = fields.photoType;
                photoObj.link = resultPhotoUrl.secure_url;
                mediaLinkArray.push(photoObj);
                updatePhotoObj.mediaLink = mediaLinkArray;
                doc.listOfContent.push(updatePhotoObj);

                if (fields.privacy !== null) doc.privacy = fields.privacy;
                if (fields.category !== null) doc.category = fields.category;
                if (fields.title!== null) doc.title = fields.title;
                if (fields.hashTags !== null) doc.hashTags = fields.hashTags;

                doc.save()
                  .then(value => {
                    let result = {
                      status: "Update the photo has been successful.",
                      content: value
                    };
                    res.json(result);
                  })
                  .catch(error => res.json(error));
              });
            }

            function searchVideoLink(mediaLink) {
              let mediaObj = {};
              let mediaArray = [];
              for(let i = 0; i < mediaLink.length; i++) {
                if(mediaLink[i].type == 'mp4' || mediaLink[i].type == 'mp3') {
                  mediaObj.type = mediaLink[i].type;
                  mediaObj.link = mediaLink[i].link;
                  mediaArray.push(mediaObj);
                }
              }
              return mediaArray;
            }

          } else if(fields.content === undefined  && files.image === undefined  && files.video !== undefined) {
            let updateVideoObj = {};
            updateVideoObj.time = seconds;
            //判斷原始文章是否有圖片，若有則加入
            if (doc.listOfContent[doc.listOfContent.length - 1].mediaLink !== undefined) {
              let mediaLinkArray = searchPhotoLink(doc.listOfContent[doc.listOfContent.length - 1].mediaLink);

              //判斷原始文章是否有文字，若有則加入
              if (doc.listOfContent[doc.listOfContent.length - 1].content !== undefined) {
                updateVideoObj.content = doc.listOfContent[doc.listOfContent.length - 1].content;
              }

              //修改影片
              cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
                videoObj.type = fields.videoType; //mp4
                videoObj.link = resultVideoUrl.secure_url;
                mediaLinkArray.push(videoObj);
                updateVideoObj.mediaLink = mediaLinkArray;
                doc.listOfContent.push(updateVideoObj);

                if (fields.privacy !== null) doc.privacy = fields.privacy;
                if (fields.category !== null) doc.category = fields.category;
                if (fields.title !== null) doc.title = fields.title;
                if (fields.hashTags !== null) doc.hashTags = fields.hashTags;

                doc.save()
                  .then(value => {
                    let result = {
                      status: "Update the video has been successful.",
                      content: value
                    };
                    res.json(result);
                  })
                  .catch(error => res.json(error));
              });
            }

            function searchPhotoLink(mediaLink) {
              let mediaObj = {};
              let mediaArray = [];
              for (let i = 0; i < mediaLink.length; i++) {
                if (mediaLink[i].type == 'jpg' || mediaLink[i].type == 'jpeg'|| mediaLink[i].type == 'png') {
                  mediaObj.type = mediaLink[i].type;
                  mediaObj.link = mediaLink[i].link;
                  mediaArray.push(mediaObj);
                }
              }
              return mediaArray;
            }
          }
        })
        .catch(err => {
          console.log(err);
        })
    })
  }


  deleteArticle(req, res, next) {
    articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        doc.delete = true;
        doc.save().then(value => {
          let result = {
            status: "刪除成功",
            content: value
          };
          res.json(result);
        })

          .catch(error => {
            let result = {
              status: "刪除失敗",
              err: "伺服器錯誤，請稍後再試"
            }
            res.json(error)
          })
      })
      .catch(err => {
        console.log(err);
      })
  }

  likesArticle(req, res, next) {
    let objForLikes = {};
    let likesArray = [];
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        userSchemaModel.findOne({_id: req.body.likesPersonID})
          .then(user => {
            for (let i = 0; i < doc.likes.length; i++) {
              likesArray.push(doc.likes[i].userID);
            }
            if (likesArray.indexOf(req.body.likesPersonID) == -1) {
              objForLikes.userName = user.userName;
              objForLikes.userID = req.body.likesPersonID;
              objForLikes.avatarLink = user.avatarLink;
              doc.likes.push(objForLikes);
              doc.numberOfLikes = doc.likes.length;

              //發通知
              let notificationObject = {
                title: "按讚通知",
                body: user.userName + "覺得您的文章讚"
              };

              //取得B的token
              profileSchemaModel.findOne({userID: doc.authorID})
                .then(profile_data => {
                  let notificationToken = profile_data.notificationToken[0];
                  sendNotification(notificationToken, notificationObject);
                  profile_data.notification.push(notificationObject);
                  profile_data.save()
                })
                .catch(err => {
                  console.log(err);
                })
            }

            doc.save()
              .then(value => {
                let result = {
                  status: "已按讚",
                  content: value
                };
                res.json(result);
              })
              .catch(error => {
                let result = {
                  status: "按讚失敗",
                  err: "伺服器錯誤，請稍後再試"
                };
                res.json(error);
              })
          })
          .catch(error => {
            console.log("未找到userID");
          });
      })
      .catch(error => {
        console.log(error);
      });
  }

  dislikesArticle(req, res, next) {
    let likesArray = [];
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        //所有的likes先放置Array中
        for (let i = 0; i < doc.likes.length; i++) {
          likesArray.push(doc.likes[i].userID);
            if (doc.likes[i].userID === req.body.dislikesPersonID && likesArray.indexOf(req.body.dislikesPersonID) != -1) {
              let temp = likesArray.indexOf(req.body.dislikesPersonID);
              doc.likes.splice(temp, 1);
              doc.numberOfLikes = doc.likes.length;
            }
        }

        doc.save()
          .then(value => {
            let result = {
              status: "收回讚成功",
              content: value
            };
            res.json(result);
          })
          .catch(error => {
            let result = {
              status: "收回讚失敗",
              err: "伺服器錯誤，請稍後再試"
            };
            res.json(error);
          })
      })
      .catch(err => {
        console.log(err)
      });
  }

  commentArticle(req, res, next) {
    let commentArrayForListOfComment = [];
    let commentObjForListOfComment  = {};
    let forComment = {};
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      let id = uniqid();
      forComment.id = id;
      commentObjForListOfComment.time = seconds;
      commentObjForListOfComment.content = fields.content;
      commentArrayForListOfComment.push(commentObjForListOfComment);

      forComment.commenterID = fields.commenterID;
      forComment.likes = [];
      forComment.commenter_avatarLink = [];
      forComment.numberOfLikes = forComment.likes.length;
      forComment.delete = false;
      forComment.commenterName = "";
      let mediaArray =[];

      //留言圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj);

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;

          mediaArray.push(videoObj);
          commentObjForListOfComment.mediaLink = mediaArray;
          forComment.listOfComment = commentArrayForListOfComment;


            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
                userSchemaModel.findOne({_id:fields.commenterID})
                  .then(user=> {
                    forComment.commenterName = user.userName;

                doc.comment.push(forComment);

                //發通知
                let notificationObject = {
                  title: "留言通知",
                  body: fields.commenterName + " 在您的文章中留言"
                };

                //取得B的token
                profileSchemaModel.findOne({userID: doc.authorID})
                  .then(profile_data => {
                    let notificationToken = profile_data.notificationToken[0];
                    sendNotification(notificationToken, notificationObject);
                    profile_data.notification.push(notificationObject);
                    profile_data.save()
                  })
                  .catch(err => {
                    console.log(err);
                  })

                doc.save()
                  .then(value => {
                    let result = {
                      status: "圖片和影片留言成功",
                      article: value
                    };
                    res.json(result)
                  })
                  .catch(error => res.json(error));
                 })
                  .catch(error => res.json(error));
              }, {resource_type: "video"});
          }, {folder: 'Social_Media/mediaLink'});
       })


        //留言圖片
      } else if (files.image != undefined && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj);
          commentObjForListOfComment.mediaLink = mediaArray;
          forComment.listOfComment = commentArrayForListOfComment;

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              userSchemaModel.findOne({_id:fields.commenterID})
                .then(user=> {
                  forComment.commenterName = user.userName;

              doc.comment.push(forComment);

              //發通知
              let notificationObject = {
                title: "留言通知",
                body: forComment.commenterName + "在您的文章中留言"
              };

              //取得B的token
              profileSchemaModel.findOne({userID: doc.authorID})
                .then(profile_data => {
                  let notificationToken = profile_data.notificationToken[0];
                  sendNotification(notificationToken, notificationObject);
                  profile_data.notification.push(notificationObject);
                  profile_data.save()
                })
                .catch(err => {
                  console.log(err);
                })

              doc.save()
                .then(value => {
                  let result = {
                    status: "圖片留言成功",
                    article: value
                  };
                  res.json(result);
                })
                .catch(error => res.json(error));
              })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //留言影片
      }else if (files.image == null && files.video != null){
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType;
          videoObj.link = resultVideoUrl.secure_url;
          mediaArray.push(videoObj);
          commentObjForListOfComment.mediaLink = mediaArray;
          forComment.listOfComment = commentArrayForListOfComment;

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              userSchemaModel.findOne({_id:fields.commenterID})
                .then(user=>{
                  forComment.commenterName = user.userName;

              doc.comment.push(forComment);

              //發通知
              let notificationObject = {
                title: "留言通知",
                body: forComment.commenterName + "在您的文章中留言"
              };

              //取得B的token
              profileSchemaModel.findOne({userID: doc.authorID})
                .then(profile_data => {
                  let notificationToken = profile_data.notificationToken[0];
                  sendNotification(notificationToken, notificationObject);
                  profile_data.notification.push(notificationObject);
                  profile_data.save()
                })
                .catch(err => {
                  console.log(err);
                })

              doc.save()
                .then(value => {
                  let result = {
                    status: "影片留言成功",
                    article: value
                  };
                  res.json(result)
                })
                .catch(error => res.json(error));
              })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //只留言文字
      } else if (files.image == null && files.video == null) {
        forComment.listOfComment = commentArrayForListOfComment;

        articleSchemaModel.findOne({_id: fields.articleID})
          .then(doc => {
            userSchemaModel.findOne({_id:fields.commenterID})
              .then(user=> {
                forComment.commenterName = user.userName;
                doc.comment.push(forComment);

                //發通知
                let notificationObject = {
                  title: "留言通知",
                  body: forComment.commenterName + "在您的文章中留言"
                };

                //取得B的token
                profileSchemaModel.findOne({userID: doc.authorID})
                  .then(profile_data => {
                    let notificationToken = profile_data.notificationToken[0];
                    sendNotification(notificationToken, notificationObject);
                    profile_data.notification.push(notificationObject);
                    profile_data.save()
                  })
                  .catch(err => {
                    console.log(err);
                  })


                doc.save()
                  .then(value => {
                    let result = {
                      status: "留言成功",
                      content: value
                    };
                    res.json(result);
                  })
                  .catch(error => {
                    let result = {
                      status: "留言失敗",
                      err: "伺服器錯誤，請稍後再試"
                    };
                    res.json(error);
                  })
          .catch(error => res.json(error));
          })
        })
      }
    })
  }


  likesComment(req, res, next) {
    let objForLikes = {};
    let likesArray = [];
    articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        userSchemaModel.findOne({_id: req.body.likesPersonID})
          .then(user => {
            for (let i = 0; i < doc.comment.length; i++) {
              //先將目前的userID放入likesArray中
              for (let j = 0 ;j < doc.comment[i].likes.length; j++) {
                if (doc.comment[i].id === req.body.commentID) {
                  likesArray.push(doc.comment[i].likes[j].userID);
                }
              }

              if (doc.comment[i].id === req.body.commentID && likesArray.indexOf(req.body.likesPersonID) == -1  ) {
                objForLikes.userName = user.userName;
                objForLikes.userID = req.body.likesPersonID;
                objForLikes.avatarLink = user.avatarLink;
                doc.comment[i].likes.push(objForLikes);
                doc.comment[i].numberOfLikes = doc.comment[i].likes.length;
                doc.comment.set(i, doc.comment[i]);

                //發通知
                let notificationObject = {
                  title: "留言按讚通知",
                  body: user.userName + " 覺得您的留言讚"
                };

                //取得B的token
                profileSchemaModel.findOne({userID: doc.authorID})
                  .then(profile_data => {
                    let notificationToken = profile_data.notificationToken[0];
                    sendNotification(notificationToken, notificationObject);
                    profile_data.notification.push(notificationObject);
                    profile_data.save()
                  })
                  .catch(err => {
                    console.log(err);
                  })
              }
            }
            doc.save()
              .then(value => {
                let result = {
                  status: "按讚成功",
                  content: value
                };
                res.json(result);
              })
              .catch(error => {
                let result = {
                  status: "按讚失敗",
                  err: "伺服器錯誤，請稍後再試"
                };
                res.json(error);
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

  dislikesComment(req, res, next) {
    let temp = 0;
    let likesArray = [];
    articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        for (let i = 0; i < doc.comment.length; i++) {
          //先將目前likes的userID放入likesArray中
          for (let j = 0; j < doc.comment[i].likes.length; j++) {
            likesArray.push(doc.comment[i].likes[j].userID);
          }
          if (doc.comment[i].id === req.body.commentID && likesArray.indexOf(req.body.dislikesPersonID) != -1 ) {
            let temp = likesArray.indexOf(req.body.dislikesPersonID);
            doc.comment[i].likes.splice(temp, 1);
            doc.comment[i].numberOfLikes = doc.comment[i].likes.length;
            //array.set(第幾個元素,內容)
            doc.comment.set(i, doc.comment[i])
          }
        }

        doc.save()
          .then(value => {
            let result = {
              status: "取消讚成功",
              content: value
            };
            res.json(result);
          })
          .catch(error => {
            let result = {
              status: "取消讚失敗",
              err: "伺服器錯誤，請稍後再試"
            };
            res.json(error)
          })
      })
      .catch(err => {
        console.log(err);
      })
  }


  updateComment(req, res ,next) {
    let updateCommentArrayForListOfComment = [];
    let updateCommentObjForListOfComment = {};
    let updateForMedialink = [];
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);
    let mediaArray=[];

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      updateCommentObjForListOfComment.time = seconds;
      updateCommentObjForListOfComment.content = fields.content;
      updateCommentArrayForListOfComment.push(updateCommentObjForListOfComment);

      //修改留言的圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;

            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
                for (let i = 0; i < doc.comment.length; i++) {
                  if (doc.comment[i].id == fields.commentID) {
                    updateForMedialink.push(photoObj);
                    updateForMedialink.push(videoObj);
                    updateCommentObjForListOfComment.mediaLink = updateForMedialink
                    doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                  }
                  doc.comment.set(i, doc.comment[i]);
                }

                doc.save()
                  .then(value => {
                    let result = {
                      status: "修改圖片和影片留言成功",
                      article: value
                    };
                    res.json(result)
                  })
                  .catch(error => res.json(error));
              })
          }, {resource_type: "video"});
        }, {folder: 'Social_Media/mediaLink'});

        //修改留言圖片
      } else if (files.image != undefined && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;

          mediaArray.push(photoObj)
          updateCommentObjForListOfComment.mediaLink = mediaArray;

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              for (let i = 0; i < doc.comment.length; i++) {
                if (doc.comment[i].id == fields.commentID ) {
                  doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                }
                // if ( doc.comment[i].listOfComment != null) doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                doc.comment.set(i, doc.comment[i])
              }


              doc.save()
                .then(value => {
                  let result = {
                    status: "修改圖片留言成功",
                    article: value
                  };
                  res.json(result)
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //修改影片
      } else if (files.image == null && files.video != null) {
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType;
          videoObj.link = resultVideoUrl.secure_url;

          mediaArray.push(videoObj);
          updateCommentObjForListOfComment.mediaLink = mediaArray
          //updateCommentArrayForListOfComment.push(updateCommentObjForListOfComment);
         console.log(updateCommentObjForListOfComment);
          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              for (let i = 0; i < doc.comment.length; i++) {
                if (doc.comment[i].id == fields.commentID && doc.comment[i].listOfComment != null) {
                  //doc.comment[i].mediaLink = videoObj
                  doc.comment[i].listOfComment = updateCommentArrayForListOfComment;
                  doc.comment.set(i, doc.comment[i]);
                }
              }

              doc.save()
                .then(value => {
                  let result = {
                    status: "影片留言成功",
                    article: value
                  };
                  res.json(result);
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //修改文字
      } else if (files.image == null && files.video == null) {
        articleSchemaModel.findOne({_id: fields.articleID})
          .then(doc => {
            for (let i = 0; i < doc.comment.length; i++) {
              if (doc.comment[i].id == fields.commentID) {
                doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                doc.comment.set(i, doc.comment[i])
              }
            }

            doc.save().then(value => {
                let result = {
                  status: "留言修改成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => res.json(error));
          })
      }
    })
  }

  deleteComment(req, res, next){
   articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        for (let i = 0 ; i < doc.comment.length;i++) {
          if (doc.comment[i].id == req.body.commentID) {
            doc.comment.splice(i, 1);
          }
        }

        doc.save().then(value => {
          let result = {
            status: "刪除成功",
            content: value
          };
          res.json(result);
        })
          .catch(error => {
            let result = {
              status: "刪除失敗",
              err: "伺服器錯誤，請稍後再試"
            };
            res.json(error);
          })
       })
  }
}

