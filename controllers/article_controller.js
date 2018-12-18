const articleSchemaModel = require('../models/article_model.js');
const profileSchemaModel = require('../models/profile_model.js');
const userSchemaModel = require('../models/user_model.js');
//const profileArray = require('./users_controller.js').profileArray;
const uniqid = require('uniqid');
const formidable = require('formidable');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: 'dzzdz1kvr',
  api_key: '154653594993876',
  api_secret: 'pzNTrLGj6HJkE6QGAUeJ2cyBxAE'
})


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

      let mediaArray =[]
      //上傳圖片及照片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType; //png
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj)

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;
            mediaArray.push(videoObj)
            contentForObject.mediaLink = mediaArray;
            contentForArray.push(contentForObject);
            article.listOfContent = contentForArray;

            if(article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
              article.save()
                .then(posts => {
                  let result = {
                    status: "圖片和影片發文成功",
                    article: posts
                  }
                  res.json(result)
                })
                .catch(error => res.json(error))
            } else {
              let result = {
                status: "發文失敗",
                err: "請輸入作者ID"
              }
               res.json(result);
            }

          }, {resource_type: "video"});
        }, {folder: 'Social_Media/mediaLink'});

        //上傳圖片
      } else if (files.image != null && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType; //png
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj)
          contentForObject.mediaLink = mediaArray;
          contentForArray.push(contentForObject);
          article.listOfContent = contentForArray;

          if(article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
            article.save()
              .then(posts => {
                let result = {
                  status: "圖片發文成功",
                  article: posts
                }
                res.json(result)
              })
              .catch(error => res.json(error))
          } else {
            let result = {
              status: "發文失敗",
              err: "請輸入作者ID"
            }
            res.json(result);
          }
        }, {folder: 'Social_Media/mediaLink'});

        //上傳影片
      } else if (files.image == null && files.video != null) {
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType; //mp4
          videoObj.link = resultVideoUrl.secure_url;
          mediaArray.push(videoObj)
          contentForObject.mediaLink = mediaArray;
          contentForArray.push(contentForObject);
          article.listOfContent = contentForArray;

          if(article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
            article.save()
              .then(posts => {
                let result = {
                  status: "影片發文成功",
                  article: posts
                }
                res.json(result)
              })
              .catch(error => res.json(error))
          } else {
            let result = {
              status: "發文失敗",
              err: "請輸入作者ID"
            }
            res.json(result);
          }
        }, {resource_type: "video"});

      } else if (files.image == null && files.video == null) {
        contentForArray.push(contentForObject);
        article.listOfContent = contentForArray;

        if(article.authorID && (article.authorID !== null) && (article.authorID !== undefined)) {
          article.save()
            .then(posts => {
              let result = {
                status: "發文成功",
                article: posts
              }
              res.json(result)
            })
            .catch(error => res.json(error))
        } else {
          let result = {
            status: "發文失敗",
            err: "請輸入作者ID"
          }
          res.json(result);
        }
      }
    })
  }



  async searchArticleByArticleID(req, res, next) {
    let articleArray = []
    let articleOne = await articleSchemaModel.findOne({delete: false, _id: req.body.articleID, privacy: "public"}).exec()
    articleArray.push(articleOne);
    res.json(articleArray)
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

            let terminateNumber = sortedArticle.length < (req.body.count * 10)- 1 ? sortedArticle.length : (req.body.count * 10)- 1;
            for(let i = (req.body.count * 10 - 1)- 9; i <= terminateNumber; i++) {
              //找centerArticle
              let articleObj = {};

              //將所有的分類放到categoryArray中，若已在該分類中則不列入centerArticle
              if (categoryArray.indexOf(sortedArticle[i].category) == -1) {
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
                else if(authorAvatarLink.length > 1) {
                  sortedArticle[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length-1])
                }

                //新增留言大頭貼
                if(sortedArticle[i].comment != null) {
                  for (let j = 0; j < sortedArticle[i].comment.length; j++){
                    let commentAvatarLink = authorToAvatarLink(sortedArticle[i].comment[j].commenterID)
                    if (commentAvatarLink.length == 1 || commentAvatarLink.length == 0) {
                      sortedArticle[i].comment[j].commenter_avatarLink = commentAvatarLink
                    }
                    else if(commentAvatarLink.length > 1) {
                      sortedArticle[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length-1])
                    }
                  }
                }
              }

              //找sameCategory的文章
              for (let j = 0; j < centerArray.length; j++) {
                if (sortedArticle[i].category === centerArray[j].centerArticle.category && sortedArticle[i].id !== centerArray[j].centerArticle.id && centerArray[j].sameCategory.length < 5 ) {
                  centerArray[j].sameCategory.push(sortedArticle[i])

                  //新增文章大頭貼
                  let authorAvatarLink = authorToAvatarLink(sortedArticle[i].authorID);
                  if (authorAvatarLink.length == 1) {
                    sortedArticle[i].avatarLink = authorAvatarLink
                  }
                  else if(authorAvatarLink.length > 1) {
                    sortedArticle[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length-1])
                  }

                  //新增留言大頭貼
                  if(sortedArticle[i].comment != null) {
                    for (let j = 0; j < sortedArticle[i].comment.length; j++){
                      //console.log(sortedArticle[i].comment[j].id)
                      let commentAvatarLink = authorToAvatarLink(sortedArticle[i].comment[j].commenterID)
                      if (commentAvatarLink.length == 1 || commentAvatarLink.length == 0) {
                        sortedArticle[i].comment[j].commenter_avatarLink = commentAvatarLink
                      }
                      else if(commentAvatarLink.length > 1) {
                        sortedArticle[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length-1])
                      }
                    }
                  }
                }

                //找sameAuthor的文章
                if (sortedArticle[i].author === centerArray[j].centerArticle.author && sortedArticle[i].id !== centerArray[j].centerArticle.id && centerArray[j].sameAuthor.length < 5) {
                  centerArray[j].sameAuthor.push(sortedArticle[i]);
                  //新增文章大頭貼
                  let authorAvatarLink = authorToAvatarLink(sortedArticle[i].authorID);
                  if (authorAvatarLink.length == 1) {
                    sortedArticle[i].avatarLink = authorAvatarLink
                  }
                  else if(authorAvatarLink.length > 1) {
                    sortedArticle[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length-1])
                  }

                  //新增留言大頭貼
                  if(sortedArticle[i].comment != null) {
                    for (let j = 0; j < sortedArticle[i].comment.length; j++){
                      let commentAvatarLink = authorToAvatarLink(sortedArticle[i].comment[j].commenterID)
                      if (commentAvatarLink.length == 1 || commentAvatarLink.length == 0) {
                        sortedArticle[i].comment[j].commenter_avatarLink = commentAvatarLink
                      }
                      else if(commentAvatarLink.length > 1) {
                        sortedArticle[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length-1])
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
              let friendsArticle =[];
              for(let i = 0; i < profile.length; i++) {
                //profile.friends型態是陣列，所以用==
                if(userID == profile[i].userID) {
                  //撈出所有好友的ID console.log(profile[i].friends)
                  //在撈出好友的文章
                  for(let j = 0; j < article.length; j++) {
                    for (let friendsID of profile[i].friends) {
                      if(article[j].authorID === friendsID) {
                        friendsArticle.push(article[j])
                      }
                    }
                  }
                }
              }
              return friendsArticle;
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
              for(let i = 0; i < profile.length; i++) {
                //profile.friends型態是陣列，所以用==
                if(userID == profile[i].userID) {
                  //撈出所有好友的ID console.log(profile[i].friends)
                  //再撈出好友的文章
                  for(let j = 0; j < article.length; j++) {
                    for (let friendsID of profile[i].friends) {
                      if(article[j].authorID === friendsID) {
                        friendsArticle.push(article[j])
                      }
                    }
                  }
                }
              }
              return friendsArticle;
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
            for (let i = 0; i < sortedArticle.length; i++) {

              if (sortedArticle[i].authorID === req.body.authorID) {
                existArticleIDArray = searchExistedArticleID(req.body.authorID);
              }
            }


            //已存在之全部的文章ID
            let allArticleID = req.body.articleIDInSameAuthor;
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


  //待修
  updateArticle(req, res, next) {
    let updateObj = {};
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      updateObj.time = seconds;
      updateObj.content = fields.content;

      let mediaArray=[]
      // 修改圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj)

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType; //mp4
            videoObj.link = resultVideoUrl.secure_url;
            mediaArray.push(videoObj)
            updateObj.mediaLink = mediaArray

            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
                doc.listOfContent.push(updateObj);
                // doc.mediaLink.push(photoObj);
                // doc.mediaLink.push(videoObj);
                if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
                if (fields.category != null) doc.category = fields.category
                if (fields.title!= null) doc.title = fields.title
                if (fields.hashTags != null) doc.hashTags = fields.hashTags

                doc.save()
                  .then(posts => {
                    let result = {
                      status: "圖片和影片修改成功",
                      article: posts
                    }
                    res.json(result)
                  })
                  .catch(error => res.json(error));
              })
              .catch(error => res.json(error));
          }, {resource_type: "video"});
        }, {folder: 'Social_Media/mediaLink'});

        //修改圖片
      } else if (files.image != null && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj)
          updateObj.mediaLink = mediaArray

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.listOfContent.push(updateObj);
              //doc.mediaLink.push(photoObj);
              if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
              if (fields.category != null) doc.category = fields.category
              if (fields.title!= null) doc.title = fields.title
              if (fields.hashTags != null) doc.hashTags = fields.hashTags

              doc.save()
                .then(posts => {
                  let result = {
                    status: "圖片修改成功",
                    article: posts
                  }
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
          mediaArray.push(videoObj)
          updateObj.mediaLink = mediaArray

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.listOfContent.push(updateObj);
              //doc.mediaLink.push(videoObj);
              if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
              if (fields.category != null) doc.category = fields.category
              if (fields.title!= null) doc.title = fields.title
              if (fields.hashTags != null) doc.hashTags = fields.hashTags

              doc.save()
                .then(posts => {
                  let result = {
                    status: "影片修改成功",
                    article: posts
                  }
                  res.json(result)
                })
                .catch(error => res.json(error));
            })
            .catch(error => res.json(error));
        }, {folder: 'Social_Media/mediaLink'});

        //修改文字
      } else if (files.image == null && files.video == null) {
        articleSchemaModel.findOne({_id: fields.articleID})
          .then(doc => {
            doc.listOfContent.push(updateObj);
            if (fields.privacy != null) doc.privacy = fields.privacy;
            if (fields.category != null) doc.category = fields.category;
            if (fields.title!= null) doc.title = fields.title;
            if (fields.hashTags != null) doc.hashTags = fields.hashTags;

            doc.save()
              .then(value => {
                let result = {
                  status: "發文修改成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => res.json(error));
          })
      }
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
          }
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
  }

  likesArticle(req, res, next) {
    let objForLikes = {};
    let likesArray = [];
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        userSchemaModel.findOne({_id: req.body.likesPersonID})
          .then(user => {
            for(let i = 0; i < doc.likes.length; i++) {
              likesArray.push(doc.likes[i].userID);
            }
            if(likesArray.indexOf(req.body.likesPersonID) == -1) {
              objForLikes.userName = user.userName;
              objForLikes.userID = req.body.likesPersonID;
              objForLikes.avatarLink = user.avatarLink;
              doc.likes.push(objForLikes);
              doc.numberOfLikes = doc.likes.length;
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
                res.json(error)
              })
          })
          .catch(error => {
            console.log("未找到userID")
          });
      })
      .catch(error => {
        console.log(error)
      });
  }

  dislikesArticle(req, res, next) {
    let likesArray = [];
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        //所有的likes先放置Array中
        for(let i = 0; i < doc.likes.length; i++) {
          likesArray.push(doc.likes[i].userID);

          if(doc.likes[i].userID === req.body.dislikesPersonID && likesArray.indexOf(req.body.dislikesPersonID) != -1) {
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
            }
            res.json(result);
          })
          .catch(error => {
            let result = {
              status: "收回讚失敗",
              err: "伺服器錯誤，請稍後再試"
            }
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

      forComment.commenterID = fields.commenterID
      forComment.likes = [];
      forComment.commenter_avatarLink = [];
      forComment.numberOfLikes = forComment.likes.length;
      forComment.delete = false;
      forComment.commenterName = "";
      let mediaArray =[]
      //留言圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          mediaArray.push(photoObj)

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;


            mediaArray.push(videoObj)
            commentObjForListOfComment.mediaLink = mediaArray;
            forComment.listOfComment = commentArrayForListOfComment;


            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
                userSchemaModel.findOne({_id:fields.commenterID})
                  .then(user=>{
                    forComment.commenterName = user.userName

                doc.comment.push(forComment)
                doc.save()
                  .then(value => {
                    let result = {
                      status: "圖片和影片留言成功",
                      article: value
                    }
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
          mediaArray.push(photoObj)
          commentObjForListOfComment.mediaLink = mediaArray;
          forComment.listOfComment = commentArrayForListOfComment;

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              userSchemaModel.findOne({_id:fields.commenterID})
                .then(user=>{
                  forComment.commenterName = user.userName

              doc.comment.push(forComment)
              doc.save()
                .then(value => {
                  let result = {
                    status: "圖片留言成功",
                    article: value
                  }
                  res.json(result)
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
          mediaArray.push(videoObj)
          commentObjForListOfComment.mediaLink = mediaArray;
          forComment.listOfComment = commentArrayForListOfComment;

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              userSchemaModel.findOne({_id:fields.commenterID})
                .then(user=>{
                  forComment.commenterName = user.userName

              doc.comment.push(forComment)
              doc.save()
                .then(value => {
                  let result = {
                    status: "影片留言成功",
                    article: value
                  }
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
              .then(user=>{
                forComment.commenterName = user.userName
                doc.comment.push(forComment);

            doc.save()
              .then(value => {
                let result = {
                  status: "留言成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => {
                let result = {
                  status: "留言失敗",
                  err: "伺服器錯誤，請稍後再試"
                }
                res.json(error)
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
                  console.log(doc.comment[i].likes[j].userID);
                  likesArray.push(doc.comment[i].likes[j].userID);
                  console.log(likesArray)
                }
              }

              if (doc.comment[i].id === req.body.commentID && likesArray.indexOf(req.body.likesPersonID) == -1  ) {
                objForLikes.userName = user.userName;
                objForLikes.userID = req.body.likesPersonID;
                objForLikes.avatarLink = user.avatarLink;
                doc.comment[i].likes.push(objForLikes);
                doc.comment[i].numberOfLikes = doc.comment[i].likes.length;
                doc.comment.set(i, doc.comment[i]);
              }
            }
            doc.save()
              .then(value => {
                let result = {
                  status: "按讚成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => {
                let result = {
                  status: "按讚失敗",
                  err: "伺服器錯誤，請稍後再試"
                }
                res.json(error)
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
            }
            res.json(result);
          })
          .catch(error => {
            let result = {
              status: "取消讚失敗",
              err: "伺服器錯誤，請稍後再試"
            }
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
    let mediaArray=[]

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
                    updateForMedialink.push(photoObj)
                    updateForMedialink.push(videoObj)
                    updateCommentObjForListOfComment.mediaLink = updateForMedialink
                    doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                  }
                  doc.comment.set(i, doc.comment[i])
                }

                doc.save()
                  .then(value => {
                    let result = {
                      status: "修改圖片和影片留言成功",
                      article: value
                    }
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
          updateCommentObjForListOfComment.mediaLink = mediaArray

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
                  }
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

          mediaArray.push(videoObj)
          updateCommentObjForListOfComment.mediaLink = mediaArray
          //updateCommentArrayForListOfComment.push(updateCommentObjForListOfComment);
         console.log(updateCommentObjForListOfComment)
          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              for (let i = 0; i < doc.comment.length; i++) {
                if (doc.comment[i].id == fields.commentID && doc.comment[i].listOfComment != null) {
                  //doc.comment[i].mediaLink = videoObj
                  doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                  doc.comment.set(i, doc.comment[i])
                }
              }

              doc.save()
                .then(value => {
                  let result = {
                    status: "影片留言成功",
                    article: value
                  }
                  res.json(result)
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
            console.log(doc.comment)

            doc.save().then(value => {
                let result = {
                  status: "留言修改成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => res.json(error))

          })
      }
    })
  }

  deleteComment(req, res, next){
   articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        //console.log(doc)
        for (let i = 0 ; i < doc.comment.length;i++) {
          if(doc.comment[i].id == req.body.commentID) {
            doc.comment.splice(i, 1);
          }
        }

        doc.save().then(value => {
          let result = {
            status: "刪除成功",
            content: value
          }
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
  }
}

