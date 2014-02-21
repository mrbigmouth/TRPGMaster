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

//Meteor.loginAs admin 登入指定使用者
Accounts.registerLoginHandler(function(data) {
  var token
    , undefined
    ;

  if (data.method !== 'loginAs') {
    return undefined;
  }
  if (Meteor.userId() === TRPG.adm && data.user) {
    if (Meteor.users.findOne(data.user)) {
      token = Accounts._generateStampedLoginToken();
      Meteor.users.update(
        data.user
      , {$push : {'services.resume.loginTokens': token}
        }
      );
      return {
        'id'    : data.user
      , 'token' : token.token
      }
    }
    else {
      throw new Meteor.Error(404, 'find no user!', 'no user id = ' + data.user);
    }
  }
  else if (Meteor.absoluteUrl() === 'http://localhost:13667/') {
    token = Accounts._generateStampedLoginToken();
    Meteor.users.update(
      TRPG.adm
    , {$push : {'services.resume.loginTokens': token}
      }
    );
    return {
      id   : TRPG.adm
    , token: token.token
    }
  }
  else {
    throw new Meteor.Error(401, 'auth fail!', 'only adm can use this function!');
  }
});