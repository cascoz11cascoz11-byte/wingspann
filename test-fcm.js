const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth({
  credentials: JSON.parse(require('fs').readFileSync('./firebase-service-account.json', 'utf8')),
  scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});
auth.getClient().then(client => client.getAccessToken()).then(async token => {
  const res = await fetch('https://fcm.googleapis.com/v1/projects/wingspann-81463/messages:send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token.token,
    },
    body: JSON.stringify({
      message: {
        token: 'cK0I20vMHk6elad88N0hQt:APA91bH4i_pD5lz2gEzBKL9w7Mc-NHJQbn228chdBfO5Ls8oDLlYnzWZWu_iig5ztX18f_dYWwtF1rxlhhXDAawpe6N6GNlZ3wKgzu__gKJ6hsqRkNm5dNY',
        notification: { title: 'Test 🎉', body: 'Wingspann notifications are working!' },
      }
    })
  });
  const data = await res.json();
  console.log('FCM response:', JSON.stringify(data, null, 2));
});
