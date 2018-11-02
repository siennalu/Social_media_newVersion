const articleSchemaModel = require('../models/article_model.js');
const profileSchemaModel = require('../models/profile_model.js');
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
      contentForObject.time = seconds;
      contentForObject.content = fields.content;
      contentForArray.push(contentForObject);
      article.listOfContent = contentForArray;

      //上傳圖片及照片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType; //png
          photoObj.link = resultPhotoUrl.secure_url;
          article.mediaLink.push(photoObj);

          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;
            article.mediaLink.push(videoObj);

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
          article.mediaLink.push(photoObj);

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
          article.mediaLink.push(videoObj);

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
                all_article[i].avatarLink.push(authorAvatarLink)
            }
            //console.log(all_article)
            // for (let i = 0; i <= all_article.length - 1; i++) {
            //   for (let j = 0; j <= all_profile.length - 1; j++) {
            //     if (all_article[i].authorID = all_profile[j].userID) {
            //       all_article[i].avatarLink = all_profile[j].avatarLink
            //     }
            //   }
            // }

            for(let i = 0; i < all_article.length; i++){
              for(let j = 0; j < all_article[i].comment.length; j++){

                let commenterAvatarLink = commenterIDToAvatarLink(all_article[i].comment[j].commenterID);
               // all_article[i].comment[j].commenter_avatarLink.set(all_article[i].comment[j].commenter_avatarLink.length,commenterAvatarLink )
                all_article[i].comment[j].commenter_avatarLink.push(commenterAvatarLink);
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

  updateArticle(req, res, next) {
    let updateObj = {};
    let photoObj = {};
    let videoObj = {};
    let seconds = Math.round(Date.now() / 1000);
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      updateObj.time = seconds;
      updateObj.content = fields.content;

      // 修改圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType; //mp4
            videoObj.link = resultVideoUrl.secure_url;
            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
                doc.listOfContent.push(updateObj);
                doc.mediaLink.push(photoObj);
                doc.mediaLink.push(videoObj);
                if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
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
          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.listOfContent.push(updateObj);
              doc.mediaLink.push(photoObj);
              if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
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
          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              doc.listOfContent.push(updateObj);
              doc.mediaLink.push(videoObj);
              if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
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
            if (fields.privacy != null) doc.privacy = fields.privacy //文章權限
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
      forComment.listOfComment = commentArrayForListOfComment;
      forComment.commenterID = fields.commenterID
      forComment.mediaLink = [];
      forComment.likes = [];
      forComment.commenter_avatarLink = [];
      forComment.numberOfLikes = forComment.likes.length;
      forComment.delete = false;

      //留言圖片和影片
      if (files.image != null && files.video != null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          forComment.mediaLink.push(photoObj)
          cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
            videoObj.type = fields.videoType;
            videoObj.link = resultVideoUrl.secure_url;
            forComment.mediaLink.push(videoObj);

            articleSchemaModel.findOne({_id: fields.articleID})
              .then(doc => {
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
              }, {resource_type: "video"});
          }, {folder: 'Social_Media/mediaLink'});
        })


        //留言圖片
      } else if (files.image != undefined && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;
          forComment.mediaLink.push(photoObj)

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
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
        }, {folder: 'Social_Media/mediaLink'});

        //留言影片
      }else if (files.image == null && files.video != null){
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType;
          videoObj.link = resultVideoUrl.secure_url;
          forComment.mediaLink.push(videoObj)

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
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
        }, {folder: 'Social_Media/mediaLink'});

        //只留言文字
      } else if (files.image == null && files.video == null) {
        // profileSchemaModel.findOne({userID: fields.commenterID})
        //   .then(data => {
        //     forComment.commenter_avatarLink = data.avatarLink
        //   })
        //   .catch(error => res.json(error));

        articleSchemaModel.findOne({_id: fields.articleID})
          .then(doc => {
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
          if (doc.comment[i].id === req.body.commentID && doc.comment[i].likes.indexOf(req.body.dislikesPersonID) != -1)
          temp = doc.comment[i].likes.indexOf(req.body.dislikesPersonID);
          doc.comment[i].likes.splice(temp, 1);
          doc.comment[i].numberOfLikes = doc.comment[i].likes.length;
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
                   // console.log("123"+doc.comment[i].mediaLink)
                    updateForMedialink.push(photoObj)
                    //console.log(updateForMedialink)
                    updateForMedialink.push(videoObj)
                    doc.comment[i].mediaLink = updateForMedialink

                  }
                  if ( doc.comment[i].listOfComment != null) doc.comment[i].listOfComment = updateCommentArrayForListOfComment

                }

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

        //修改留言圖片
      } else if (files.image != undefined && files.video == null) {
        cloudinary.uploader.upload(files.image.path, function (resultPhotoUrl) {
          photoObj.type = fields.photoType;
          photoObj.link = resultPhotoUrl.secure_url;

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              for (let i = 0; i < doc.comment.length; i++) {
                if (doc.comment[i].id == fields.commentID) {
                  doc.comment[i].mediaLink = photoObj
                  doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                }
                if ( doc.comment[i].listOfComment != null) doc.comment[i].listOfComment = updateCommentArrayForListOfComment
              }

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
        }, {folder: 'Social_Media/mediaLink'});

        //修改影片
      } else if (files.image == null && files.video != null) {
        cloudinary.uploader.upload_large(files.video.path, function (resultVideoUrl) {
          videoObj.type = fields.videoType;
          videoObj.link = resultVideoUrl.secure_url;

          articleSchemaModel.findOne({_id: fields.articleID})
            .then(doc => {
              for (let i = 0; i < doc.comment.length; i++) {
                if (doc.comment[i].id == fields.commentID) {
                  doc.comment[i].mediaLink = videoObj
                  doc.comment[i].listOfComment = updateCommentArrayForListOfComment
                }
                if ( doc.comment[i].listOfComment != null) doc.comment[i].listOfComment = updateCommentArrayForListOfComment
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
              }
            }
            doc.save()
              .then(value => {
                let result = {
                  status: "留言修改成功",
                  content: value
                }
                res.json(result);
              })
              .catch(error => {
                let result = {
                  status: "留言修改失敗",
                  err: "伺服器錯誤，請稍後再試"
                }
                res.json(error)
              })
          })
      }
    })
  }

  deleteComment(req, res, next){
   articleSchemaModel.findOne({_id: req.body.articleID})
      .then(doc => {
        //console.log(doc)

        for (let i = 0 ; i < doc.comment.length;i++) {
          if(doc.comment[i].id === req.body.commentID)
           doc.comment[i].delete = true;
            //console.log(doc)
          //delete doc.comment[i].id[req.body.commentID]
          //console.log(doc)
          let temp = doc.comment[i].id.indexOf(req.body.commentID)
          //console.log(temp)
          doc.comment.splice(temp,1);
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

