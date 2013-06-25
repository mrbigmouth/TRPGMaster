DB.document.allow(
  {'insert' :
      function(userID, doc) {
        var room = DB.room.findOne(doc.room);
        doc.time = Date.now();
        doc._id = doc.time + '';
        doc.user = userID;
        if (userID === TRPG.adm || doc.room === TRPG.public._id || (room.status !== 0 && room.adm && room.adm.indexOf(userID) !== -1)) {
          DB.room.update(room._id, {'$set' : {'time' : doc.time } });
          DB.message_all.insert(
            {'_id'  : doc._id
            ,'type' : 'room'
            ,'user' : doc.user
            ,'room' : doc.room
            ,'msg'  : '新增了一則團務資料「' + doc.name + '」。'
            }
          );
          return true;
        }
        return false;
      }
  ,'update' :
      function(userID, doc, fieldNames) {
        if (fieldNames[0] === 'temp') {
          return false;
        }
        var room = DB.room.findOne(doc.room);
        if (userID === TRPG.adm || userID === doc.user || (room.status !== 0 && room.adm && room.adm.indexOf(userID) !== -1)) {
          var now = Date.now();
          if (userID !== doc.user) {
            DB.document.update(doc._id, {'$set' : {'user' : userID, 'time' : now } });
          }
          else {
            DB.document.update(doc._id, {'$set' : {'time' : now } });
          }
          DB.room.update(room._id, {'$set' : {'time' : now } });
          DB.message_all.insert(
            {'_id'  : (now + '')
            ,'type' : 'room'
            ,'user' : userID
            ,'room' : doc.room
            ,'msg'  : '修改了團務資料「' + doc.name + '」。'
            }
          );
          return true;
        }
        return false;
      }
  ,'remove' :
      function(userID, doc) {
        var room = DB.room.findOne(doc.room);
        if (userID === TRPG.adm || userID === doc.user || (room.status !== 0 && room.adm && room.adm.indexOf(userID) !== -1)) {
          var now = Date.now();
          DB.room.update(room._id, {'$set' : {'time' : now } });
          DB.message_all.insert(
            {'_id'  : (Date.now() + '')
            ,'type' : 'room'
            ,'user' : userID
            ,'room' : doc.room
            ,'msg'  : '移除了團務資料「' + doc.name + '」。'
            }
          );
          return true;
        }
        return false;
      }
  }
);

Meteor.publish('document', function () {
  var userID = this.userID
    , canSee
    ;
  if (userID === TRPG.adm) {
    return DB.document.find();
  }
  else {
    canSee =
        {'$or'    :
            [{'public' : true}
            ,{'adm'    : userID}
            ,{'player' : userID}
            ]
        }
    return DB.document.find(canSee);
  }
});