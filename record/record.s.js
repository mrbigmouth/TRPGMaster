"use strict";
var DB    = require("db");
var TRPG  = require("config");
Meteor.methods(
  {"upsertRecord" :
      function (record) {
        var now       = Date.now();
        var userId    = this.userId;
        var timeLimit;
        var authorize;
        var room;
        var message;
        var msg;

        check(
          record
        , {"_id"      : Match.Optional(String)
          ,"name"     : Match.Optional(String)
          ,"room"     : String
          ,"chapter"  : Match.Optional(String)
          ,"section"  : Match.Optional(String)
          ,"content"  : Match.Optional(String)
          ,"sort"     : Match.Integer
          ,"time"     : Match.Optional(Number)
          ,"user"     : Match.Optional(String)
          ,"editing"  : 
              Match.Optional(
                Match.OneOf(String, Boolean)
              )
          }
        );
        authorize = false;
        if (userId === TRPG.adm || record.room === TRPG.public.id) {
          authorize = true;
        }
        else {
          room = DB.room.findOne({"_id" : record.room});
          if (room && (room.adm.indexOf(userId) !== -1 || room.player.indexOf(userId) !== -1)) {
            authorize = true;
          }
        }

        //確定可upsert
        if (authorize) {
          //修改
          if (record._id) {
            record.time = now;
            record.user = userId;
            DB.record.update(record._id, record);
            msg = "修改了一筆遊戲紀錄。";
          }
          //新增
          else {
            record._id = (now + "");
            record.time = now;
            record.user = userId;
            DB.record.insert(record);
            msg = "新增了一筆遊戲紀錄。";
          }
          //插入紀錄
          if (record.section) {
            message = 
              {"room"    : record.room
              ,"chapter" : record.chapter
              ,"section" : record.section
              ,"type"    : "room"
              ,"msg"     : msg
              ,"user"    : userId
              };
          }
          else {
            message = 
              {"room"    : record.room
              ,"chapter" : record.chapter
              ,"type"    : "room"
              ,"msg"     : msg
              ,"user"    : userId
              };
          }
          Meteor.call("insertMessage", message);
          return record;
        }
        //權限不符
        else {
          throw new Meteor.Error(401, "Unauthorized for user [" + userId + "]");
        }
      }
  ,"stopEditing"  :
      function(paragraphId) {
        var paragraph;
        check(paragraphId, String);
        paragraph = DB.record.findOne(paragraphId);
        if (this.userId === paragraph.editing || (paragraph.time + 30 * 60 * 1000) < Date.now()) {
          DB.record.update(
            paragraph._id
          , {"$set" : {"editing" : false}
            }
          );
          return true;
        }
        throw new Meteor.Error(401, "Unauthorized for paragraph [" + paragraphId + "] with user [" + this.userId + "]");
      }
  ,"incrementParagraphSort" :
      function(sectionId, from, inc) {
        var section = DB.record.findOne(sectionId);
        var userId  = this.userId;
        var authorize;
        var room;
        check(sectionId, String);
        check(from, Match.Integer);
        check(inc, Match.Integer);
        //驗證權限
        if (section && userId) {
          authorize = false;
          if (userId === TRPG.adm || section.room === TRPG.public.id) {
            authorize = true;
          }
          else {
            room = DB.room.findOne({"_id" : section.room});
            if (room && (room.adm.indexOf(userId) !== -1 || room.player.indexOf(userId) !== -1)) {
              authorize = true;
            }
          }
          if (authorize) {
            DB.record.update(
              {"room"    : section.room
              ,"chapter" : section.chapter
              ,"section" : section._id
              ,"sort"    : {"$gte" : from}
              }
            , {"$inc"    : {"sort" : inc}
              }
            , {"multi"   : true}
            );
          }
          return true;
        }
        throw new Meteor.Error(401, "Unauthorized for section [" + sectionId + "] with user [" + userId + "]");
      }
  ,"switchParagraphSort" :
      function(recordId1, recordId2) {
        var record1 = DB.record.findOne(recordId1);
        var record2 = DB.record.findOne(recordId2);
        if (record1 && record2) {
          DB.record.update(
            record1._id
          , {"$set" : {"sort" : record2.sort}
            }
          );
          DB.record.update(
            record2._id
          , {"$set" : {"sort" : record1.sort}
            }
          );
          return true;
        }
        throw new Meteor.Error(403, "Cant find paragraph [" + recordId1 + "] or [" + recordId2 + "]");
      }
  ,"insertDice" :
      function(data) {
        var now       = Date.now();
        var userId    = this.userId;
        var amount;
        var face;
        var result;
        var message;
        check(
          data
        , {"room"       : String
          ,"chapter"    : String
          ,"section"    : String
          ,"paragraph"  : Match.Optional(String)
          ,"who"        : String
          ,"name"       : String
          ,"amount"     : Match.Integer
          ,"face"       : Match.Integer
          ,"add"        : Match.Integer
          ,"extra"      : Match.Integer
          ,"addEach"    : Boolean
          ,"note"       : String
          ,"isHide"     : Boolean
          }
        );
        amount = data.amount;
        face   = data.face;
        result = [];
        while ((amount -= 1) >= 0) {
          result.push( Math.floor( ( Math.random() * face ) + 1 ) );
        }
        
        if (data.paragraph) {
          message = 
            {"_id"        : ("" + now)
            ,"type"       : "dice"
            ,"room"       : data.room
            ,"chapter"    : data.chapter
            ,"section"    : data.section
            ,"paragraph"  : data.paragraph
            ,"who"        : data.who
            ,"name"       : data.name
            ,"amount"     : data.amount
            ,"face"       : data.face
            ,"add"        : data.add
            ,"extra"      : data.extra
            ,"addEach"    : data.addEach
            ,"isHide"     : data.isHide
            ,"result"     : result
            ,"user"       : userId
            ,"time"       : now
            };
        }
        else {
          message = 
            {"_id"        : ("" + now)
            ,"type"       : "dice"
            ,"room"       : data.room
            ,"chapter"    : data.chapter
            ,"section"    : data.section
            ,"who"        : data.who
            ,"name"       : data.name
            ,"amount"     : data.amount
            ,"face"       : data.face
            ,"add"        : data.add
            ,"extra"      : data.extra
            ,"note"       : data.note
            ,"addEach"    : data.addEach
            ,"isHide"     : data.isHide
            ,"result"     : result
            ,"user"       : userId
            ,"time"       : now
            };
        }
        DB.message_all.insert(message);
        return message;
      }
  }
);
DB.record.allow(
  {"insert" :
      function(userId, doc) {
        if (userId == TRPG.adm) {
          return true;
        }
        return false;
      }
  ,"update" :
      function(userId, doc) {
        if (userId == TRPG.adm) {
          return true;
        }
        return false;
      }
  ,"remove" :
      function(userId, record) {
        var now    = Date.now();
        var authorize;
        var message;
        var room;
        authorize = false;
        if (userId === TRPG.adm || userId == record.user) {
          authorize = true;
        }
        room = DB.room.findOne({"_id" : record.room});
        if (room && room.adm.indexOf(userId) !== -1) {
          authorize = true;
        }
        //確定移除後
        if (authorize) {
          if (record.section) {
            message = 
              {"room"    : record.room
              ,"chapter" : record.chapter
              ,"section" : record.section
              ,"type"    : "room"
              ,"msg"     : "移除了一筆遊戲紀錄。"
              };
          }
          else {
            message = 
              {"room"    : record.room
              ,"chapter" : record.chapter
              ,"type"    : "room"
              ,"msg"     : "移除了一筆遊戲紀錄。"
              };
          }
          //(TODO)用multi:true有時會出問題？
          DB.message_all.find(
            {"$or"    :
                [ {"section"    : record._id}
                , {"paragraph"  : record._id}
                ]
            }
          )
          .forEach(function(doc) {
            DB.message_all.remove(doc._id);
          });
          Meteor.call("insertMessage", message);
          return true;
        }
        return false;
      }
  }
);

