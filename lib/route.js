var SUBSCRIBE = new SubsManager();
//基本設定
Router.configure(
  {"layoutTemplate"   : "layout"
  ,"notFoundTemplate" : "notFound"
  ,"loadingTemplate"  : "loading"
  ,"yieldRegions"     :
      {"header"           : {"to" : "north"}
      }
  ,"fastRender"       : true
  }
);
//不需要轉換router name
Router.setTemplateNameConverter(function (str) { return str; });

Router.route(
  "home"
, {"path"         : "/"
  ,"waitOn"       :
      function() {
        return SUBSCRIBE.subscribe("record");
      }
  ,"fastRender"       : true
  }
);