const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

let userSchema = new Schema({
  userID: String,
  userName : String,
  password : String,
  email : String,
 }, { versionKey: false });

userSchema.pre('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    // hash the password along with our new salt, store hash in db
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
      console.log(hash);
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, db_pwd,callback) {
    bcrypt.compare(candidatePassword, db_pwd, function(err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
  });
};

let user_schema = mongoose.model('User', userSchema);

module.exports = user_schema;








