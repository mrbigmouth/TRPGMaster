//左側導覽謝
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
  }
);