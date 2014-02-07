Meteor.startup(function() {
  //初始化內部layout
  var messageLayout =
    $('#message').layout(
      {'applyDefaultStyles'      : false
      ,'closable'                : true
      ,'resizable'               : true
      ,'slidable'                : false
      ,'livePaneResizing'        : true
      ,'spacing_closed'          : 0
      ,'spacing_open'            : 2
      ,'resizerTip'              : '調整大小'
      ,'sliderTip'               : '調整大小'
      ,'togglerTip_open'         : '關閉'
      ,'north__size'             : 40
      ,'north__initClosed'       : true
      ,'south__size'             : 40
      ,'south__initClosed'       : true
      }
    )

  //事件直接綁定
  $('#message')
    .on('click', 'a.openFilter', function() {
      if (messageLayout.state.north.isClosed) {
        messageLayout.open('north');
        $(this).attr('title', '關閉篩選欄');
      }
      else {
        messageLayout.close('north');
        $(this).attr('title', '開啟篩選欄');
      }
    })
    .on('click', 'a.openChat', function() {
      if (messageLayout.state.south.isClosed) {
        messageLayout.open('south');
        $(this).attr('title', '關閉發言欄');
      }
      else {
        messageLayout.close('south');
        $(this).attr('title', '開啟發言欄');
      }
    });
});


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
  //有新訊息時打開訊息列
  var layout = $('body');
  layout = layout.data('layout');
  if (! layout || typeof layout.open !== 'function') {
    return true;
  }
  DB.message_recent.find(MsgFilter).observeChanges(
    {'added' :
        function() {
          switch (Meteor.Router.page()) {
          case 'main_map':
            break;
          default        :
            layout.open('south');
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
        return DB.message_recent.find( MsgFilter, {'sort' : {'time' : 1} } ).fetch().slice(-50);
//        return MsgCursor;//.fetch().slice(-50);
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
  ,'isRecord'    :
      function() {
        return (this.room && this.chapter && this.section);
      }
  ,'isCharacter'    :
      function() {
        return !!(this.character);
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
      DB.message_all.insert(data);
      $msg.val('');
    }
Template.message_chat.events(
  //發聊天訊息
  {'click button.btn'   : toChat
  }
);