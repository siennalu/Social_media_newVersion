const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let profileSchema = new Schema({
  userID: String,
  userName: String,
  aboutMe: String,
  colorOfTheme: String,
  totalOfArticle: Number,
  totalOfFollowings: Number,
  totalOfFans: Number,
  following: Array,
  fans: Array,
  friends: Array,
  avatarLink : String,
  backgroundLink: String,
  // posts: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Article'
  // },
}, { versionKey: false });

let profile_schema = mongoose.model('Profile', profileSchema);

module.exports = profile_schema;