//DB宣告在廣域
DB =
  {"room"           : new Meteor.Collection("room")
  ,"record"         : new Meteor.Collection("record")
  ,"message_all"    : new Meteor.Collection("message_all")
  ,"character"      : new Meteor.Collection("character")
  ,"character_data" : new Meteor.Collection("character_data")
  ,"document"       : new Meteor.Collection("document")
  ,"map"            : new Meteor.Collection("map")
  ,"map_grid"       : new Meteor.Collection("map_grid")
  ,"map_detail"     : new Meteor.Collection("map_detail")
  };

//Subscribe manager
SUBSCRIBE = new SubsManager();

//Router基本設定
Router.configure(
  {"notFoundTemplate" : "notFound"
  ,"loadingTemplate"  : "loading"
  ,"yieldRegions"     :
      {"header"           : {"to" : "north"}
      }
  ,"waitOn"           :
      function() {
        return SUBSCRIBE.subscribe("initialize");
      }
  ,"onBeforeAction"   :
      function() {
        var controller = this
          , params     = controller.params
          , data       = {}
          ;

        if (params.roomId) {
          data.room = DB.room.findOne(params.roomId);
        }
        if (params.characterId) {
          data.character = DB.character.findOne(params.characterId);
        }
        if (params.chapterId) {
          data.chapter = DB.record.findOne(params.chapterId);
        }
        if (params.sectionId) {
          data.section = DB.record.findOne(params.sectionId);
        }
        if (params.mapId) {
          data.map = DB.record.findOne(params.mapId);
        }
        controller.layout(
          "layout"
        , {"data" : data}
        );
        controller.next();
      }
  }
);
//不需要轉換router name
Router.setTemplateNameConverter(_.identity);

Router.route(
  "home"
, {"path"             : "/"
  ,"fastRender"       : true
  }
);


if (Meteor.isClient) {
  //允許javascript:; href
  Blaze._allowJavascriptUrls();
  //連線斷線通知
  if (Meteor.absoluteUrl() !== "http://127.0.0.1:13667/") {
    var initialized = false
      , disconnect  = false
      ;
    Deps.autorun(function () {
      var connected = Meteor.status().connected;
      if (initialized) {
        if (connected) {
          if (disconnect) {
            alert("已恢復與伺服器間的連線！");
            disconnect = false;
          }
        }
        else {
          if (disconnect === false) {
            alert("注意！已失去與伺服器間的連線，此時所做的任何資料更改將不會更新至伺服器上！");
            disconnect = true;
          }
        }
      }
      else {
        if (connected) {
          initialized = true;
        }
      }
    });
  }
}
else {
  //登入時訂閱
  Meteor.publish(
    "initialize"
  , function () {
      var userID = this.userId
        , room
        , roomIds
        , chapter
        , message
        , users
        , character
        , characterID
        , dice
        ;

      //房間
      if (userID === CONFIG.adm) {
        room = DB.room.find();
      }
      else {
        room =
          DB.room.find(
            {"$or"    :
                [{"_id"    : CONFIG.public._id}
                ,{"public" : true}
                ,{"adm"    : userID}
                ,{"player" : userID}
                ]
            }
          );
      }
      roomIds = _.pluck(room.fetch(), "_id");

      //章節
      chapter =
          DB.record.find(
            {"room"     : {"$in" : roomIds}
            ,"chapter"  : {"$exists" : false}
            }
          );

      //一週內訊息
      message =
          DB.message_all.find(
            {"$or"  :
                [ {"room" : {"$in" : roomIds }
                  }
                , {"room" : {"$exists" : false }
                  }
                ]
            ,"time" :
                {"$gte" : Date.now() - 604800000}
            }
          );

      //訊息內有的玩家暱稱或(adm)所有玩家資料
      if (userID === CONFIG.adm) {
        users = Meteor.users.find();
      }
      else {
        users = Meteor.users.find({}, {"fields": {"profile.nick" : 1}});
      }
      

      //自己角色的擲骰資料 
      character =
          DB.character.find(
            {"adm"    : userID}
          , {"fields" :
                {"name"   : 1
                ,"adm"    : 1
                ,"room"   : 1
                }
            }
          );
      characterID = _.pluck(character.fetch(), "_id");
      dice =
          DB.character_data.find(
            {"character"  : {"$in" : characterID}
            ,"type"       : "dice"
            }
          );

      return [room, chapter, message, users, character, dice];
    }
  );
}