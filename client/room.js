//房間template
Template.main_room.helpers(
  {'loaded'        :
      function() {
        return SCRIBE.room.ready() && SCRIBE.chapter.ready() && SCRIBE.characterName && SCRIBE.characterName.ready();
      }
  ,'title'         :
      function() {
        return Session.get('room').name;
      }
  ,'status'        :
      function() {
        switch (Session.get('room').status) {
        case 0 :
          return '申請中';
        case 1 :
          return '籌備中';
        case 2 :
          return '進行中';
        case 3 :
          return '已結束';
        }
      }
  ,'canApply'      :
      function() {
        if (! Meteor.userId) {
          return false;
        }
        if (TOOL.userIsAdm() || TOOL.userIsPlayer() || Session.get('room').status > 1) {
          return false;
        }
        return true;
      }
  ,'desc'          :
      function() {
        return Session.get('room').desc;
      }
  ,'allChapters'   :
      function() {
        return DB.record.find({'room' : Session.get('room')._id, 'chapter' : {'$exists' : false} });
      }
  ,'allCharacters' :
      function() {
        return DB.character.find({'room' : Session.get('room')._id});
      }
  ,'isAdm'         : TOOL.userIsAdm
  ,'isPlayer'      : TOOL.userIsPlayer
  ,'getNick'       : TOOL.getUserNick
  ,'getCharacter'  :
      function(user) {
        var chars = DB.character.find({'room' : Session.get('room')._id, 'adm' : user}).find().fetch();
        return _.pluck(chars, 'name').join('、');
      }
  }
);

Template.main_room.events(
  {'click a.apply'      :
      function() {
        var room   = Session.get('room')._id
          , applyText
          ;
        if (Meteor.userId()) {
          applyText = window.prompt('請輸入給DM審核用的申請文字：');
          Meteor.call('applyJoinRoom', room, applyText);
        }
        else {
          alert('請先登入或註冊！');
        }
      }
  ,'click a.addChapter' :
      function() {
        var room    = Session.get('room')._id
          , sort    = DB.record.find({'room' : room, 'chapter' : {'$exists' : false} }).count()
          ;
        DB.record.insert(
          {'room'    : room
          ,'name'    : '第' + (sort + 1) + '章'
          ,'sort'    : sort
          }
        );
      }
  ,'click a.addCharacter' :
      function() {
        var room    = Session.get('room')
          , rule    = RULE[ room.rule ]
          , data    = _.defaults({}, rule.character)
          ;

        data.room = room._id;
        data.rule = room.rule;
        data.name = Meteor.user().profile.nick + '的新角色';
        DB.character.insert(data);
      }
  }
)


//申請者Template
Template.main_room_applying.helpers(
  {'applying'   :
      function() {
        return Session.get('room').applying;
      }
  ,'getNick'       : TOOL.getUserNick
  }
)
Template.main_room_applying.events(
  {'click a' :
      function(e, ins) {
        var room     = Session.get('room')
          , $this    = $(e.currentTarget)
          , user     = $this.attr('data-id')
          , applying = room.applying
          , $set     = {'applying' : _.without(applying, user)}
          ;
        debugger;
        if ($this.hasClass('agree')) {
          $set.player = _.union((room.player || []), [user]);
        }
        DB.room.update(room._id, {'$set' : $set});
      }
  }
)