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
, function (roomId) {
    var character
      , record
      ;

    character =
        DB.character.find(
          {"room"   : roomId
          ,"$or"    :
              [ {"hide"   : false}
              , {"adm"    : this.userId}
              ]
          }
        , {"fields" :
              {"name"     : 1
              ,"room"     : 1
              }
          }
        );
    record =
        DB.record.find(
          {"room"     : roomId
          ,"chapter"  : {"$exists"  : false}
          }
        , {"fields"   :
              {"name"     : 1
              ,"room"     : 1
              ,"chapter"  : 1
              }
          }
        );
    return [character, record];
  }
);


//require end
 }
);