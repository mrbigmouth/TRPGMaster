//登入時訂閱
Meteor.publish('initialize', function () {
  var userID = this.userId
    , room
    , roomIds
    , chapter
    , message
    , users
    , character
    ;

  //房間
  if (userID === TRPG.adm) {
    room = DB.room.find();
  }
  else {
    room =
      DB.room.find(
        {'$or'    :
            [{'_id'    : TRPG.public._id}
            ,{'adm'    : userID}
            ,{'player' : userID}
            ]
        }
      );
  }
  roomIds = _.pluck(room.fetch(), '_id')

  //章節
  chapter = DB.record.find({'room': {'$in' : roomIds} , 'chapter': {'$exists' : false}});

  //一週內訊息
  message = DB.message_all.find({'$or' : [{ 'room': {'$in' : roomIds } }, { 'room': {'$exists' : false } }], 'time' : {'$gte' : Date.now() - 604800000}});

  //訊息內有的玩家暱稱或(adm)所有玩家資料
  if (userID === TRPG.adm) {
    users = Meteor.users.find()
  }
  else {
    users = Meteor.users.find({}, {'fields': {'profile.nick' : 1}});
  }
  

  //自己角色的擲骰資料 
  character = DB.character.find({'adm' : userID }, {'fields' : {'name' : 1, 'adm' : 1, 'room' : 1, 'dice' : 1}});
  return [room, chapter, message, users, character];
});
