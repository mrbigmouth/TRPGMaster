//require start
"use strict";
require(
  ["db"
  ]
, function() {

var DB = require("db");

Template.panel_user.events(
  {"click a.logout" :
      function() {
        Meteor.logout();
      }
  ,"click a.login" :
      function() {
        $("#login_dialog").modal("show");
      }
  }
);

Template.panel_accordion.helpers(
  {"user" :
      function() {
        return Meteor.userId();
      }
  }
);

Template.panel_accordion.events(
  {"click .panel-heading" :
      function(e) {
        var $collapse = $(e.currentTarget).closest(".panel").find(".panel-collapse:first");
        if ($collapse.hasClass("in")) {
          $collapse.slideUp(
            "fast"
          , function() {
              $collapse.removeClass("in");
            }
          );
        }
        else {
          $collapse.slideDown(
            "fast"
          , function() {
              $collapse.addClass("in");
            }
          );
        }
      }
  }
);

Template.panel_accordion_base.helpers(
  {"myRoom" :
      function() {
        return DB.room.find(
          {"$or"  :
              [{"player" : Meteor.userId()}
              ,{"adm"    : Meteor.userId()}
              ]
          }
        , {"sort" :
              {"status" : 1
              }
          }
        );
      }
  ,"nowRoom" :
      function() {
        return DB.room.find({"status" : {"$lte" : 2}});
      }
  ,"oldRoom" :
      function() {
        return DB.room.find({"status" : {"$gte" : 3}});
      }
  }
);


//require end
 }
);