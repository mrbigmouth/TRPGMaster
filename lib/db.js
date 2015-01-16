"use strict";
define(
  "db"
, []
, function() {
    var exports =
      {"room"           : new Meteor.Collection("room")
      ,"record"         : new Meteor.Collection("record")
      ,"message_all"    : new Meteor.Collection("message_all")
      ,"character"      : new Meteor.Collection("character")
      ,"character_data" : new Meteor.Collection("character_data")
      ,"document"       : new Meteor.Collection("document")
      ,"map"            : new Meteor.Collection("map")
      ,"map_grid"       : new Meteor.Collection("map_grid")
      ,"map_detail"     : new Meteor.Collection("map_detail")
      };
    return exports;
  }
);