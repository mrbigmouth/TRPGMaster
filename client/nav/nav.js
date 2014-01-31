//dropdown
Template.nav.rendered =
    function() {
      $(this.find('a[data-toggle="dropdown"]')).dropdown();
    }

//展開連結
Template.nav_roomLink.events(
  {'mouseover li.room' :
      function(e, ins) {
        $(e.currentTarget).addClass('open');
      }
  ,'mouseout li.room' :
      function(e, ins) {
        $(e.currentTarget).removeClass('open');
      }
  }
)

//關閉導覽列
Template.nav.events(
  {'click i.close' :
      function() {
        $('body').data('layout').close('north');
      }
  }
)

//room link
Template.nav_roomLink.helpers(
  {'allRooms'       :
      function() {
        return DB.room.find({'status' : { '$gt' : 0 }}, {'sort' : { 'status' : 1 }});
      }
  ,'allChapters'    :
      function(room) {
        return DB.record.find({'room' : room, 'chapter' : {'$exists' : false} });
      }
  }
)

Template.nav_user.events(
  {'click a.logout' :
      function() {
        Meteor.logout();
      }
  }
)