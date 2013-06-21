Template.allApplyRoom.helpers(
  {'isAdm'    :
      function() {
        return (Meteor.userId() == TRPG.adm);
      }
  ,'applying' :
      function() {
        return DB.room.find({'status' : 0});
      }
  ,'getName'  :
      function(_id) {
        _id = _id[0];
        return Meteor.users.findOne({'_id' : _id}).profile.nick + '(' + _id + ')';
      }
  }
)

Template.allApplyRoom.events(
  {'click button.agree' :
      function(e, ins) {
        var id = $(e.currentTarget).attr('data-id');
        DB.room.update(
          {'_id'  : id}
        , {'$set' : 
            {'status' : 1}
          }
        , {'multi' : false}
        , function(err, result) {
            console.log(arguments);
          }
        );
      }
  ,'click button.refuse' :
      function(e, ins) {
        var id = $(e.currentTarget).attr('data-id');
        DB.room.remove(
          {'_id' : id}
        , function(err, result) {
            console.log(arguments);
          }
        );
      }
  }
)