DB.map.allow(
  {'insert' :
      function(userID, doc) {
        var result = false;

        doc._id = (Date.now() + '');
        doc.user = userID;

        if (userID === TRPG.adm || doc.room === TRPG.public._id) {
          result = true;
        }
        else {
          var room = DB.room.findOne(doc.room);
          if (room && room.adm.indexOf(userID) !== -1) {
            result = true;
          }
        }
        if (result) {
          if (doc.section) {
            DB.record.update(doc.section, {'$set' : {'time' : doc._id } });
          }
          return true;
        }
        else {
          return false;
        }
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

Meteor.publish('map', function (chapterID) {
  var userID  = this.userID
    , chapter = DB.record.findOne(chapterID)
    , room
    ;
  if (chapter) {
    room = DB.room.findOne(chapter.room);
  }
  else {
    this.error(new Meteor.Error(404, '錯誤的訂閱參數!', '錯誤的訂閱參數!'));
  }
  if (! room && ! room.public && userID !== TRPG.adm && room.adm.indexOf(userID) === -1) {
    this.error(new Meteor.Error(401, '權限不足!', '權限不足!'));
  }
  return DB.map.find({'chapter' : chapterID});
});

Meteor.publish('map_grid', function (roomID, mapID) {
  var userID = this.userID
    , room   = DB.room.findOne(roomID)
    , map    = DB.map.findOne(mapID)
    ;
  if (! map || ! room ||  map.room !== roomID) {
    this.error(new Meteor.Error(404, '錯誤的訂閱參數!', '錯誤的訂閱參數!'));
  }
  if (! room.public && userID !== TRPG.adm && room.adm.indexOf(userID) === -1) {
    this.error(new Meteor.Error(401, '權限不足!', '權限不足!'));
  }
  return [ DB.map.find(mapID)
         , DB.map_grid.find({'map' : mapID})];
});

//繼承地圖
Meteor.methods(
  {'ExtendMap' :
      function(mapID) {
        var map    = DB.map.findOne(mapID)
          , userID = this.userId
          , room
          ;

        if (! map) {
          throw new Meteor.Error(404, '錯誤的參數!', '錯誤的參數!');
        }
        room = DB.room.findOne(map.room);
        if (! room || room.adm.indexOf(userID) !== -1) {
          this.error(new Meteor.Error(401, '權限不足!', '權限不足!'));
        }

        map._id = (Date.now() + '');
        map.round += 1;
        DB.map.insert(map);
        DB.map_grid.find({'map' : mapID}).forEach(function(grid) {
          grid._id = grid.x + ',' + grid.y + '@' + map.round + '@' + map._id;
          grid.round = map.round;
          grid.map = map._id;
          DB.map_grid.insert(grid);
        });
        return map._id;
      }
  }
);