SCRIBE =
    //起始自動訂閱所有room，與可見room下的所有chapter
    {'room'          :
        Meteor.subscribe('room', function() {
          Deps.autorun(function () {
            var rooms = DB.room.find().fetch();
            SCRIBE.chapter = Meteor.subscribe('chapter', _.pluck(rooms, '_id'));
          });
        })
    //起始未訂閱:某一房間的所有chapter
    ,'chapter'       : false
    //起始未訂閱:某一chapter的所有section
    ,'section'       : false
    //起始未訂閱:某一section的所有paragraph
    ,'paragraph'     : {}
    //起始自動訂閱所有message
    ,'message'       : Meteor.subscribe('message')
    //起始未訂閱:某一房間的所有文檔資料
    ,'document'      : false
    //起始未訂閱:某一房間的所有角色名
    ,'characterName' : false
    //起始未訂閱:某一特定角色的所有資料
    ,'character'     : false
    //起始訂閱:屬於使用者的角色
    ,'myCharacter'   : Meteor.subscribe('myCharacter')
    //起始訂閱:所有暱稱
    ,'userNick'      : Meteor.subscribe('userNick')
    //起始未訂閱:某一特定chapter的所有地圖資料
    ,'map'           : false
    //起始未訂閱:某一特定map的所有格子資料
    ,'map_detail'    : false
    }


var RouterParams = {}
  , RouterRun
  ;
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
        Session.set('room', DB.room.findOne(RouterParams.room));
        Session.set('chapter');
        break;
      case 'main_chapter'   :
        //訂閱章節
        SCRIBE.section = Meteor.subscribe('section', RouterParams.room, RouterParams.chapter);
        /*
        if (RouterParams.section && SCRIBE.paragraph[ RouterParams.section ] === undefined) {
          SCRIBE.paragraph[ RouterParams.section ] =
              Meteor
                .subscribe( 'paragraph'
                          , RouterParams.room
                          , RouterParams.chapter
                          , RouterParams.section
                          );
        }
        */
        //訂閱地圖
        SCRIBE.map = Meteor.subscribe('map', RouterParams.chapter);
        break;
      case 'main_character' :
        console.log('subscribe start!');
        SCRIBE.character =
          Meteor.subscribe(
            'character'
          , RouterParams.character
          , function() {
              console.log('subscribe done!');
              var character = DB.character.findOne(RouterParams.character);
              Session.set('character', character);
              Session.set('room', character && DB.room.findOne(character.room));
            }
          );
        break;
      case 'main_map' :
        SCRIBE.map_detail =
          Meteor.subscribe(
            'map_detail'
          , RouterParams.room
          , RouterParams.map
          , function() {
              Session.set('map', DB.map.findOne(RouterParams.map));
              Session.set('room', DB.room.findOne(RouterParams.room));
            }
          );
        break;
      }

      Session.set('RouterParams', RouterParams);
    });

//定義各route路徑handler
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
            if (! Session.get('hash')) {
              Session.set('hash', location.hash);
            }
            RouterParams = {'room' : rid};
            RouterRun.invalidate();
          }
      }
  ,'/room/:rid/:cid/' :
      {'to'  : 'main_chapter'
      ,'and' :
          function(rid, cid) {
            if (! Session.get('hash')) {
              Session.set('hash', location.hash);
            }
            RouterParams =
                {'room'    : rid
                ,'chapter' : cid
                ,'section' : Session.get('hash').replace('#', '')
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
              {'room' : rid
              ,'map'  : mid
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