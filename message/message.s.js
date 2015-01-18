"use strict";
var DB    = require("db")
  , TRPG  = require("config")
  ;
Meteor.methods(
  {"updateOldMSG" :
      function (message) {
        var filter    = _.omit(message, "_id", "time")
          , now       = Date.now()
          , timeLimit
          , oldMessage
          ;
        oldMessage = DB.message_all.findOne(filter, {"sort" : { "time" : -1 }});
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
          }
          if (now - oldMessage.time <= timeLimit) {
            DB.message_all.update(oldMessage._id, { "$set" : {"time" : now} });
            return true;
          }
          return false;
        }
      }
  }
);

DB.message_all.allow(
  {"insert" :
      function(userID, doc) {
        var result  = false
          , now     = Date.now()
          , filter  = _.omit(doc, "_id", "time")
          , oldMessage
          , timeLimit
          ;

        if (Meteor.call("updateOldMSG", doc) === true) {
          return false;
        }

        doc._id = (now + "");
        doc.time = now;
        doc.user = userID;
        if (userID === TRPG.adm || doc.room === TRPG.public._id) {
          result = true;
        }
        else {
          var room = DB.room.findOne(doc.room);
          if (room && (room.adm.indexOf(userID) !== -1 || room.player.indexOf(userID) !== -1)) {
            result = true;
          }
        }
        if (result) {
          if (doc.section) {
            DB.record.update(doc.section, {"$set" : {"time" : now } }, _.identity);
          }
          return true;
        }
        else {
          return false;
        }
      }
  ,"update" :
      function(userID, doc) {
        if (userID === TRPG.adm) {
          return true;
        }
        var room = DB.room.findOne(doc.room);
        if (room && room.adm.indexOf(userID) !== -1) {
          DB.message_all.update(doc._id, {$set : {"time" : Date.now() }}, _.identity)
          return true;
        }
        return false;
      }
  ,"remove" :
      function(userID, doc) {
        if (userID == TRPG.adm) {
          return true;
        }
        return false;
      }
  }
);