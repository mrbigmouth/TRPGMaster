"use strict";
require(
  ["db"
  ,"subscribe"
  ]
, function() {
    var DB        = require("db")
      , SUBSCRIBE = require("subscribe")
      , exports   = Router
      ;
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

            data.explain = params.explainId;
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

    //首頁
    Router.route(
      "home"
    , {"path"             : "/"
      ,"fastRender"       : true
      }
    );

    //網站說明
    Router.route(
      "explain"
    , {"path"             : "/explain/:explainId"
      }
    );

    //房間區
    Router.route(
      "room"
    , {"path"             : "/room/:roomId"
      ,"waitOn"           :
          function() {
            var params = this.params;
            return Meteor.subscribe("room", params.roomId);
          }
      ,"fastRender"       : true
      }
    );

    //房間紀錄區
    Router.route(
      "chapter"
    , {"path"             : "/room/:roomId/record/:chapterId"
      ,"waitOn"           :
          function() {
            var params = this.params;
            return [
              Meteor.subscribe("room", params.roomId)
            , Meteor.subscribe("chapter", params.roomId, params.chapterId)
            ];
          }
      ,"action"           :
          function() {
            var controller    = this
              , params        = this.params
              , firstSection  =
                  DB.record.findOne(
                    {"room"     : params.roomId
                    ,"chapter"  : params.chapterId
                    ,"section"  : {"$exists" : false}
                    }
                  , {"sort"     : {"sort" : 1}
                    }
                  )
              ;
            controller.render("section", {"data" : firstSection})
          }
      ,"fastRender"       : true
      }
    );
    Router.route(
      "section"
    , {"path"             : "/room/:roomId/record/:chapterId/:sectionId"
      ,"waitOn"           :
          function() {
            var params = this.params;
            return [
              Meteor.subscribe("room", params.roomId)
            , Meteor.subscribe("section", params.roomId, params.chapterId, params.sectionId)
            ];
          }
      ,"action"           :
          function() {
            var controller    = this
              , params        = this.params
              , section       = DB.record.findOne(params.sectionId)
              ;
            controller.render("section", {"data" : section})
          }
      ,"fastRender"       : true
      }
    );
    
    return exports;
  }
);
