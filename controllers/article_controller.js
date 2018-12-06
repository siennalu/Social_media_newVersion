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
        //countForArticle: Number,
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

            article.save()
              .then(posts => {
                let result = {
                  status: "圖片和影片發文成功",
                  article: posts
                }
                res.json(result)
              })
              .catch(error => res.json(error));
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

          article.save()
            .then(posts => {
              let result = {
                status: "圖片發文成功",
                article: posts
              }
              res.json(result)
            })
            .catch(error => res.json(error));
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

          article.save()
            .then(posts => {
              let result = {
                status: "影片發文成功",
                article: posts
              }
              res.json(result)
            })
            .catch(error => res.json(error));
        }, {resource_type: "video"});

      } else if (files.image == null && files.video == null) {
        contentForArray.push(contentForObject);
        article.listOfContent = contentForArray;

        article.save()
          .then(posts => {
            let result = {
              status: "發文成功",
              article: posts
            }
            res.json(result)
          })
          .catch(error => res.json(error));
      }
    })
  }

  searchArticle(req, res, next) {
    profileSchemaModel.find({})
      .then(all_profile=> {
        //console.log(all_profile)
       articleSchemaModel.find({delete: false, privacy: "public"})
          .then(all_article => {
            for (let i = 0; i <= all_article.length - 1; i++){
              let authorAvatarLink = commenterIDToAvatarLink(all_article[i].authorID)
              all_article[i].avatarLink.push(authorAvatarLink[0])
            }

            for(let i = 0; i < all_article.length; i++){
              for(let j = 0; j < all_article[i].comment.length; j++){

                let commenterAvatarLink = commenterIDToAvatarLink(all_article[i].comment[j].commenterID);
               // all_article[i].comment[j].commenter_avatarLink.set(all_article[i].comment[j].commenter_avatarLink.length,commenterAvatarLink )
                //console.log(commenterAvatarLink[0])
                all_article[i].comment[j].commenter_avatarLink.push(commenterAvatarLink[0]);
              }
            }

            // input: commenterID, output: avatarLink
            function commenterIDToAvatarLink(id){
              for(let i = 0; i < all_profile.length; i++){
                if(id == all_profile[i].userID){
                  return all_profile[i].avatarLink;
                }
              }
            }

            let sortedArticle = all_article.sort(function (b, a) {
              return a.listOfContent[a.listOfContent.length - 1].time - b.listOfContent[b.listOfContent.length - 1].time;
            });
            res.json(sortedArticle);
          })
      })


  }

  async searchArticleByArticleID(req, res, next) {
    let articleArray = []
    let articleOne = await articleSchemaModel.findOne({delete: false, _id: req.body.articleID, privacy: "public"}).exec()
    articleArray.push(articleOne);
    res.json(articleArray)
  }

  searchArticleByCategory(req, res, next) {
    let categoryArray =[]
    let articleArray=[]
    let allArticleArray=[]

    articleSchemaModel.find({delete: false, privacy: "public"})
      .then(doc=> {
        profileSchemaModel.find({})
          .then(all_profile => {
        //文章排序
        let sortedArticle = doc.sort(function (b, a) {
          return a.listOfContent[a.listOfContent.length - 1].time - b.listOfContent[b.listOfContent.length - 1].time;
        });

        let final = [];
        let terminateNumber = (sortedArticle.length < (req.body.count * 10 - 1)) ? sortedArticle.length - 1 : (req.body.count * 10 - 1);
        for (let i = ((req.body.count * 10 - 1) - 9); i <= terminateNumber; i++) {

          //文章大頭貼
          let authorAvatarLink = commenterIDToAvatarLink(sortedArticle[i].authorID)
          sortedArticle[i].avatarLink = authorAvatarLink
          // if (authorAvatarLink.length == 1) sortedArticle[i].avatarLink = authorAvatarLink
          // else if(authorAvatarLink.length > 1) {
          //   sortedArticle[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length-1])
          // }

          //留言大頭貼
          if(sortedArticle[i].comment != null){
            for (let j = 0; j < sortedArticle[i].comment.length; j++){
              //console.log(sortedArticle[i].comment[j].id)
              let commentAvatarLink = commenterIDToAvatarLink(sortedArticle[i].comment[j].commenterID)
              if (commentAvatarLink.length == 1) {
                sortedArticle[i].comment[j].commenter_avatarLink = commentAvatarLink
              }
              else if(commentAvatarLink.length > 1) {
                sortedArticle[i].comment[j].commenter_avatarLink.push(commentAvatarLink[commentAvatarLink.length-1])
              }
            }
          }
          //console.log(sortedArticle[i].category);
          final[i - ((req.body.count * 10 - 1) - 9)] = searchSameCategory(sortedArticle[i].category, sortedArticle[i]);
          final[i - ((req.body.count * 10 - 1) - 9)].unshift(sortedArticle[i]);
        }


        function searchSameCategory(category, itself) {
          let res = [];
          for (let i = 0; i < sortedArticle.length; i++) {
            if (category === sortedArticle[i].category && sortedArticle[i] !== itself) {
              res.push(sortedArticle[i]);
            }
          }
          return res;
        }

        function commenterIDToAvatarLink(id) {
          for (let i = 0; i < all_profile.length; i++) {
            if (id == all_profile[i].userID) {
              //console.log(all_profile[i].avatarLink)
              return all_profile[i].avatarLink;
            }
          }
        }
          res.json(final)
       })
      })
  }

        // //console.log(sortedArticle.length)
        // //載入最新的10篇文章
        // for(let i=0;i<10;i++) {
        //   //console.log(doc[i])
        //   articleArray.push(doc[i])
        //
        //   //console.log(articleArray[0])
        //
        //   //需修改
        //   //再各自陣列中找出分類
        //   if (sortedArticle[i].category == doc[i].category && articleArray.indexOf(doc[i]._id) ==-1) {
        //     //console.log("123")
        //     articleArray.push(doc[i])
        //     //console.log(articleArray[0])
        //     //console.log(articleArray.indexOf(doc[0]._id))
        //   }
        //
        //   //console.log(articleArray)
        //   empty()
        //  //console.log(sortedArticle[i].category)
        // }
        //
        //
        //
        // // for(let i=0;i<doc.length;i++) {
        // //
        // //
        // //
        // //   //選10篇文章各category的分類
        // //   if (categoryArray.indexOf(doc[i].category) == -1) categoryArray.push(doc[i].category)
        // // }
        // //
        // // for (let category in categoryArray){
        // //   for (let i = 0; i < doc.length; i++) {
        // //     //console.log(categoryArray.length)
        // //      //相同的分類放至陣列中
        // //     if (categoryArray[category] == doc[i].category && articleOfArray.indexOf(doc[i]) == -1) {
        // //       articleOfArray.push(doc[i])
        // //       console.log(categoryArray.length) //3 有3種分類
        // //     }
        // //
        // //    }
        // //    allArticleArray.push(articleOfArray)
        // //    empty()
        // //  }
        // //
        // //
        // //  res.json(allArticleArray)
        // //
        //  //清空陣列
        //  function empty(){
        //   articleArray=[]
        //
        //  }


  //撈五篇文章
  searchMoreArticlesByCategory(req, res, next) {
  articleSchemaModel.find({delete: false, privacy: "public"})
    .then(doc=> {
      profileSchemaModel.find({})
        .then(all_profile => {
          //根據分類給文章
          let allArticleArray = [];
          let getFiveArticles = [];
          let getSortedArticles = [];
          for (let i = 0; i < doc.length; i++) {
            if (doc[i].category === req.body.category) {
              allArticleArray = searchCategory(req.body.category)
            }
          }

          //已存在之全部的文章ID
          let allArticleID = req.body.articleID
          for (let j = 0; j < allArticleArray.length; j++) {
            if (allArticleID.indexOf(allArticleArray[j].id) == -1 && getFiveArticles.length < 5)
              getFiveArticles.push(allArticleArray[j])


            //文章排序
            getSortedArticles = getFiveArticles.sort(function (b, a) {
              return a.listOfContent[a.listOfContent.length - 1].time - b.listOfContent[b.listOfContent.length - 1].time;
            });

            for (let i = 0; i < getFiveArticles.length; i++) {
              if (getFiveArticles[i] != null) {
                //文章大頭貼
                let authorAvatarLink = commenterIDToAvatarLink(getFiveArticles[i].authorID)
                if (authorAvatarLink.length == 1) getFiveArticles[i].avatarLink = authorAvatarLink
                else if (authorAvatarLink.length > 1) {
                  getFiveArticles[i].avatarLink.push(authorAvatarLink[authorAvatarLink.length - 1])
                }

            //留言大頭貼
              if(getFiveArticles[i].comment != null){
                for (let j = 0; j < getFiveArticles[i].comment.length; j++){
                  //console.log(sortedArticle[i].comment[j].id)
                  let commentAvatarLink = commenterIDToAvatarLink(getFiveArticles[i].comment[j].commenterID)
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

          res.json(getSortedArticles);


          function searchCategory(category) {
            let articleArray = []
            for (let j = 0; j < doc.length; j++) {
              if (category === doc[j].category && articleArray.indexOf(doc[j].id) == -1) {
                articleArray.push(doc[j])
              }
            }
            return articleArray
          }


          function commenterIDToAvatarLink(id) {
            for (let i = 0; i < all_profile.length; i++) {
              if (id == all_profile[i].userID) {
                return all_profile[i].avatarLink;

              }
            }
          }


      })
    })
  }


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
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        if (doc.likes.indexOf(req.body.likesPersonID) == -1) {
          doc.likes.push(req.body.likesPersonID);
          doc.numberOfLikes = doc.likes.length;
        }
        doc.save().then(value => {
          let result = {
            status: "已按讚",
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
  }

  dislikesArticle(req, res, next) {
    articleSchemaModel.findOne({ _id: req.body.articleID})
      .then(doc => {
        let temp = doc.likes.indexOf(req.body.dislikesPersonID);
        doc.likes.splice(temp, 1);
        doc.numberOfLikes = doc.likes.length;
        doc.save().then(value => {
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
            res.json(error)
          })
      })
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
          })
        })
      }

    })
  }


  likesComment(req, res, next) {
    articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        for (let i = 0; i < doc.comment.length; i++) {
          if (doc.comment[i].id === req.body.commentID && doc.comment[i].likes.indexOf(req.body.likesPersonID) == -1)
            doc.comment[i].likes.push(req.body.likesPersonID);
            doc.comment[i].numberOfLikes = doc.comment[i].likes.length;
            doc.comment.set(i, doc.comment[i])
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
  }

  dislikesComment(req, res, next) {
    let temp = 0
    articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        for (let i = 0; i < doc.comment.length; i++) {
          if (doc.comment[i].id == req.body.commentID && doc.comment[i].likes.indexOf(req.body.dislikesPersonID) != -1){
              temp = doc.comment[i].likes.indexOf(req.body.dislikesPersonID);
              doc.comment[i].likes.splice(temp, 1);
              doc.comment[i].numberOfLikes = doc.comment[i].likes.length;
            }
          //array.set(第幾個元素,內容)
          doc.comment.set(i, doc.comment[i])
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

