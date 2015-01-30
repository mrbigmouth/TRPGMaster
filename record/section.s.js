"use strict";
var DB    = require("db");

Meteor.methods(
  {"addParagraph" :
      function(sectionId, sort) {
        var section = DB.record.findOne(sectionId)
          , userId  = this.userId
          ;
        if (section && userId) {
          DB.record.insert(
            {"room"    : section.room
            ,"chapter" : section.chapter
            ,"section" : section._id
            ,"sort"    : sort
            ,"content" : ""
            ,"editing" : this.userId
            }
          );
          Meteor.call("incrementParagraphSort", section._id, sort, 1, _.identity);
          Meteor.call(
            "addMessage"
          , {"room"    : section.room
            ,"chapter" : section.chapter
            ,"section" : section._id
            ,"type"    : "room"
            ,"msg"     : "更新了遊戲紀錄。"
            }
          , _.identity
          );
        }
      }
  ,"incrementParagraphSort" :
      function(sectionId, sort, number) {
        var section = DB.record.findOne(sectionId)
          , userId  = this.userId
          ;
        if (section && userId) {
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
      }
  }
);