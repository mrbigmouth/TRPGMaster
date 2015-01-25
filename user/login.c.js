"use strict";
Template.login_dialog.created =
  function() {
    $("#login_dialog").modal(
      {"show" : false
      }
    );
  };
Template.login_dialog.events(
  //綁定登入事件
  {"click button.btn-primary" :
      function(e, ins) {
        var $inputs   = ins.$("input[name]")
          , $password = $inputs.filter("[name=\"password\"]")
          , $email    = $inputs.filter("[name=\"email\"]")
          ;
        Meteor
          .loginWithPassword(
            $email.val()
          , $password.val()
          , function(err) {
              if (err) {
                alert(err.message);
              }
              else {
                $(ins.firstNode).modal("hide");
              }
            }
          );
      }
  //註冊
  ,"click button[type=\"button\"]" :
      function(e, ins) {
        $(ins.firstNode).modal("hide");
        $("#register_dialog").modal("show");
      }
  //以facebook登入
  ,"click a.facebook" :
      function(e, ins) {
        Meteor.loginWithFacebook(
          function() {
            $(ins.firstNode).modal("hide");
          }
        );
      }
  //以google登入
  ,"click a.google" :
      function(e, ins) {
        Meteor.loginWithGoogle(
          function() {
            $(ins.firstNode).modal("hide");
          }
        );
      }
  }
);

Template.register_dialog.created =
    function() {  
      $("#register_dialog").modal(
        {"show" : false
        }
      );
    };
Template.register_dialog.events(
  //綁定註冊事件
  {"click button.btn-primary" :
        function(e, ins) {
          var $inputs   = ins.$("input[name]")
            , $password = $inputs.filter("[name=\"password\"]")
            , password  = $password.val()
            , $confirm  = $inputs.filter("[name=\"confirm_password\"]")
            , $email    = $inputs.filter("[name=\"email\"]")
            , $nick     = $inputs.filter("[name=\"nick\"]")
            , verify    = /[a-z0-9!#$%&"*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&"*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/
            ;
          //清空錯誤狀態
          ins.$(".has-error").removeClass(".has-error");
          if (password !== $confirm.val()) {
            alert("密碼與確認密碼不相符，請重新輸入！");
            $confirm.closest(".row").addClass("has-error");
            return false;
          }
          if (password.length < 8) {
            alert("密碼過短，請重新輸入！");
            $password.closest(".row").addClass("has-error");
            $confirm.val("");
            return false;
          }
          if ($nick.val().length < 2) {
            alert("暱稱過短，請重新輸入！");
            $nick.closest(".row").addClass("has-error");
            return false;
          }
          if (! verify.test($email.val())) {
            alert("電子郵箱格式錯誤，請重新輸入！");
            $email.closest(".row").addClass("has-error");
            return false;
          }
          Meteor.call(
            "registerUser"
           ,{"username" : $email.val()
            ,"email"    : $email.val()
            ,"password" : password
            ,"profile"  :
                {"nick"     : $nick.val()}
            }
           ,function(err, result) {
              if (err) {
                return alert(err.reason);
              }
              $form.modal("hide");
            }
          )
        }
  }
);