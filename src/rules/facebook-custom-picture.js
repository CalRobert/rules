/**
 * @overview Set a custom sized profile picture for Facebook connections
 * @gallery true
 * @category enrich profile
 * 
 * Use a custom sized profile picture for Facebook connections
 * 
 * This rule will set the `picture` to a custom size for users who login with Facebook.
 * 
 */

function (user, context, callback) {
  if (context.connection === 'facebook') {
    const fbIdentity = _.find(user.identities, { connection: 'facebook' });
    // See: https://developers.facebook.com/docs/graph-api/reference/user/picture/ for more 
    // sizes and types of images that can be returned
    const pictureType = 'large';
    context.idToken.picture = 'https://graph.facebook.com/v2.5/' + fbIdentity.user_id + '/picture?type=' + pictureType;
  }
  callback(null, user, context);
}
