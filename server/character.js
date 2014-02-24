DB.character.allow(
  {'insert' :
      function(userID, doc) {
        doc._id    = doc.time = (Date.now() + '');
        doc.adm    = [ userID ];
        doc.status = 0
        doc.hide   = false;
        if (userID === TRPG.adm || doc.room === TRPG.public.id) {
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

DB.character_data.allow(
  {'insert' :
      function(userID, doc) {
        var character = DB.character.findOne(doc.character)
          , room
          ;

        if (! character || character.status >= 2) {
          return false;
        }
        
        if (userID !== TRPG.adm && character.room === TRPG.public.id && character.adm.indexOf(userID) === -1) {
          return false;
        }

        room = DB.room.findOne(character.room);
        if (! room) {
          return false;
        }

        if (room.adm.indexOf(userID) === -1) {
          return false
        }

        doc._id = (Date.now() + '');
        doc.sort = DB.character_data.find({'character' : doc.character, 'type' : doc.type}).count();
        DB.character.update(doc._id, {'$set' : {'time' : Date.now()} });
        return true;
      }
  ,'update' :
      function(userID, doc, fieldNames) {
        var character = DB.character.findOne(doc.character)
          , room
          ;

        if (! character || character.status >= 2) {
          return false;
        }
        
        if (userID !== TRPG.adm && character.room === TRPG.public.id && character.adm.indexOf(userID) === -1) {
          return false;
        }

        room = DB.room.findOne(character.room);
        if (! room) {
          return false;
        }

        if (room.adm.indexOf(userID) === -1) {
          return false
        }

        DB.character.update(doc._id, {'$set' : {'time' : Date.now()} });
        return true;
      }
  ,'remove' :
      function(userID, doc) {
        var character = DB.character.findOne(doc.character)
          , room
          ;

        if (! character || character.status >= 2) {
          return false;
        }
        
        if (userID !== TRPG.adm && character.room === TRPG.public.id && character.adm.indexOf(userID) === -1) {
          return false;
        }

        room = DB.room.findOne(character.room);
        if (! room) {
          return false;
        }

        if (room.adm.indexOf(userID) === -1) {
          return false
        }

        DB.character.update(doc._id, {'$set' : {'time' : Date.now()} });
        return true;
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
    , result    = 
      [ DB.character.find(id)
      , DB.character_data.find({'character' : id})
      ]
    , character = result[0].fetch()[0]
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

/*
DB.character.find({'spell.0.circle.0.known.name.name' : {'$exists' : true}}).forEach(function(doc) {
  var spell = doc.spell;
  _.each(spell, function(spellClass) {
    _.each(spellClass.circle, function(circle) {
      var newKnown = [];
      _.each(circle.known, function(thisKnown) {
        var spell     = {}
          , spellName = thisKnown.name;
          ;

        while (typeof spellName === 'object') {
          spellName = spellName.name;
        }
        spell.name = spellName;
        spell.detail = '';
        newKnown.push(spell);
      });
      circle.known = newKnown;
    });
  });
  DB.character.update(doc._id, {'$set' : {'spell' : spell} });
});
var now = Date.now();
DB.character.find({'profile' : {'$exists' : true}}).forEach(function(doc) {
  var id = doc._id;
  delete doc._id;

  _.each(doc.profile, function(data, sort) {
    now += 1;
    data._id = (now + '');
    data.type = 'profile';
    data.character = id;
    data.sort = sort;
    DB.character_data.insert(data);
  });
  delete doc.profile;

  _.each(doc.number, function(data, sort) {
    now += 1;
    data._id = (now + '');
    data.type = 'number';
    data.character = id;
    data.sort = sort;
    DB.character_data.insert(data);
  });
  delete doc.number;

  _.each(doc.dice, function(data, sort) {
    now += 1;
    data._id = (now + '');
    data.type = 'dice';
    data.character = id;
    data.sort = sort;
    DB.character_data.insert(data);
  });
  delete doc.dice;

  _.each(doc.item, function(data, sort) {
    now += 1;
    data._id = (now + '');
    data.type = 'item';
    data.character = id;
    data.sort = sort;
    DB.character_data.insert(data);
  });
  delete doc.item;

  _.each(doc.spell, function(eachSpellClass) {
    var className = eachSpellClass.name;
    _.each(eachSpellClass.circle, function(thisCircleSpell, circle) {
      _.each(thisCircleSpell.known, function(data, sort) {
        now += 1;
        data._id = (now + '');
        data.type = 'known';
        data.character = id;
        data.belong = className;
        data.circle = circle;
        data.sort = sort;
        DB.character_data.insert(data);
      });
      _.each(thisCircleSpell.slot, function(data, sort) {
        now += 1;
        data._id = (now + '');
        data.type = 'slot';
        data.character = id;
        data.belong = className;
        data.circle = circle;
        data.sort = sort;
        DB.character_data.insert(data);
      });
    })
  });

  _.each(doc.level, function(eachLevel, thisLevelNumber) {
    _.each(eachLevel, function(data, sort) {
      now += 1;
      data._id = (now + '');
      data.type = 'level';
      data.character = id;
      data.level = thisLevelNumber;
      data.sort = sort;
      DB.character_data.insert(data);
    })
  });

  _.each(doc.description, function(data, sort) {
    now += 1;
    data._id = (now + '');
    data.type = 'description';
    data.character = id;
    data.sort = sort;
    DB.character_data.insert(data);
  });

  DB.character.update(id, {'$unset' : {'profile' : '', 'number' : '', 'dice' : '', 'item' : '', 'spell' : '', 'level' : '', 'description' : ''} });
});
*/