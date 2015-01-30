//require start
require(
  ["db"
  ,"config"
  ,"util"
  ]
, function() {

var DB      = require("db")
  , CONFIG  = require("config")
  , UTIL    = require("util")
  ;

Template.section.helpers(
  {"isAdm"          :
      function(room) {
        var userId = Meteor.userId();
        return (userId === CONFIG.adm || _.indexOf(room.adm, userId) !== -1);
      }
  ,"isPlayer"       :
      function(room) {
        var userId = Meteor.userId();
        return (userId === CONFIG.adm || _.indexOf(room.adm, userId) !== -1 || _.indexOf(room.player, userId) !== -1);
      }
  ,"allParagraph"   :
      function() {
        return DB.record.find(
          {"section"  : this._id
          }
        , {"sort"     : {"sort" : 1}
          }
        );
      }
  }
);

Template.section.events(
  {"click [data-action=\"editTitle\"]" :
      function(e, ins) {
        var insData = ins.data
          , title   = window.prompt("請輸入新標題：", insData.name)
          ;
        e.stopPropagation();
        if (title) {
          DB.record.update(insData._id, {"$set" : {"name" : title} });
          //更新紀錄
          DB.message_all.insert(
            {"user"    : Meteor.userId()
            ,"room"    : insData.room
            ,"chapter" : insData.chapter
            ,"section" : insData._id
            ,"type"    : "room"
            ,"msg"     : "更新了遊戲紀錄。"
            }
          )
        }
      }
  ,"click [data-action=\"selectAll\"]" :
      function(e, ins) {
        e.stopPropagation();
        ins.$("article").addClass("focus");
      }
  ,"click [data-action=\"cancelAll\"]" :
      function(e, ins) {
        e.stopPropagation();
        ins.$("article.focus").not(".editing").removeClass("focus");
      }
  ,"click [data-action=\"addParagraph\"]" :
      function(e, ins) {
        var section     = ins.data
          , room        = section.room
          , chapter     = section.chapter
          , sort        = DB.record.find({"room" : room, "chapter" : chapter, "section" : section }).count()
          ;
        Meteor.call("addParagraph", section._id, sort);
      }
  }
);

Template.section_paragraph.helpers(
  //根據paragraph狀態計算article class
  {"status"       :
      function() {
        var paragraph   = this
          , result      = {"data-id" : paragraph._id}
          ;
        if (paragraph.editing) {
          if (paragraph.editing === Meteor.userId()) {
            result["class"] = "editing";
          }
          else {
            result["class"] = "be-editing";
          }
        }
        return result;
      }
  //編輯是否已過期
  ,"overTime"     :
      function() {
        var paragraph = this;
        //30分鐘前的視為過期
        if (paragraph.time + 30 * 60 * 1000 > Date.now()) {
          return true;
        }
        else {
          return false;
        }
      }
  ,"editable"     :
      function() {
        var paragraph = this
          , ins
          ;
        if (paragraph.editing === Meteor.userId()) {
          //focus
          ins = Template.instance();
          _.defer(function() {
            ins.$("div.paragraph").trigger("focus");
          });
          return {"contenteditable" : true};
        }
        else {
          return {"contenteditable" : false};
        }
      }
  ,"timeChinese"  : UTIL.convertTimeToChinese
  ,"getNick"      : UTIL.getUserNick
  }
);

Template.section_paragraph.events(
  //取消選取
  {"click" :
      function(e, ins) {
        e.stopPropagation();
        $(ins.firstNode).toggleClass("focus");
      }
  //插入
  ,"click [data-action=\"addBefore\"]" :
      function(e, ins) {

      }
  //編輯
  ,"click [data-action=\"edit\"]" :
      function(e, ins) {
        var paragraph = ins.data;
        e.stopPropagation();
        DB.record.update(
          paragraph._id
        , {"$set" : {"editing" : Meteor.userId()}
          }
        );
      }
  //取消編輯
  ,"click [data-action=\"stopEdit\"]" :
      function(e, ins) {
        var paragraph = ins.data;
        e.stopPropagation();
        if (paragraph.editing === Meteor.userId() || paragraph.time + 30 * 60 * 1000 > Date.now()) {
          DB.record.update(
            paragraph._id
          , {"$set" : {"editing" : false}
            }
          );
        }
      }
  }
);

Template.section_outside.helpers(
  {"allOutside"   :
      function() {
        return DB.message_all.find(
          {"section"  : this._id
          ,"$or"      :
              [ {"type"       : "outside"
                }
              , {"type"       : "dice"
                ,"paragraph"  : {"$exists" : false}
                }
              ]
          ,"type"     :
              {"$in"          : ["outside", "dice"]
              }
          }
        , {"sort"     : {"_id" : 1}
          }
        );
      }
  ,"timeChinese"  : UTIL.convertTimeToChinese
  ,"getNick"      : UTIL.getUserNick
  ,"typeOutside"  :
      function() {
        return (this.type === "outside");
      }
  ,"typeDice"     :
      function() {
        return (this.type === "dice");
      }
  ,"diceResult"   :
      function() {
        return UTIL.parseDice(this);
      }
  }
);

//require end
 }
);