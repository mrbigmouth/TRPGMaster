"use strict";
define(
  "util"
, []
, function() {
    var exports =
      //取得已知_id之user之nick
      {"getUserNick" :
          function(user) {
            user = Meteor.users.findOne(user);
            if (user) {
              return user.profile.nick;
            }
            else {
              return "不明人物";
            }
          }
      //轉換timeStamp為中文時間
      ,"convertTimeToChinese" :
          function(time) {
            time = parseInt(time, 10);
            if (time) {
              return moment(time).format("[(]YYYY/MM/DD HH:mm:ss[)]");
            }
            else {
              return "(????/??/?? ??:??:??)"
            }
          }
      //判斷目前使用者是否為目前房間之管理者
      ,"userIsAdm" :
          function() {
            var RouterParams = Session.get("RouterParams")
              , room         = DB.room.findOne(RouterParams.room)
              , id           = Meteor.userId()
              ;
            if (RouterParams.room === TRPG.public.id) {
              return true;
            }
            return (id && (id == TRPG.adm || (room && _.indexOf(room.adm, id) !== -1) ));
          }
      //判斷目前使用者是否為目前房間之玩家
      ,"userIsPlayer" :
          function() {
            var RouterParams = Session.get("RouterParams")
              , room         = DB.room.findOne(RouterParams.room)
              , id           = Meteor.userId()
              ;
            if (RouterParams.room === TRPG.public.id) {
              return true;
            }
            return ( id && (id == TRPG.adm || ( room && (_.indexOf(room.adm, id) !== -1 || _.indexOf(room.player, id) !== -1) ) ) );
          }
      //判斷一個物件的各key是否undefined
      ,"keyIsUndefined" :
          function() {
            var undefined
              , i
              ;
            for (i in arguments) {
              if (this[ arguments[ i ] ] !== undefined) {
                return false;
              }
            }
            return true;
          }
      };
    return exports;
  }
);