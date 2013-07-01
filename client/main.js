var bodyLayout
  , $message
  , messageLayout
  , $openFilter
  , $openChat
  ;
//layout
Meteor.startup(function() {
  var $message = $('#message_list')
    , layoutOp =
        {'applyDefaultStyles'       : false
        ,'closable'                 : true
        ,'resizable'                : true
        ,'slidable'                 : true
        ,'livePaneResizing'         : true
        ,'spacing_closed'           : 5
        ,'spacing_open'             : 5
        ,'resizerTip'               : '調整大小'
        ,'sliderTip'                : '調整大小'
        ,'north__spacing_closed'    : 5
        ,'north__spacing_open'      : 0
        ,'north__togglerTip_closed' : '開啟導覽列'
        ,'south__togglerTip_open'   : '關閉訊息列'
        ,'south__togglerTip_closed' : '開啟訊息列'
        ,'south__size'              : 100
        ,'south__onopen'            :
            function() {
              //打開時，自動捲至底部
              $message.scrollTop( $message.prop('scrollHeight') );
            }
        }
    ;
  switch (Meteor.Router.page()) {
  case 'main_map' :
    layoutOp.north__initClosed = true;
    layoutOp.south__initClosed = true;
    layoutOp.center__childOptions =
      {'applyDefaultStyles'       : false
      ,'closable'                 : true
      ,'resizable'                : true
      ,'slidable'                 : true
      ,'livePaneResizing'         : true
      ,'spacing_closed'           : 5
      ,'spacing_open'             : 5
      ,'resizerTip'               : '調整大小'
      ,'sliderTip'                : '調整大小'
      ,'center__paneSelector'     : '#map_wrapper'
      ,'west____paneSelector'     : '#childLayout_west'
      ,'west__togglerTip_open'    : '關閉資訊欄'
      ,'west__togglerTip_closed'  : '開啟資訊欄'
      ,'west__size'               : 300
      };
    break;
  }
  $('body').layout(layoutOp);

  var $main = $('#main');
  $main
    .css('padding', 0)
    .width($main.width() + 20)
    .height($main.height() + 20);

  switch (Meteor.Router.page()) {
  case 'main_map' :
    $('body').data('layout').resizeAll();
    $('#map_info').parent().css('left', 0);
    break;
  }
  //所有link改為進行route
  $('body').on('click', 'a', function(e) {
    var target = $(this).attr('target')
      , loca   = location
      , href
      , index
      , hash
      ;
    if (! target) {
      href = $(this).attr('href');
      if (this.hostname === loca.hostname && href && href[0] !== '#') {
        e.preventDefault();
        if ((index = href.lastIndexOf('#')) !== -1) {
          hash = href.substr(index);
          href = href.substr(0, index);
        }
        if (href === loca.pathname) {
          loca.hash = hash;
        }
        else {
          Session.set('hash', hash);
          Meteor.Router.to(href);
        }
      }
    }
  });
});