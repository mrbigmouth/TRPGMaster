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