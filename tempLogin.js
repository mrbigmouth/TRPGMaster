if (Meteor.isClient) {
  Meteor.startup(function() {
    if (!Meteor.loggingIn()) {
      var userId = window.prompt('你是誰?');
      Accounts.callLoginMethod({
        methodArguments: [{userId: userId}],
        userCallback: function() {
          console.log(arguments);
        }
      });
    }
  });
}
else {
  Accounts.registerLoginHandler(function(user) {
    var userId = user.userId;
    user = Meteor.users.findOne(user.userId);
    if (user) {
      //creating the token and adding to the user
      var stampedToken = Accounts._generateStampedLoginToken();
      //hashing is something added with Meteor 0.7.x, 
      //you don't need to do hashing in previous versions
      var hashStampedToken = Accounts._hashStampedToken(stampedToken);
      
      Meteor.users.update(userId, 
        {$push: {'services.resume.loginTokens': hashStampedToken}}
      );
      return {
        id: userId,
        token: stampedToken.token
      };
    }
  });
}