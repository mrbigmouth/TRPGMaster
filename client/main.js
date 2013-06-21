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
    break;
  }
  $('body').layout(layoutOp);
  var $main = $('#main');
  $main
    .css('padding', 0)
    .width($main.width() + 20)
    .height($main.height() + 20);
  //所有link改為進行route
  $('body').on('click', 'a', function(e) {
    var target = $(this).attr('target')
      , href
      ;
    if (! target) {
      href = $(this).attr('href');
      if (this.hostname === location.hostname && href && href.substr(0,1) !== '#') {
        e.preventDefault();
        Meteor.Router.to(href);
      }
    }
  });
});