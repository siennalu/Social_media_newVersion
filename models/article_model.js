const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let articleSchema = new Schema({
 authorID: String,
 //  authorID:{
 //    type: mongoose.Schema.Types.ObjectId,
 //    ref: 'User'
 //  },
  author: String,
  title: String,
  category: String,
  privacy: String,
  listOfContent: Array,
  likes: Array,
  numberOfLikes: Number,
  comment: Array,
  avatarLink:Array,
  mediaLink: Array,
  hashTags: Array,
  delete: Boolean,
  // postedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Profile'
  // },

  // comments: [{
  //   text: String,
  //   postedBy: {
  //     //type: mongoose.Schema.Types.ObjectId,
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }
  // }]
}, { versionKey: false });

let article_schema = mongoose.model('Article', articleSchema);

module.exports = article_schema;