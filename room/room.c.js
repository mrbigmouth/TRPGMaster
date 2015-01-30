//require start
require(
  ["db"
  ,"config"
  ,"util"
  ]
, function() {

var DB      = require("db")
  , CONFIG  = require("config")
  , util    = require("util")
  ;
//左側導覽列
Template.panel_accordion_room.helpers(
  {"chapter" :
      function() {
        var result;
        result =
          DB.record.find(
            {"room"     : this.room._id
            ,"chapter"  : {"$exists" : false}
            }
          , {"sort"     : {"sort" : 1}}
          );
        return result;
      }
  ,"character" :
      function() {
        var result;
        result =
          DB.character.find(
            {"room"     : this.room._id
            }
          , {"sort"     : {"sort" : 1}}
          );
        return result;
      }
  }
);

//require end
 }
);