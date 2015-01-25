//require start
require(
  ["db"
  ,"config"
  ,"util"
  ]
, function() {

var DB = require("db");
Meteor.publish(
  "room"
, function (room) {
    var character =
        DB.character.find(
          {"room"   : room}
        , {"fields" :
              {"name" : 1
              ,"room" : 1
              }
          }
        );
    return [character];
  }
);


//require end
 }
);