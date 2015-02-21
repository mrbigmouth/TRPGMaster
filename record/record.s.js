"use strict";
var DB    = require("db")
  , TRPG  = require("config")
  ;
Meteor.methods(
  {"upsertRecord" :
      function (record) {
        var now       = Date.now()
          , userId    = this.userId
          , timeLimit
          , authorize
          , room
          , message
          , msg
          ;
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
  ,"incrementParagraphSort" :
      function(sectionId, from, inc) {
        var section = DB.record.findOne(sectionId)
          , userId  = this.userId
          , authorize
          , room
          ;
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
        var record1 = DB.record.findOne(recordId1)
          , record2 = DB.record.findOne(recordId2)
          ;
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
        var now    = Date.now()
          , authorize
          , message
          ;
        authorize = false;
        if (userId === TRPG.adm || userId == record.user) {
          authorize = true;
        }
        var room = DB.room.findOne({"_id" : record.room});
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
          }
      , first        =
          DB.record.findOne(
            {"room"     : roomId
            ,"chapter"  : chapterId
            ,"section"  : {"$exists" : false}
            }
          , {"sort" : {"sort" : 1}
            }
          )
      ;

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

/*
function strip_tags (input, allowed) {
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: Luke Godfrey
  // +      input by: Pul
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // +      input by: Alex
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Marc Palau
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +      input by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Eric Nagel
  // +      input by: Bobby Drake
  // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Tomasz Wesolowski
  // +      input by: Evertjan Garretsen
  // +    revised by: Rafał Kukawski (http://blog.kukawski.pl/)
  // *     example 1: strip_tags("<p>Kevin</p> <br /><b>van</b> <i>Zonneveld</i>", "<i><b>");
  // *     returns 1: "Kevin <b>van</b> <i>Zonneveld</i>"
  // *     example 2: strip_tags("<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>", "<p>");
  // *     returns 2: "<p>Kevin van Zonneveld</p>"
  // *     example 3: strip_tags("<a href="http://kevin.vanzonneveld.net">Kevin van Zonneveld</a>", "<a>");
  // *     returns 3: "<a href="http://kevin.vanzonneveld.net">Kevin van Zonneveld</a>"
  // *     example 4: strip_tags("1 < 5 5 > 1");
  // *     returns 4: "1 < 5 5 > 1"
  // *     example 5: strip_tags("1 <br/> 1");
  // *     returns 5: "1  1"
  // *     example 6: strip_tags("1 <br/> 1", "<br>");
  // *     returns 6: "1  1"
  // *     example 7: strip_tags("1 <br/> 1", "<br><br/>");
  // *     returns 7: "1 <br/> 1"
  allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(""); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
  return input.replace(commentsAndPhpTags, "").replace(tags, function ($0, $1) {
    return allowed.indexOf("<" + $1.toLowerCase() + ">") > -1 ? $0 : "";
  });
}
*/
