require('dotenv').config();
//console.log(process.env.DB_URI);

module.exports = {
  mongo: {
    db: process.env.DB_URI || 'mongodb://admin:admin123@ds235711.mlab.com:35711/socialplatform'
  }
};