Meteor.publish(
  "chapter"
, function (roomId, chapterId) {
    check(roomId, String);
    check(chapterId, String);
    var secionFilter =
          {"$or" :
            [ {"room"    : roomId
              ,"section" : {"$exists" : false}
              }
            ]
          };
    var first        =
          DB.record.findOne(
            {"room"     : roomId
            ,"chapter"  : chapterId
            ,"section"  : {"$exists" : false}
            }
          , {"sort" : {"sort" : 1}
            }
          );

    //條件中新增已訂閱的section下的所有段落
    secionFilter.$or.push(
      {"section" : first._id
      }
    );
    return [
      DB.record.find(secionFilter)
    //章節下的所有擲骰跟場外訊息
    , DB.message_all.find({"chapter" : chapterId, "type" : {"$in" : ["outside", "dice"]}})
    ];
  }
);


Meteor.publish(
  "section"
, function (roomId, chapterId, sectionId) {
    check(roomId, String);
    check(chapterId, String);
    check(sectionId, String);
    return [
      DB.record.find(
        {"$or" :
          //該章節
          [ {"_id" : sectionId}
          //該章節下所有段落
          , {"section" : sectionId}
          //該房間下所有chapter（for panel）
          , {"room"    : roomId
            ,"section" : {"$exists" : false}
            }
          ]
        }
      )
    //已訂閱章節下的所有擲骰跟場外訊息
    , DB.message_all.find({"chapter" : chapterId, "type" : {"$in" : ["outside", "dice"]}})
    ];
  }
);
