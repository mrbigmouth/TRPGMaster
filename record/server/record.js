"use strict";
//var db = new Meteor.Collection("record");
Meteor.publish(
  "record"
, function () {
    var publisher = this;
    console.log("publish record!");
    return DB.record.find();
  }
);
