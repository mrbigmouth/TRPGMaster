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