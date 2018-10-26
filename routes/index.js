const express = require('express');
const router = express.Router();
const User = require('../controllers/users_controller');
const Article = require('../controllers/article_controller');
const Profile = require('../controllers/profile_controller')

let user = new User();
let article = new Article();
let profile = new Profile();

router.post('/register', user.insertUser); //create(register)

router.post('/login', user.loginUser);  //login

router.get('/search_user', user.retrieveUser); //read

router.put('/update_user', user.updateUser); //update

router.post('/add_article', article.postArticle); //post article

router.put('/update_article', article.updateArticle); //update article

router.get('/search_article', article.searchArticle); //get all of the article

router.post('/search_articleByArticleID', article.searchArticleByArticleID); //get the article by articleID

router.get('/search_article', article.searchArticle); // get all of article

router.put('/delete_article', article.deleteArticle); //delete

router.put('/likes_article', article.likesArticle); //likes

router.put('/dislikes_article', article.dislikesArticle); //likes

router.post('/upload_avatar', profile.uploadAvatar);//upload

router.post('/add_comment', article.commentArticle); //leave comment

router.put('/likes_comment', article.likesComment); //likes comment

router.put('/dislikes_comment', article.dislikesComment); //dislikes comment

router.put('/delete_comment', article.deleteComment); //delete comment

router.put('/update_comment', article.updateComment); //update comment

router.post('/upload_backgroundPhoto', profile.uploadBackgroundPhoto); //upload

router.post('/search_profileByUserID', profile.searchProfileByUserID); //get the profile by userID

router.post('/search_articleByUserID', profile.searchArticleByUserID); //get the article by userID

router.put('/profile_setting', profile.profileSetting); //profile

//router.put('/friends_following', profile.friendsFollowing); //追蹤

router.put('/friends_unfollowing', profile.friendsUnfollowing); //取消追蹤

router.put('/friends_add', profile.friendsAdd); //新增好友

router.put('/friends_unadded', profile.friendsUnadded); //取消好友


module.exports = router;
