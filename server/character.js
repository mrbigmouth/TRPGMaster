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
      function(userID, doc, fieldNames) {
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

Meteor.publish('characterList', function (room) {
  return DB.character.find({'room' : room}, {'fields' : {'name' : 1, 'room' : 1}});
});



Meteor.publish('character', function (id) {
  var publisher = this
    , userID    = publisher.userId
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


DB.character.find({'spell' : {'$exists' : true}}).forEach(function(doc) {
  var spell = doc.spell;
  _.each(spell, function(spellClass) {
    _.each(spellClass.circle, function(circle) {
      var newKnown = [];
      _.each(circle.known, function(spellName) {
        var spell = {'name' : spellName, 'detail' : ''};
        newKnown.push(spell);
      });
      circle.known = newKnown;
    });
  });
  DB.character.update(doc._id, {'$set' : {'spell' : spell} });
});

/*
DB.character.find({'spell' : {'$exists' : true}}).forEach(function(doc) {
  var known = []
    , slot  = []
    ;
  _.each(doc.spell, function(spellClass) {
    var thisClassKnown = {}
      , thisClassSlot  = {}
      ;
    thisClassKnown.name = thisClassSlot.name = spellClass.name;
    thisClassKnown.list = [];
    thisClassSlot.list = [];
    _.each(spellClass.circle, function(circle) {
      var thisCircleKnown = []
        , thisCircleSlot  = []
        ;
      _.each(circle.known, function(spellName) {
        var spell = {'name' : spellName, 'detail' : ''};
        thisCircleKnown.push(spell);
      });
      _.each(circle.slot, function(slotData) {
        thisCircleSlot.push(slotData);
      });
      thisClassKnown.list.push(thisCircleKnown);
      thisClassSlot.list.push(thisCircleSlot);
    });
    known.push(thisClassKnown);
    slot.push(thisClassSlot);
  });
  doc.known = known;
  doc.slot = slot;
  DB.character.update(doc._id, {'$set' : {'known' : known, 'slot' : slot}, '$unset' : {'spell' : ''}});
});
*/