DB.message.allow(
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
          if (room && (room.adm.indexOf(userID) !== -1 || room.player.indexOf(userID) !== -1)) {
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
        if (userID === TRPG.adm) {
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
                sender.added('message', id, fields);
              }
          ,'changed' :
              function(id, fields) {
                sender.changed('message', id, fields);
              }
          ,'removed' :
              function(id) {
                sender.removed('message', id);
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
              observer[id + ' Others'] = DB.message.find({'room': id, 'type' : {'$ne' : 'dice'} }, {'sort' : {'_id' : -1}, 'limit' : 100}).observeChanges(obsMessage);
              observer[id + ' Dices'] = DB.message.find({'room': id, 'type' : 'dice' }, {'sort' : {'_id' : -1}, 'limit' : 30}).observeChanges(obsMessage);
            }
        ,'removed' :
            function(id) {
              observer[id + ' Others'].stop();
              observer[id + ' Dices'].stop();
            }
        }
      )
  sender.onStop(function () {
    _.each(observer, function(obs, key) {
      obs.stop();
    });
  });
});