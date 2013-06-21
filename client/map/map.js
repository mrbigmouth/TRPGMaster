Meteor.startup(function() {
  var $main    = $('#main_map')
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
        ,'west__togglerTip_open'    : '關閉資訊欄'
        ,'west__togglerTip_closed'  : '開啟資訊欄'
        ,'west__size'               : 250
        }
    ;
  if ($main.length > 0) {
    $main.layout(layoutOp);
  }
});