DB.character.allow(
  {'insert' :
      function(userID, doc) {
        doc._id    = doc.time = (Date.now() + '');
        doc.adm    = [ userID ];
        doc.status = 0
        doc.hide   = false;
        if (userID === TRPG.adm || doc.room === TRPG.public._id) {
          return true;
        }
        var room = DB.room.findOne(doc.room);
        if (room && (room.adm.indexOf(userID) !== -1 || (room.status === 1 && room.player.indexOf(userID) !== -1) )) {
          return true;
        }
        return false;
      }
  ,'update' :
      function(userID, doc) {
        var result = false
          , room
          ;
        if (userID === TRPG.adm || doc.adm.indexOf(userID) !== -1 ) {
          result = true;
        }
        else {
          room = DB.room.findOne({'_id' : doc.room});
          if (room && room.adm.indexOf(userID) !== -1) {
            result = true;
          }
        }
        if (result) {
          DB.character.update(doc._id, {'$set' : {'time' : Date.now()} });
          DB.room.update(doc._id, {'$set' : {'time' : Date.now()} });
          return true;
        }
        return false;
      }
  ,'remove' :
      function(userID, doc) {
        if (userID === TRPG.adm) {
          return true;
        }
        var room = DB.room.findOne({'_id' : doc.room});
        if (room && room.adm.idexOf(userID) !== -1) {
          return true;
        }
        return false;
      }
  }
);

Meteor.publish('characterName', function (room) {
  return DB.character.find({'room' : room}, {'fields' : {'name' : 1, 'room' : 1}});
});

Meteor.publish('character', function (id) {
  var publisher = this
    , userID    = publisher.userID
    , canSee    =
        {'$or'    :
            [{'public' : true}
            ,{'adm'    : userID}
            ]
        }
    , result    = DB.character.find(id)
    , character = result.fetch()[0]
    , room
    ;

  if (userID === TRPG.adm) {
    return result;
  }
  if (! character) {
    publisher.error(new Meteor.Error(404, '找不到角色！'));
    return;
  }
  if (! character.hide) {
    return result;
  }
  if (character.adm.indexOf(userID) !== -1) {
    return result;
  }
  room = DB.room.findOne(character.room);
  if (! room) {
    publisher.error(new Meteor.Error(404, '角色資料格式錯誤，無所在房間！'));
    return;
  }
  if (room.adm.indexOf(userID) !== -1) {
    return result;
  }
  publisher.error(new Meteor.Error(403, '你沒有權限查看此角色資料！'));
  return;
});

Meteor.publish('myCharacter', function () {
  return DB.character.find({'adm' : this.userId });
});