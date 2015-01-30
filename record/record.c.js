//require start
require(
  ["db"
  ,"config"
  ,"util"
  ]
, function() {

var DB      = require("db")
  , CONFIG  = require("config")
  ;

Template.panel_accordion_chapter.helpers(
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
  ,"section" :
      function(chapterId) {
        var result;
        result =
          DB.record.find(
            {"chapter"  : chapterId
            ,"section"  : {"$exists" : false}
            }
          , {"sort"     : {"sort" : 1}}
          );
        return result;
      }
  ,"isAdm"    :
      function(room) {
        var userId = Meteor.userId();
        return (userId === CONFIG.adm || _.indexOf(room.adm, userId) !== -1);
      }
  }
);

Template.panel_accordion_chapter.events(
  {"click [data-action=\"addSection\"]" :
      function(e, ins) {
        console.log(ins.data);
      }
  ,"click [data-action=\"addChapter\"]" :
      function(e, ins) {
        console.log(ins.data);
      }
  }
);

//require end
 }
);