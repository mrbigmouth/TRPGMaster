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
  {"isAdm"          : UTIL.isAdm
  ,"isPlayer"       : UTIL.isPlayer
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
  //編輯新標題
  {"click [data-action=\"editTitle\"]" :
      function(e, ins) {
        var insData = ins.data
          , title   = window.prompt("請輸入新標題：", insData.name)
          ;
        e.stopPropagation();

        if (title) {
          insData.name = title;
          Meteor.call("upsertRecord", insData);
        }
      }
  //選取全部
  ,"click [data-action=\"selectAll\"]" :
      function(e, ins) {
        e.stopPropagation();
        ins.$("article").addClass("focus");
      }
  //取消全部選取
  ,"click [data-action=\"cancelAll\"]" :
      function(e, ins) {
        e.stopPropagation();
        ins.$("article.focus").not(".editing").removeClass("focus");
      }
  //添加新段落
  ,"click [data-action=\"addParagraph\"]" :
      function(e, ins) {
        var section     = ins.data
          , room        = section.room
          , chapter     = section.chapter
          , sort        = DB.record.find({"room" : room, "chapter" : chapter, "section" : section._id }).count()
          ;
        Meteor.call(
          "upsertRecord"
        , {"room"    : section.room
          ,"chapter" : section.chapter
          ,"section" : section._id
          ,"sort"    : sort
          ,"content" : ""
          ,"editing" : Meteor.userId()
          }
        );
      }
  //場外發言
  ,"click [data-action=\"outside\"]" :
      function(e, ins) {
        var section = ins.data
          , message
          , msg
          ;
        e.stopPropagation();
        msg = window.prompt('請輸入場外發言：');
        if (msg) {
          message = 
            {"room"    : section.room
            ,"chapter" : section.chapter
            ,"section" : section._id
            ,"type"    : "outside"
            ,"msg"     : msg
            };
          Meteor.call("insertMessage", message);
        }
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
        //console.log(paragraph.time + 30 * 60 * 1000, Date.now(), paragraph.time + 30 * 60 * 1000 > Date.now());
        //30分鐘前的視為過期
        if (paragraph.time + 30 * 60 * 1000 <= Date.now()) {
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
  ,"isUser"       :
      function(userId) {
        return (userId === Meteor.userId())
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
        var paragraph = ins.data;
        e.stopPropagation();
        //增加所有原後續段落的sort
        Meteor.call(
          "incrementParagraphSort"
        , paragraph.section
        , paragraph.sort
        , 1
        , function() {
            //插入新段落
            newParagraph = _.omit(paragraph, "_id");
            newParagraph.content = "";
            newParagraph.editing = Meteor.userId();
            Meteor.call("upsertRecord", newParagraph);
          }
        );
      }
  //接續
  ,"click [data-action=\"addAfter\"]" :
      function(e, ins) {
        var paragraph = ins.data;
        e.stopPropagation();
        //增加所有原後續段落的sort
        Meteor.call(
          "incrementParagraphSort"
        , paragraph.section
        , paragraph.sort + 1
        , 1
        , function() {
            //插入新段落
            newParagraph = _.omit(paragraph, "_id");
            newParagraph.content = "";
            newParagraph.sort += 1;
            newParagraph.editing = Meteor.userId();
            Meteor.call("upsertRecord", newParagraph);
          }
        );
      }
  //上移
  ,"click [data-action=\"moveBefore\"]" :
      function(e, ins) {
        var $article = ins.$("article");
        e.stopPropagation();
        //增加所有原後續段落的sort
        Meteor.call(
          "switchParagraphSort"
        , $article.attr("data-id")
        , $article.prev("article").attr("data-id")
        );
      }
  //下移
  ,"click [data-action=\"moveAfter\"]" :
      function(e, ins) {
        var $article = ins.$("article");
        e.stopPropagation();
        //增加所有原後續段落的sort
        Meteor.call(
          "switchParagraphSort"
        , $article.attr("data-id")
        , $article.next("article").attr("data-id")
        );
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
  //刪除
  ,"click [data-action=\"delete\"]" :
      function(e, ins) {
        var paragraph = ins.data;
        if (window.confirm("確定要刪除此紀錄？")) {
          DB.record.remove(
            paragraph._id
          , function() {
              Meteor.call(
                "incrementParagraphSort"
              , paragraph.section
              , paragraph.sort
              , -1
              );
            }
          );
        }
      }
  //送出編輯內容
  ,"click [data-action=\"submit\"]" :
      function(e, ins) {
        var paragraph = ins.data
          , $paragraph
          , contents
          , number
          , newParagraph
          ;
        e.stopPropagation();
        //只有正編輯者可以更新
        if (paragraph.editing === Meteor.userId()) {
          //取得目前編輯的段落總數
          $paragraph = ins.$("div.paragraph");
          //將所有文字節段依順序轉為文字陣列
          contents =
            _.map(
              $paragraph.add( $paragraph.find("*") )
                .contents()
                .filter(
                  function () {
                    return (this.nodeType === 3 && this.nodeValue.replace(/\s/g, ""));
                  }
                )
            , function(node) {
                return ("" + node.nodeValue).replace(/^\s+|\s+$/g, "");
              }
            );
          //將第一段落更新至原段落的content
          paragraph.editing = false;
          paragraph.content = contents.shift();
          Meteor.call(
            "upsertRecord"
          , paragraph
          , function(error, msg) {
              if (! error) {
                //重置dom
                $paragraph
                  .html("<p>" + msg.content + "</p>")
                  .closest("article")
                    .removeClass("focus");
              }
            }
          );
          //若有新增段落
          if (contents.length) {
            //增加所有原後續段落的sort
            Meteor.call(
              "incrementParagraphSort"
            , paragraph.section
            , paragraph.sort + 1
            , contents.length
            , function() {
                //插入新段落
                newParagraph = _.omit(paragraph, "_id");
                _.each(
                  contents
                , function(content, index) {
                    newParagraph.content = content;
                    newParagraph.sort += 1;
                    Meteor.call("upsertRecord", newParagraph);
                  }
                );
              }
            );
          }
        }
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
          , function() {
              //重置dom
              ins.$("div.paragraph").html("<p>" + paragraph.content + "</p>");
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
