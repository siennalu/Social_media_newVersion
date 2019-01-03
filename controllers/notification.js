const admin = require('firebase-admin');
const serviceAccount = require('../privatekey.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chunfung-cd81a.firebaseio.com"
});

function sendNotification(token, notificationObject){
  //let registrationToken = 'f5-kgGZnlKk:APA91bHwL6FRnm9uYNCpgZz7ytdtSAJ7FyCUK1OGd4GA9IqV4q0KHSOqULW68vkvH1TRkBdlgX0Hg0IMI1ZeG8aUg__U08hJPX4Wp6P9SxESIF1yYLDokJzuMhWYNxHpEdAeb71Q03Vc'

  let registrationToken = token;
  let message = {
    webpush: {
      notification: notificationObject
    },
    data: {
    },
    token: registrationToken,
  };
  //console.log(message);

  admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
      // process.exit(0);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
}

module.exports = sendNotification;

