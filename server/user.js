//註冊
Meteor.methods(
  {'registerUser' :
      function(data) {
          if (data.password.length < 8) {
            throw new Meteor.Error(403, '密碼過短，請重新輸入！');
          }
          if (data.profile.nick.length < 2) {
            throw new Meteor.Error(403, '暱稱過短，請重新輸入！');
          }
          var verify    = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/;
          if (! verify.test(data.email)) {
            throw new Meteor.Error(403, '電子郵箱格式錯誤，請重新輸入！');
          }
          var userId = Accounts.createUser(data);
          this.setUserId(userId);
      }
  }
)

//所有使用者資料
Meteor.publish('users', function () {
  var userID = this.userID;

  if (TRPG.adm === userID) {
    return Meteor.users.find();
  }
  throw new Meteor.Error(401, 'Unauthorized', 'Unauthorized');
});

//所有使用者暱稱
Meteor.publish('userNick', function () {
  return Meteor.users.find({}, {'fields': {'profile.nick' : 1}});
});