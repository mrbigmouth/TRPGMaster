//房間template
Template.main_room.helpers(
  {'loaded'        :
      function() {
        return SCRIBE.room.ready() && SCRIBE.chapter.ready() && SCRIBE.characterName && SCRIBE.characterName.ready();
      }
  ,'title'         :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room)
          ;
        return room && room.name;
      }
  ,'status'        :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room)
          , status       = (room ? room.status : 0)
          ;
        switch (status) {
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
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room)
          , status       = (room ? room.status : 0)
          ;
        if (! Meteor.userId()) {
          return false;
        }
        if (TOOL.userIsAdm() || TOOL.userIsPlayer() || status > 1) {
          return false;
        }
        return true;
      }
  ,'desc'          :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room)
          ;
        return room.desc;
      }
  ,'allChapters'   :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          ;
        return DB.record.find({'room' : room._id, 'chapter' : {'$exists' : false} });
      }
  ,'allCharacters' :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          ;
        return DB.character.find({'room' : room._id});
      }
  ,'isAdm'         : TOOL.userIsAdm
  ,'isPlayer'      : TOOL.userIsPlayer
  ,'getNick'       : TOOL.getUserNick
  ,'getCharacter'  :
      function(user) {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          ;
        var chars = DB.character.find({'room' : room._id, 'adm' : user}).find().fetch();
        return _.pluck(chars, 'name').join('、');
      }
  }
);

Template.main_room.events(
  {'click a.apply'      :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          , applyText
          ;
        if (Meteor.userId()) {
          applyText = window.prompt('請輸入給DM審核用的申請文字：');
          Meteor.call('applyJoinRoom', room._id, applyText);
        }
        else {
          alert('請先登入或註冊！');
        }
      }
  ,'click a.addChapter' :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          , sort    = DB.record.find({'room' : room._id, 'chapter' : {'$exists' : false} }).count()
          ;
        DB.record.insert(
          {'room'    : room._id
          ,'name'    : '第' + (sort + 1) + '章'
          ,'sort'    : sort
          }
        );
      }
  ,'click a.addCharacter' :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          , rule         = RULE[ room.rule ]
          , data         = _.defaults({}, rule.character)
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
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          ;
        return room.applying;
      }
  ,'getNick'       : TOOL.getUserNick
  }
)
Template.main_room_applying.events(
  {'click a' :
      function(e, ins) {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room) || {}
          , $this    = $(e.currentTarget)
          , user     = $this.attr('data-id')
          , applying = room.applying
          , $set     = {'applying' : _.without(applying, user)}
          ;
        if ($this.hasClass('agree')) {
          $set.player = _.union((room.player || []), [user]);
        }
        DB.room.update(room._id, {'$set' : $set});
      }
  }
)