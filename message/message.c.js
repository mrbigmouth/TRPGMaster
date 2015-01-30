"use strict";
//require start
require(
  ["db"
  ,"config"
  ,"util"
  ]
, function() {

var DB    = require("db")
  , TOOL  = require("util")
  , TRPG  = require("config")
  ;

Template.message.helpers(
  //篩選列-所有房間
  {"allRooms" :
      function() {
        var result;
        result =
          DB.room.find(
            {"status" : { "$gt"     : 0 }
            }
          , {"sort"   : { "status"  : 1 }
            }
          );
        return result;
      }
  }
);

Template.message.events(
  //開啟篩選列
  {"click .openFilter" :
      function(e, ins) {
        $("#message").addClass("filterOpened");
      }
  //關閉篩選列
  ,"click .closeFilter" :
      function(e, ins) {
        $("#message").removeClass("filterOpened");
      }
  //開啟聊天列
  ,"click .openChat" :
      function(e, ins) {
        $("#message").addClass("chatOpened");
      }
  //開啟聊天列
  ,"click .closeChat" :
      function(e, ins) {
        $("#message").removeClass("chatOpened");
      }
  }
);


//訊息列篩選條件
var msgFilter     =
      new ReactiveVar(
        {}
      , function(oldData, newData) {
          return EJSON.equals(oldData, newData);
        }
      );
//篩選訊息列
Template.message.events(
  {"change #message_filter select, change #message_filter input" :
      function() {
        var $filter = $("#message_filter")
          , room    = $filter.find("select").val()
          , $type   = $filter.find("input.type:checked")
          , types   = []
          , filter  =
              {"time" : {"$gte" : Date.now() - 604800000}
              }
          ;

        if (room !== "") {
          filter.room = room;
        }
        $type.each(function() {
          types.push( this.name );
        });
        filter.type = {"$in" : types};
        msgFilter.set(filter);
      }
  }
);

var scrollDown =
      _.debounce(
        function() {
          var $message = $("#message_list");
          $message.scrollTop( $message.prop("scrollHeight") );
        }
      , 100);
Template.message_list.helpers(
  //所有訊息
  {"allMsgs"     :
      function () {
        var cursor     =
              DB.message_all.find(
                msgFilter.get()
              , {"sort" : {"time" : 1} }
              )
          ;

        cursor.observeChanges(
          {"added" :
              function() {
                var layout = require("layout").ins;
                if (layout) {
                  //有新訊息時打開訊息列
                  layout.openPane("message");
                  scrollDown();
                }
              }
          }
        );
        return cursor;
      }
  //時間中文化
  ,"timeChinese" : TOOL.convertTimeToChinese
  //使用者id轉暱稱
  ,"getNick"     : TOOL.getUserNick
  //房間id轉暱稱
  ,"roomName"    :
      function(room) {
        room = DB.room.findOne({"_id" : room});
        return room ? room.name : "";
      }
  //訊息類別轉中文
  ,"typeChinese" :
      function(type) {
        return TRPG.options.messageType[ type ];
      }
  ,"typeChat"    :
      function() {
        return (this.type === "chat") || (this.type === "outside");
      }
  ,"typeSystem"    :
      function() {
        return (this.type === "room") || (this.type === "system");
      }
  ,"typeDice"    :
      function() {
        return (this.type === "dice");
      }
  ,"diceResult"  :
      function() {
        return TOOL.parseDice(this);
      }
  ,"isRecord"    :
      function() {
        return (this.room && this.chapter && this.section);
      }
  ,"isDocument"  :
      function() {
        return (this.room && this.document);
      }
  ,"isCharacter"    :
      function() {
        return !!(this.character);
      }
  }
);

//發言
Template.message_chat.events(
  //發聊天訊息
  {"submit #message_chat" :
      function (e, ins) {
        var input = ins.find("#message_chat_send")
          , value = input.value.replace(/^[\s]*|[\s]*$/g, "")
          , param = ins.data
          , data
          , temp
          ;

        if (! value) {
          return false;
        }
        data = 
          {"type" : "chat"
          ,"msg"  : input.value
          };
        temp = param.room;
        if (temp) {
          data.room = temp;
          temp = param.chapter;
          if (temp) {
            data.chapter = temp;
          }
        }
        else {
          data.room = TRPG.public._id;
        }
        DB.message_all.insert(data);
        input.value = "";
      }
  }
);

//require end
  }
);