"use strict";
define(
  "util"
, []
, function() {
    var exports;
    exports =
      //取得已知_id之user之nick
      {"getUserNick" :
          function(user) {
            user = Meteor.users.findOne(user);
            if (user) {
              return user.profile.nick;
            }
            else {
              return "不明人物";
            }
          }
      //轉換timeStamp為中文時間
      ,"convertTimeToChinese" :
          function(time) {
            time = parseInt(time, 10);
            if (time) {
              return moment(time).format("[(]YYYY/MM/DD HH:mm:ss[)]");
            }
            else {
              return "(????/??/?? ??:??:??)"
            }
          }
      //判斷一個物件的各key是否undefined
      ,"keyIsUndefined" :
          function() {
            var undefined
              , i
              ;
            for (i in arguments) {
              if (this[ arguments[ i ] ] !== undefined) {
                return false;
              }
            }
            return true;
          }
      //結受骰子資料顯示結果
      ,"parseDice" :
          function(diceData) {
            var record  = diceData.result
              , number  = record.length
              , face    = diceData.face
              , add     = diceData.add + diceData.extra
              , addSign = ((add >= 0) ? "+ " : "- ")
              , sum     = 0
              , result
              ;
            if (diceData.addEach) {
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
      };
    return exports;
  }
);