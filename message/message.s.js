"use strict";
var DB    = require("db")
  , TRPG  = require("config")
  ;
Meteor.methods(
  {"insertMessage" :
      function (message) {
        var now       = Date.now()
          , userId    = this.userId
          , timeLimit
          , oldMessage
          , authorize
          , room
          ;
        check(
          message
        , {"_id"      : Match.Optional(String)
          ,"type"     : String
          ,"msg"      : String
          ,"room"     : Match.Optional(String)
          ,"chapter"  : Match.Optional(String)
          ,"section"  : Match.Optional(String)
          ,"time"     : Match.Optional(Number)
          ,"user"     : Match.Optional(String)
          }
        );

        //防止client端資訊錯誤，由server端給定值
        message._id = (now + "");
        message.time = now;
        message.user = userId;

        //找尋最新的相同紀錄
        oldMessage =
            DB.message_all.findOne(
              _.omit(message, "_id", "time")
            , {"sort" : { "time" : -1 }
              }
            );
        //若有相同紀錄，檢測時間是否距離過近
        if (oldMessage) {
          switch (message.type) {
          case "chat"    :
          case "dice"    :
          case "outside" :
          default :
            //一分鐘內
            timeLimit = 60000;
            break;
          case "system"  :
          case "room"    :
            //一小時內
            timeLimit = 3600000;
            break;
          }
          //若時間過近
          if (now - oldMessage.time <= timeLimit) {
            //更新舊訊息的時間為現在，然後中止插入
            DB.message_all.update(
              oldMessage._id
            , {"$set" : {"time" : now}
              }
            );
            return oldMessage;
          }
        }

        //權限驗證
        authorize = false;
        if (userId === TRPG.adm || doc.room === TRPG.public._id) {
          authorize = true;
        }
        else {
          room = DB.room.findOne(doc.room);
          if (room && (room.adm.indexOf(userId) !== -1 || room.player.indexOf(userId) !== -1)) {
            authorize = true;
          }
        }
        if (authorize) {
          DB.message_all.insert(message);
          return message;
        }
        else {
          throw new Meteor.Error(401, "Unauthorized for user [" + userId + "]");
        }
      }
  }
);

DB.message_all.allow(
  {"insert" :
      function(userId, doc) {
        if (userId == TRPG.adm) {
          return true;
        }
        return false;
      }
  ,"update" :
      function(userId, doc) {
        if (userId === TRPG.adm) {
          return true;
        }
        return false;
      }
  ,"remove" :
      function(userId, doc) {
        if (userId == TRPG.adm) {
          return true;
        }
        return false;
      }
  }
);
