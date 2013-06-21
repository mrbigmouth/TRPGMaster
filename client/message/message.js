Template.message.helpers(
  //篩選列-所有房間
  {'allRooms' :
      function() {
        return DB.room.find({'status' : { '$gt' : 0 }}, {'sort' : { 'status' : 1 }});
      }
  }
)


//改變訊息列篩選條件
var MsgDep        = new Deps.Dependency()
  , MsgFilter     = {}
  , MsgCursor
  , changeFilter
  ;
changeFilter =
    function(data) {
      if (! EJSON.equals(MsgFilter, data)) {
        MsgFilter = data;
        MsgDep.changed();
      }
    }
Deps.autorun(function() {
  MsgDep.depend();
  MsgCursor = DB.message.find( MsgFilter, {'sort' : {'_id' : 1}, 'limit' : 50} );
  //有新訊息時打開訊息列
  var $body = $('body');
  DB.message.find(MsgFilter).observeChanges(
    {'added' :
        function() {
          switch (Meteor.Router.page()) {
          case 'main_map':
            break;
          default        :
            $body.data('layout') && $body.data('layout').open('south');
            break;
          }
        }
    }
  );
});

//篩選訊息列
Template.message.events(
  {'change #message_filter select, change #message_filter input' :
      function() {
        var $filter = $('#message_filter')
          , room    = $filter.find('select').val()
          , $type   = $filter.find('input.type:checked')
          , types   = []
          ;

        MsgFilter = {}
        if (room !== '') {
          MsgFilter.room = parseInt(room, 10);
        }
        $type.each(function() {
          types.push( this.name );
        });
        MsgFilter.type = {'$in' : types};
        MsgDep.changed();
      }
  }
)


Template.message_list.helpers(
  //所有訊息
  {'allMsgs'     :
      function () {
        MsgDep.depend();
        return MsgCursor;
      }
  //時間中文化
  ,'timeChinese' : TOOL.convertTimeToChinese
  //使用者id轉暱稱
  ,'getNick'     : TOOL.getUserNick
  //房間id轉暱稱
  ,'roomName'    :
      function(room) {
        room = DB.room.findOne({'_id' : room});
        return room ? room.name : '';
      }
  //訊息類別轉中文
  ,'typeChinese' :
      function(type) {
        return TRPG.options.messageType[ type ];
      }
  ,'typeChat'    :
      function() {
        return (this.type === 'chat') || (this.type === 'outside');
      }
  ,'typeSystem'    :
      function() {
        return (this.type === 'room') || (this.type === 'system');
      }
  ,'typeDice'    :
      function() {
        return (this.type === 'dice');
      }
  ,'diceResult'  :
      function() {
        var record  = this.result
          , number  = record.length
          , face    = this.face
          , add     = this.add
          , addSign = ((add >= 0) ? '+ ' : '')
          , sum     = 0
          , result
          ;
        if (this.addEach) {
          result = '[1d' + face + addSign + add + '] x ' + number + '結果分別為 ';
          result += 
              (_.map(record, function(v) {
                var total = v + add;
                sum += total;
                return v + '(' + ( total ) + ')';
              })).join(',');
          result += ' 總合為 ' + sum + ' 。';
        }
        else {
          result = number + 'd' + face + addSign + add + '結果為 ';
          result += record.join(',');
          result += ' 總合為'
          result += _.reduce(record, function(memo, v) { return memo + v;}, add);
          result += ' 。';
        }
        return result;
      }
  ,'haveLink'    :
      function() {
        return (this.room && this.chapter && this.section);
      }
  }
)
//自動捲至底部
var $message;
Template.message_list.rendered =
    function() {
      var undefined;
      if ($message !== undefined) {
        $message.scrollTop( $message.prop('scrollHeight') );
      }
    };
Meteor.startup(function() {
  $message = $('#message_list');
});

//發言
var toChat =
    function (e, ins) {
      var $msg = $(ins.find('input.msg'))
        , data
        , temp
        ;

      data = 
        {'type' : 'chat'
        ,'msg'  : $msg.val()
        }
      if (temp = Session.get('room')) {
        data.room = temp._id;
        if (temp = Session.get('chapter')) {
          data.chapter = temp._id;
          if (temp = $(e.currentTarget).attr('data-section')) {
            data.section = temp;
          }
        }
      }
      else {
        data.room = TRPG.public._id;
      }
      DB.message.insert(data);
      $msg.val('');
    }
Template.message_chat.events(
  //發聊天訊息
  {'click button.btn'   : toChat
  }
);