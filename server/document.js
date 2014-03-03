DB.document.allow(
  {'insert' :
      function(userID, doc) {
        var room = DB.room.findOne(doc.room)
          , sort
          ;
        doc.time = Date.now();
        doc._id = doc.time + '';
        doc.user = userID;
        if (userID === TRPG.adm || doc.room === TRPG.public.id || (room.status !== 0 && room.adm && room.adm.indexOf(userID) !== -1)) {
          doc.sort = DB.document.find({'room' : doc.room, 'parent' : doc.parent}).count();
          DB.room.update(room._id, {'$set' : {'time' : doc.time } });
          DB.message_all.insert(
            {'_id'      : doc._id
            ,'type'     : 'room'
            ,'user'     : doc.user
            ,'room'     : doc.room
            ,'document' : doc._id
            ,'time'     : doc.time
            ,'msg'      : '新增了一條資料「' + doc.name + '」。'
            }
          );
          return true;
        }
        return false;
      }
  ,'update' :
      function(userID, doc, fieldNames) {
        var room = DB.room.findOne(doc.room)
          , now
          ;
        if (userID === TRPG.adm || doc.room === TRPG.public.id || userID === doc.user || (room.adm && room.adm.indexOf(userID) !== -1)) {
          now = Date.now();
          if (userID !== doc.user) {
            DB.document.update(doc._id, {'$set' : {'user' : userID, 'time' : now } });
          }
          else {
            DB.document.update(doc._id, {'$set' : {'time' : now } });
          }
          DB.room.update(room._id, {'$set' : {'time' : now } });
          return true;
        }
        return false;
      }
  ,'remove' :
      function(userID, doc) {
        var room = DB.room.findOne(doc.room);
        if (userID === TRPG.adm || doc.room === TRPG.public.id  || userID === doc.user || (room.status !== 0 && room.adm && room.adm.indexOf(userID) !== -1)) {
          DB.room.update(room._id, {'$set' : {'time' : Date.now() } });
          return true;
        }
        return false;
      }
  }
);

Meteor.publish('documentList', function (room) {
  return DB.document
          .find(
            {'room' : room}
          , {'fields' :
              {'_id'    : 1
              ,'room'   : 1
              ,'parent' : 1
              ,'sort'   : 1
              ,'name'   : 1
              }
            }
          );
});

Meteor.publish('document', function (doc) {
  return DB.document.find({'_id' : doc});
});