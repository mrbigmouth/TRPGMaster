DB.map.allow(
  {'insert' :
      function(userID, doc) {
        var result = false;

        doc.time = Date.now()
        doc.user = userID;

        if (userID === TRPG.adm || doc.room === TRPG.public.id) {
          result = true;
        }
        else {
          var room = DB.room.findOne(doc.room);
          if (room && room.adm.indexOf(userID) !== -1) {
            result = true;
          }
        }
        return result;
      }
  ,'update' :
      function(userID, doc) {
        if (userID === TRPG.adm || doc.room === TRPG.public._id) {
          return true;
        }
        var room = DB.room.findOne(doc.room);
        if (room && room.adm.indexOf(userID) !== -1) {
          return true;
        }
        return false;
      }
  ,'remove' :
      function(userID, doc) {
        if (userID == TRPG.adm || doc.room === TRPG.public._id) {
          return true;
        }
        return false;
      }
  }
);

DB.map_grid.allow(
  {'insert' :
      function(userID, doc) {
        var result = false
          , map
          , room
          ;

        map = DB.map.findOne(doc.map);
        if (! map) {
          return false;
        }
        if (userID === TRPG.adm) {
          result = true;
        }
        else {
          room = DB.room.findOne(map.room);
          if (map && room && (room._id === TRPG.public._id  || room.adm.indexOf(userID) !== -1) ) {
            result = true;
          }
        }
        if (result) {
          doc._id = Date.now() + '';
          if (map.section) {
            DB.record.update(map.section, {'$set' : {'time' : Date.now() } });
          }
          return true;
        }
        else {
          return false;
        }
      }
  ,'update' :
      function(userID, doc) {
        var result = false
          , map
          , room
          ;

        map = DB.map.findOne(doc.map);
        if (! map) {
          return false;
        }
        if (userID === TRPG.adm) {
          result = true;
        }
        else {
          room = DB.room.findOne(map.room);
          if (map && room && (room._id === TRPG.public._id  || room.adm.indexOf(userID) !== -1) ) {
            result = true;
          }
        }
        if (result) {
          if (map.section) {
            DB.record.update(map.section, {'$set' : {'time' : Date.now() } });
          }
          return true;
        }
        else {
          return false;
        }
      }
  ,'remove' :
      function(userID, doc) {
        var result = false
          , map
          , room
          ;

        map = DB.map.findOne(doc.map);
        if (! map) {
          return false;
        }
        if (userID === TRPG.adm) {
          result = true;
        }
        else {
          room = DB.room.findOne(map.room);
          if (map && room && (room._id === TRPG.public._id  || room.adm.indexOf(userID) !== -1) ) {
            result = true;
          }
        }
        if (result) {
          if (map.section) {
            DB.record.update(map.section, {'$set' : {'time' : Date.now() } });
          }
          return true;
        }
        else {
          return false;
        }
      }
  }
)
DB.map_detail.allow(
  {'insert' :
      function(userID, doc) {
        var result = false
          , map
          , room
          ;

        map = DB.map.findOne(doc.map);
        if (! map) {
          return false;
        }
        if (userID === TRPG.adm) {
          result = true;
        }
        else {
          room = DB.room.findOne(map.room);
          if (map && room && (room._id === TRPG.public._id  || room.adm.indexOf(userID) !== -1) ) {
            result = true;
          }
        }
        if (result) {
          doc._id = Date.now() + '';
          if (map.section) {
            DB.record.update(map.section, {'$set' : {'time' : Date.now() } });
          }
          return true;
        }
        else {
          return false;
        }
      }
  ,'update' :
      function(userID, doc) {
        var result = false
          , map
          , room
          ;

        map = DB.map.findOne(doc.map);
        if (! map) {
          return false;
        }
        if (userID === TRPG.adm) {
          result = true;
        }
        else {
          room = DB.room.findOne(map.room);
          if (map && room && (room._id === TRPG.public._id  || room.adm.indexOf(userID) !== -1) ) {
            result = true;
          }
        }
        if (result) {
          if (map.section) {
            DB.record.update(map.section, {'$set' : {'time' : Date.now() } });
          }
          return true;
        }
        else {
          return false;
        }
      }
  ,'remove' :
      function(userID, doc) {
        var result = false
          , map
          , room
          ;

        map = DB.map.findOne(doc.map);
        if (! map) {
          return false;
        }
        if (userID === TRPG.adm) {
          result = true;
        }
        else {
          room = DB.room.findOne(map.room);
          if (map && room && (room._id === TRPG.public._id  || room.adm.indexOf(userID) !== -1) ) {
            result = true;
          }
        }
        if (result) {
          if (map.section) {
            DB.record.update(map.section, {'$set' : {'time' : Date.now() } });
          }
          return true;
        }
        else {
          return false;
        }
      }
  }
)

Meteor.publish('mapList', function (chapter) {
  return DB.map.find(
          {'chapter' : chapter}
        , {'fields'  : {'_id' : 1, 'chapter' : 1,'name' : 1}
          }
        );
});


Meteor.publish('map', function (roomID, mapID, round) {
  var userID = this.userID
    , room   = DB.room.findOne(roomID)
    , map    = DB.map.findOne(mapID)
    , round
    ;

  if (! map || ! room ||  map.room !== roomID) {
    this.error(new Meteor.Error(404, '錯誤的訂閱參數!', '錯誤的訂閱參數!'));
  }
  if (! room.public && userID !== TRPG.adm && room.adm.indexOf(userID) === -1 && room.player.indexOf(userID) === -1) {
    this.error(new Meteor.Error(401, '權限不足!', '權限不足!'));
  }
  round = round ? round : map.round;
  return [ DB.map.find(mapID)
         , DB.map_grid.find({'map' : mapID, 'round' : round})
         , DB.map_detail.find({'map' : mapID, 'round' : round})
         , DB.message_all.find({'chapter' : map.chapter, 'type' : {'$in' : ['outside', 'dice', 'chat']} })
         ];
});
