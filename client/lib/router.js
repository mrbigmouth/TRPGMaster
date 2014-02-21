/*
RouterRun = 
    Deps.autorun(function () {
      var undefined;
      if (Meteor.Router.page() !== 'main_chapter') {
        //取消所有已訂閱的paragraph
        _.each(SCRIBE.paragraph, function(v){
          v.stop();
        });
        SCRIBE.paragraph = {};
      }

      switch (Meteor.Router.page()) {
      //進入房間後載入所有該房角色名
      case 'main_room'      :
        SCRIBE.characterName = Meteor.subscribe('characterName', RouterParams.room);
        break;
      case 'main_document'  :
        SCRIBE.document = Meteor.subscribe('document', RouterParams.room);
        break;
      case 'main_chapter'   :
        //訂閱章節
        SCRIBE.section = Meteor.subscribe('section', RouterParams.room, RouterParams.chapter);
        //訂閱地圖
        SCRIBE.map = Meteor.subscribe('map', RouterParams.chapter);
        break;
      case 'main_character' :
        SCRIBE.character =
          Meteor.subscribe(
            'character'
          , RouterParams.character
          , function() {
              var character = DB.character.findOne(RouterParams.character);
              RouterParams.room = character.room;
              Session.set('RouterParams', RouterParams);
            }
          );
        break;
      case 'main_map' :
        SCRIBE.map_detail =
          Meteor.subscribe(
            'map_detail'
          , RouterParams.room
          , RouterParams.map
          , RouterParams.round
          , $.noop()
          );
        break;
      }

      Session.set('RouterParams', RouterParams);
    });
*/
//定義各route路徑handler
/*
Meteor.Router.add(
  {'/room/:rid/'       :
      {'to'  : 'main_room'
      ,'and' :
          function(rid) {
            RouterParams = {'room' : rid};
            RouterRun.invalidate();
          }
      }
  ,'/room/:rid/doc/'       :
      {'to'  : 'main_document'
      ,'and' :
          function(rid) {
            RouterParams = {'room' : rid, 'document' : location.hash.replace('#', '')};
            RouterRun.invalidate();
          }
      }
  ,'/room/:rid/:cid/' :
      {'to'  : 'main_chapter'
      ,'and' :
          function(rid, cid) {
            RouterParams =
                {'room'    : rid
                ,'chapter' : cid
                ,'section' : location.hash.replace('#', '')
                }
            RouterRun.invalidate();
          }
      }  
  ,'/character/:cid/'  :
      {'to'  : 'main_character'
      ,'and' :
          function(cid) {
            RouterParams = {'character' : cid};
          }
      }
  ,'/map/:rid/:mid/'        :
      {'to'  : 'main_map'
      ,'and' :
          function(rid, mid) {
            RouterParams =
              {'room'  : rid
              ,'map'   : mid
              ,'round' : 0
              };
          }
      }
  ,'/map/:rid/:mid/:round/'        :
      {'to'  : 'main_map'
      ,'and' :
          function(rid, mid, round) {
            RouterParams =
              {'room'  : rid
              ,'map'   : mid
              ,'round' : round
              };
          }
      }
  ,'*'                 :
      {'to'  : 'main_explain'
      ,'and' :
          function() {
            RouterParams = {};
          }
      }
  }
);
*/