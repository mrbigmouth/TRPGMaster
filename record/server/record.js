"use strict";
//var db = new Meteor.Collection("record");
Meteor.publish(
  "record"
, function () {
    var publisher = this;
    console.log(DB.record.find().count());
    return DB.record.find();
  }
);
