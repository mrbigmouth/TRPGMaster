//require start
"use strict";
define(
  "layout"
, ["db"
  ]
, function() {

var DB = require("db");
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
        return DB.room.find({"player" : Meteor.userId()});
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