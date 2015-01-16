var DB = require("db");

DB.record.allow(
  {"insert" :
      function(userID, doc) {
        var result = false
          , room
          ;
        doc.time = Date.now();
        doc._id = (doc.time + "");
        doc.user = userID;
        if (userID === TRPG.adm || doc.room === TRPG.public.id) {
          result = true;
        }
        else {
          room = DB.room.findOne({"_id" : doc.room});
          if (room && (room.adm.indexOf(userID) !== -1 || room.player.indexOf(userID) !== -1)) {
            result = true;
          }
        }
        //確定修改後
        if (result) {
          //若修改之文件有section，同步修改其時間
          if (doc.section) {
            DB.record.update(doc.section, {"$set" : {"time" : doc.time } });
          }
          //若修改之文件有chapter，同步修改其時間
          if (doc.chapter) {
            DB.record.update(doc.chapter, {"$set" : {"time" : doc.time } });
          }
          //若修改之文件有room，同步修改其時間
          if (doc.room) {
            DB.room.update(doc.room, {"$set" : {"time" : doc.time } });
          }
          return true;
        }
        return false;
      }
  ,"update" :
      function(userID, doc) {
        var result = false
          , now    = Date.now()
          , content= doc.conent
          , room
          ;
        //若修改者為最近一次的修改者則通過
        if (userID == doc.user) {
          result = true;
        }
        else {
          doc.user = userID;
          //若修改者為總adm則通過
          if (userID === TRPG.adm) {
            result = true;
          }
          else {
            //若修改者為room adm則通過
            room = DB.room.findOne({"_id" : doc.room});
            if (room && room.adm.indexOf(userID) !== -1) {
              result = true;
            }
          }
        }
        //確定修改後
        if (result) {
          //更新最後更新時間
          DB.record.update({"_id" : doc._id}, {"$set" : {"time" : now } });
          //若修改之文件有section，同步修改其時間
          if (doc.section) {
            DB.record.update({"_id" : doc.section}, {"$set" : {"time" : now } });
          }
          //若修改之文件有chapter，同步修改其時間
          if (doc.chapter) {
            DB.record.update({"_id" : doc.chapter}, {"$set" : {"time" : now } });
          }
          //若修改之文件有room，同步修改其時間
          if (doc.room) {
            DB.room.update({"_id" : doc.room}, {"$set" : {"time" : now } });
          }
          return true;
        }
        return false;
      }
  ,"remove" :
      function(userID, doc) {
        var result = false
          , now    = Date.now()
          ;
        if (userID === TRPG.adm || userID == doc.user) {
          result = true;
        }
        var room = DB.room.findOne({"_id" : doc.room});
        if (room && room.adm.indexOf(userID) !== -1) {
          result = true;
        }
        //確定修改後
        if (result) {
          //更新最後更新時間
          DB.record.update({"_id" : doc._id}, {"$set" : {"time" : now } });
          //若修改之文件有section，同步修改其時間
          if (doc.section) {
            DB.record.update({"_id" : doc.section}, {"$set" : {"time" : now } });
          }
          //若修改之文件無section有chapter(為section)
          else if (doc.chapter) {
            //刪除所對應之地圖
            DB.map.remove({"section" : doc._id});
          }
          //若修改之文件有chapter，同步修改其時間
          if (doc.chapter) {
            DB.record.update({"_id" : doc.chapter}, {"$set" : {"time" : now } });
          }
          //若修改之文件有room，同步修改其時間
          if (doc.room) {
            DB.room.update({"_id" : doc.room}, {"$set" : {"time" : now } });
          }
          return true;
        }
        return false;
      }
  }
);

Meteor.publish("chapter", function (room, chapter, sectionID) {
  var secionFilter =
      {"$or" :
        //訂閱所有一週內更新的section
        [ {"room"    : room
          ,"chapter" : chapter
          ,"section" : {"$exists" : false}
          ,"time"    : {"$gte" : (Date.now() - 604800000)}
          }
        //指定的section
        , {"_id" : sectionID}
        ]
      }
    , section    = DB.record.find(secionFilter)
    , sectionIds = _.pluck(section.fetch(), "_id")
    ;

  //條件中新增已訂閱的section下的所有段落
  secionFilter.$or.push(
    {"room"    : room
    ,"chapter" : chapter
    ,"section" : {"$in" : sectionIds}
    }
  );
  //移除第一條件，改為訂閱所有section
  secionFilter.$or.shift();
  secionFilter.$or.push(
    {"room"    : room
    ,"chapter" : chapter
    ,"section" : {"$exists" : false}
    }
  );
  
  return [
    DB.record.find(secionFilter)
  //已訂閱章節下的所有擲骰跟場外訊息
  , DB.message_all.find({"chapter" : chapter, "type" : {"$in" : ["outside", "dice"]}})
  ];
});


Meteor.publish("section", function (section) {;
  return [
    DB.record.find(section)
  //, DB.message_all.find({"section" : section})
  ];
});

/*
Meteor.methods(
  {"paragraphIncrement" :
    function(room, chapter, section, from, inc) {
      DB.record.update({"room"    : room
                       ,"chapter" : chapter
                       ,"section" : section
                       ,"sort"    : { "$gte" : from }
                      }
                      ,{"$inc"    :
                          {"sort" : inc
                          }
                       }
                      ,{"multi"   : true}
                      );
      return true;
    }
  }
)


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