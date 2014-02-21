DB.message_all.allow(
  {'insert' :
      function(userID, doc) {
        var result  = false
          , now     = Date.now()
          , filter  = _.omit(doc, '_id', 'time')
          , oldMessage
          , timeLimit
          ;

        oldMessage = DB.message_all.findOne(filter, {'sort' : { 'time' : -1 }});
        //若限時內相同使用者插入相同的內容 則拒絕插入，並更新該舊訊息
        if (oldMessage) {
          switch (doc.type) {
          case 'chat'    :
          case 'dice'    :
          case 'outside' :
          default :
            //一分鐘內
            timeLimit = 60000;
            break;
          case 'system'  :
          case 'room'    :
            //一小時內
            timeLimit = 3600000;
          }
          if (now - oldMessage.time <= timeLimit) {
            DB.message_all.update(oldMessage._id, { '$set' : {'time' : now} });
            return false;
          }
        }

        doc.time = now;
        doc._id = (now + '');
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
            DB.record.update(doc.section, {'$set' : {'time' : now } }, _.identity);
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