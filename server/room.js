DB.room.allow(
  {'insert' :
      function(userID, doc) {
        doc._id = (Date.now() + '');
        if (doc.status === 0) {
          return true;
        }
        return false;
      }
  ,'update' :
      function(userID, doc, fieldNames) {
        if (userID === TRPG.adm || (doc.status !== 0 && doc.adm && doc.adm.indexOf(userID) !== -1)) {
          DB.room.update(doc._id, {'$set' : {'time' : doc.time } });
          return true;
        }
        return false;
      }
  ,'remove' :
      function(userID, doc) {
        if (userID === TRPG.adm) {
          return true;
        }
        return false;
      }
  }
);

Meteor.publish('room', function () {
  var userID = this.userID
    , canSee
    ;
  if (userID === TRPG.adm) {
    return DB.room.find();
  }
  else {
    canSee =
        {'$or'    :
            [{'public' : true}
            ,{'adm'    : userID}
            ,{'player' : userID}
            ]
        }
    return DB.room.find(canSee);
  }
});



//申請加入
Meteor.methods(
  {'applyJoinRoom' :
      function(room, text) {
        var userId = this.userId;
        if (! userId) {
          throw Meteor.Error(401, 'Unauthorized', 'Unauthorized');
        }
        room = DB.room.findOne(room);
        if (room.status > 1) {
          throw Meteor.Error(403, 'Forbidden', 'Forbidden');
        }
        if (! room.applying) {
          DB.room.update(room._id , {$set : {'applying' : []}});
        }
        var data =
            {'user'      : userId
            ,'applyText' : text
            }
        DB.room.update(room._id, {$addToSet : {'applying' : data}});
        return true;
      }
  }
)