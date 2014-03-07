Template.layout.rendered =
    function() {
      var layoutOption =
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
            ,'west__togglerTip_open'    : '關閉資訊列'
            ,'west__togglerTip_closed'  : '開啟資訊列'
            ,'west__size'               : 300
            }
        ;
      $('body').layout( layoutOption );
    }

//router基本設定
Router.configure(
  {'layoutTemplate'   : 'layout'
  ,'notFoundTemplate' : 'notFound'
  ,'loadingTemplate'  : 'loading'
  ,'waitOn'           :
      function() {
        return Meteor.subscribe('initialize');
      }
  ,'before'           :
      function() {
        Session.set('RouterParams', _.extend({}, this.params));
      }
  ,'yieldTemplates'   :
      {'nav'     : {'to' : 'north'}
      ,'message' : {'to' : 'south'}
      }
  }
);

//首頁router
Router.map(function () {
  this.route(
    'home'
  , {'path'           : '/'
    ,'template'       : 'main_explain'
    }
  );
});

var initialized = false
  , disconnect  = false
  ;

if (Meteor.absoluteUrl() !== 'http://localhost:13667/') {
  Deps.autorun(function () {
    var connected = Meteor.status().connected;
    if (initialized) {
      if (connected) {
        if (disconnect) {
          alert('已恢復與伺服器間的連線！');
          disconnect = false;
        }
      }
      else {
        if (disconnect === false) {
          alert('注意！已失去與伺服器間的連線，此時所做的任何資料更改將不會更新至伺服器上！');
          disconnect = true;
        }
      }
    }
    else {
      if (connected) {
        initialized = true;
      }
    }
  });
}