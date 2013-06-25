var NeedResetRecent    = false
  , ReSetMessageRecent =
      function() {
        NeedResetRecent = true;
      }
  ;
Meteor.setInterval(
  function() {
    if (NeedResetRecent) {
      var timeLimit = Date.now() - 604800000 //一星期
      DB.message_recent.remove(
        {}
      , function() {
          DB.message_all.find({'time' : {$gte : timeLimit } }).forEach(function(doc) {
            DB.message_recent.insert(doc, _.identity);
          });
        }
      );
      NeedResetRecent = false;
    }
  }
, 10000
)
DB.message_all.find().observeChanges(
  {'added'   : ReSetMessageRecent
  ,'changed' : ReSetMessageRecent
  ,'removed' : ReSetMessageRecent
  }
)

DB.message_all.allow(
  {'insert' :
      function(userID, doc) {
        var result = false;
        doc.time = Date.now();
        doc._id = (doc.time + '');
        doc.user = userID;
        if (userID === TRPG.adm || doc.room === TRPG.public._id) {
          result = true;
        }
        else {
          var room = DB.room.findOne(doc.room);
          if (room && (room.adm.indexOf(userID) !== -1 || room.player.indexOf(userID) !== -1)) {
            result = true;
          }
        }
        if (result) {
          if (doc.section) {
            DB.record.update(doc.section, {'$set' : {'time' : doc.time } }, _.identity);
          }
          return true;
        }
        else {
          return false;
        }
      }
  ,'update' :
      function(userID, doc) {
        if (userID === TRPG.adm) {
          return true;
        }
        var room = DB.room.findOne(doc.room);
        if (room && room.adm.indexOf(userID) !== -1) {
          DB.message_all.update(doc._id, {$set : {'time' : Date.now() }}, _.identity)
          return true;
        }
        return false;
      }
  ,'remove' :
      function(userID, doc) {
        if (userID == TRPG.adm) {
          return true;
        }
        return false;
      }
  }
);

Meteor.publish('message', function () {
  var userID     = this.userID
    , sender     = this
    , observer   = {}
    , obsMessage =
          {'added' :
              function(id, fields) {
                sender.added('message_recent', id, fields);
              }
          ,'changed' :
              function(id, fields) {
                sender.changed('message_recent', id, fields);
              }
          ,'removed' :
              function(id) {
                sender.removed('message_recent', id);
              }
          }
    ;
  observer.room =
      DB.room.find(
        {'$or' :
            [{'public' : true}
            ,{'adm'    : userID}
            ,{'player' : userID}
            ]
        }
      ).observeChanges(
        {'added'   :
            function(id) {
              observer[id] = DB.message_recent.find({'room': id}).observeChanges(obsMessage);
            }
        ,'removed' :
            function(id) {
              observer[id].stop();
            }
        }
      )
  sender.onStop(function () {
    _.each(observer, function(obs, key) {
      obs.stop();
    });
  });
});