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
                var layout = require("layout");
                //有新訊息時打開訊息列
                layout.openPane("message");
                scrollDown();
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
        var record  = this.result
          , number  = record.length
          , face    = this.face
          , add     = this.add
          , addSign = ((add >= 0) ? "+ " : "")
          , sum     = 0
          , result
          ;
        if (this.addEach) {
          result = "[1d" + face + addSign + add + "] x " + number + "結果分別為 ";
          result += 
              (_.map(record, function(v) {
                var total = v + add;
                sum += total;
                return v + "(" + ( total ) + ")";
              })).join(",");
          result += " 總合為 " + sum + " 。";
        }
        else {
          result = number + "d" + face + addSign + add + "結果為 ";
          result += record.join(",");
          result += " 總合為";
          result += _.reduce(record, function(memo, v) { return memo + v;}, add);
          result += " 。";
        }
        return result;
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
  {"click button.btn"   :
      function (e, ins) {
        var $msg  = $(ins.find("input.msg"))
          , param = ins.data
          , data
          , temp
          ;

        data = 
          {"type" : "chat"
          ,"msg"  : $msg.val()
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
        $msg.val("");
      }
  }
);

//require end
  }
);