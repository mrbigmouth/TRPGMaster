"use strict";
require(
  ["db"
  ,"config"
  ]
, function() {
    var DB      = require("db")
      , CONFIG  = require("config")
      ;
    if (Meteor.isClient) {
      //允許javascript:; href
      Blaze._allowJavascriptUrls();
      //連線斷線通知
      if (Meteor.absoluteUrl() !== "http://127.0.0.1:13667/") {
        var initialized = false
          , disconnect  = false
          ;
        Deps.autorun(function () {
          var connected = Meteor.status().connected;
          if (initialized) {
            if (connected) {
              if (disconnect) {
                //alert("已恢復與伺服器間的連線！");
                disconnect = false;
              }
            }
            else {
              if (disconnect === false) {
                //alert("注意！已失去與伺服器間的連線，此時所做的任何資料更改將不會更新至伺服器上！");
                disconnect = true;
              }
            }
          }
          else {
            if (connected) {
              initialized = true;
            }
          }
        });
      }
    }
    else {
      //登入時訂閱
      Meteor.publish(
        "initialize"
      , function () {
          var userID = this.userId
            , room
            , roomIds
            , chapter
            , message
            , users
            , character
            , characterID
            , dice
            ;

          //房間
          if (userID === CONFIG.adm) {
            room = DB.room.find();
          }
          else {
            room =
              DB.room.find(
                {"$or"    :
                    [{"_id"    : CONFIG.public._id}
                    ,{"public" : true}
                    ,{"adm"    : userID}
                    ,{"player" : userID}
                    ]
                }
              );
          }
          roomIds = _.pluck(room.fetch(), "_id");

          //章節
          chapter =
              DB.record.find(
                {"room"     : {"$in" : roomIds}
                ,"chapter"  : {"$exists" : false}
                }
              );

          //一週內訊息
          message =
              DB.message_all.find(
                {"$or"  :
                    [ {"room" : {"$in" : roomIds }
                      }
                    , {"room" : {"$exists" : false }
                      }
                    ]
                ,"time" :
                    {"$gte" : Date.now() - 604800000}
                }
              );

          //訊息內有的玩家暱稱或(adm)所有玩家資料
          if (userID === CONFIG.adm) {
            users = Meteor.users.find();
          }
          else {
            users = Meteor.users.find({}, {"fields": {"profile.nick" : 1}});
          }
          

          //自己角色的擲骰資料 
          character =
              DB.character.find(
                {"adm"    : userID}
              , {"fields" :
                    {"name"   : 1
                    ,"adm"    : 1
                    ,"room"   : 1
                    }
                }
              );
          characterID = _.pluck(character.fetch(), "_id");
          dice =
              DB.character_data.find(
                {"character"  : {"$in" : characterID}
                ,"type"       : "dice"
                }
              );

          console.log("subscribe initialized!");
          return [room, chapter, message, users, character, dice];
        }
      );
    }
  }
);