
var formData  = {}
  , formDep   = new Deps.Dependency()
  , $form     = $($.parseHTML('<div />'))
  , helpers   = {}
  , changeForm
  , callForm
  , undefined
  ;

//修改視窗參數 函數
changeForm =
  function(data) {
    var changed = false
      , i
      ;
    for (i in data) {
      if (formData[i] !== data[i]) {
        formData[i] = data[i];
        changed = true;
      }
    }
    if (changed) {
      formDep.changed();
    }
  }

//修改視窗參數並呼叫視窗 函數
callForm = 
  function(data) {
    changeForm(data);
    $form.modal('show');
  }

//開始後註冊$form為視窗物件本身
Meteor.startup(function() {
  $form.remove();
  $form = $('#modal_form').modal({'show' : false});
});

//視窗物件參數函數
helpers = 
  //視窗標題
  {'title'   :
      function() {
        formDep.depend();
        return formData.title;
      }
  //登入
  ,'login'   :
      function() {
        formDep.depend();
        return (formData['type'] === 'login');
      }
  //註冊
  ,'register'   :
      function() {
        formDep.depend();
        return (formData['type'] === 'register');
      }
  //帳戶資訊
  ,'account' :
      function() {
        formDep.depend();
        return (formData['type'] === 'account');
      }
  //申請開團
  ,'applyRoom'  :
      function() {
        formDep.depend();
        return (formData['type'] === 'applyRoom');
      }
  }
Template.modal_form.helpers(helpers)

//呼叫登入登入視窗
var callLogin =
      function(e) {
        e.preventDefault();
        callForm(
          {'title'   : '使用者登入'
          ,'type'    : 'login'
          }
        )
      };
Template.nav_user.events(
  //綁定導覽列的呼叫登入視窗事件
  {'click a.login' : callLogin
  //綁定導覽列的呼叫帳號資訊視窗事件
  ,'click a.account' :
      function(e) {
        e.preventDefault();
        callForm(
          {'title'   : '帳戶資訊'
          ,'type'    : 'account'
          }
        )
      }
  }
);

//註冊視窗事件綁定
Template.modal_form_register.events(
  //呼叫登入視窗事件
  {'click button.login'    : callLogin
  //綁定註冊事件
  ,'click button.btn-primary' :
        function(e, ins) {
          var $inputs   = $(ins.findAll('input[name]'))
            , $password = $inputs.filter('[name="password"]')
            , password  = $password.val()
            , $confirm  = $inputs.filter('[name="confirmpassword"]')
            , $email    = $inputs.filter('[name="email"]')
            , $nick     = $inputs.filter('[name="nick"]')
            , verify    = /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/
            ;
          if (password !== $confirm.val()) {
            alert('密碼與確認密碼不相符，請重新輸入！');
            $password.val('');
            $confirm.val('');
            return false;
          }
          if (password.length < 8) {
            alert('密碼過短，請重新輸入！');
            $password.val('');
            $confirm.val('');
            return false;
          }
          if ($nick.val().length < 2) {
            alert('暱稱過短，請重新輸入！');
            $nick.val('');
            return false;
          }
          if (! verify.test($email.val())) {
            alert('電子郵箱格式錯誤，請重新輸入！');
            $email.val('');
            return false;
          }
          Meteor.call(
            'registerUser'
           ,{'username' : $email.val()
            ,'email'    : $email.val()
            ,'password' : password
            ,'profile'  :
                {'nick'     : $nick.val()}
            }
           ,function(err, result) {
              if (err) {
                return alert(err.reason);
              }
              $form.modal('hide');
            }
          )
        }
  }
);

//登入視窗事件綁定
Template.modal_form_login.events(
  //呼叫註冊視窗
  {'click button.register' :
      function() {
        callForm(
          {'title'   : '使用者註冊'
          ,'type'    : 'register'
          }
        )
      }
  //綁定登入事件
  ,'click button.btn-primary' :
      function(e, ins) {
        var $inputs   = $(ins.findAll('input[name]'))
          , $password = $inputs.filter('[name="password"]')
          , $email    = $inputs.filter('[name="email"]')
          ;
        Meteor
          .loginWithPassword(
            $inputs.filter('[name="email"]').val()
          , $inputs.filter('[name="password"]').val()
          , function(err) {
              if (err) {
                alert(err.reason);
              }
              else {
                $form.modal('hide');
              }
            }
          );
      }
  //以facebook登入
  ,'click a.facebook' :
      function() {
        Meteor.loginWithFacebook(
          function() {
            $form.modal('hide');
          }
        );
      }
  //以google登入
  ,'click a.google' :
      function() {
        Meteor.loginWithGoogle(
          function() {
            $form.modal('hide');
          }
        );
      }
  }
)

//申請開團
Template.main_explain.events(
  {'click a.applyRoom' :
      function(e) {
        e.preventDefault();
        if (Meteor.userId()) {
          callForm(
            {'title'   : '申請開團'
            ,'type'    : 'applyRoom'
            }
          )
        }
        else {
          callLogin(e);
        }
      }
  }
)
//申請開團視窗事件綁定
Template.modal_form_applyRoom.events(
  {'click button.btn-primary' :
      function(e, ins) {
        var $data   = $(ins.findAll('input,select,textarea'));
        DB.room.insert(
          {'name'   : $data.filter('.name').val()
          ,'rule'   : $data.filter('.rule').val()
          ,'desc'   : $data.filter('.desc').val().replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2')
          ,'status' : 0
          ,'public' : true
          ,'adm'    : [ Meteor.userId() ]
          }
        , function(err, _id) {
            if (err) {
              alert(err.reason);
            }
            else {
              $form.modal('hide');
            }
          }
        )
      }
  }
)

//帳戶設定
Template.modal_form_account.helpers(
  {'nick' :
      function() {
        return TOOL.getUserNick(Meteor.userId());
      }
  }
)
//帳戶設定視窗事件綁定
Template.modal_form_account.events(
  //修改暱稱
  {'click button.btn-primary' :
      function(e, ins) {
        Meteor.users.update(Meteor.userId(), {$set : {'profile.nick' : $(ins.find('input.nick')).val() }});
        $form.modal('hide');
      }
  }
)