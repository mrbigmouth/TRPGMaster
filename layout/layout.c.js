"use strict";
define(
  "layout"
, ["db"
  ]
, function() {
    var DB      = require("db")
      , exports = {}
      ;
    Template.layout.rendered =
        function() {
          var ins = this;
          initializePane(ins);
          exports.ins = ins;
        };

    Template.panel_accordion_base.helpers(
      {"nowRoom" :
          function() {
            return DB.room.find({});
          }
      }
    );

    function initializePane(ins) {
      ins.pane =
            {"panel"          :
                {"opened"         : false
                ,"openStyle"      :
                    {"min-width"      : "200px"
                    ,"width"          : "200px"
                    }
                ,"closeStyle"     :
                    {"min-width"      : "15px"
                    ,"width"          : "15px"
                    }
                ,"direction"      : "horizontal"
                ,"$el"            : ins.$("#panel")
                }
            ,"message"        :
                {"opened"         : false
                ,"openStyle"      :
                    {"min-height"      : "200px"
                    ,"height"          : "200px"
                    }
                ,"closeStyle"     :
                    {"min-height"      : "15px"
                    ,"height"          : "15px"
                    }
                ,"direction"      : "vertical"
                ,"$el"            : ins.$("#message")
                }
            };
      ins.openPane =
          function(which) {
            var ins   = this
              , pane  = ins.pane[which]
              ;
            pane.$el.removeClass("closed").addClass("opened");
            pane.opened = true;
            ins.resizePane();
            return ins;
          };
      ins.closePane =
          function(which) {
            var ins   = this
              , pane  = ins.pane[which]
              ;
            pane.$el.removeClass("opened").addClass("closed").removeAttr("style");
            pane.opened = false;
            ins.resizePane();
            return ins;
          };
      ins.togglePane =
          function(which) {
            var ins   = this
              , pane  = ins.pane[which]
              ;
            if (pane.opened) {
              ins.closePane(which);
            }
            else {
              ins.openPane(which);
            }
            return ins;
          };
      ins.resizePane =
          function() {
            var ins       = this
              , left
              , height
              ;
            if (ins.firstNode && $("body").find(ins.firstNode).length) {
              left = ins.pane.panel.$el.outerWidth(true);
              height = $(window).height() - ins.pane.message.$el.outerHeight(true);
              ins.$("#main").css("margin-left", left + "px");
              ins.$("#up_warpper").css("height", height + "px");
            }
            return ins;
          };
      //綁定事件
      _.bindAll(ins, "openPane", "closePane", "togglePane", "resizePane");
      //初始化
      _.each(
        ins.pane
      , function(pane, paneName) {
          ins.openPane(paneName);
          pane.$el.on(
            "click"
          , ".layout_toggler"
          , function() {
              ins.togglePane(paneName);
            }
          );
          pane.$el.on(
            "mousedown"
          , ".layout_handle"
          , function() {
              ins.resizing = pane;
            }
          );
        }
      );
      $(window).on("resize", ins.resizePane);
      _.defer(ins.resizePane);
      //調整pane大小
      ins.resizing = null;
      $(document).on(
        "mouseup"
      , function() {
          ins.resizing = null;
        }
      );
      $(document).on(
        "mousemove"
      , function(e) {
          var resizing = ins.resizing
            , height
            ;
          if (resizing) {
            if (resizing.direction === "horizontal") {
              resizing.$el.width(e.pageX);
            }
            else {
              height = $(window).height();
              resizing.$el.height(height - e.pageY);
            }
            ins.resizePane();
          }
        }
      );
    }
    return exports;
  }
);
