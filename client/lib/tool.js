TOOL = 
  //取得已知_id之user之nick
  {'getUserNick' :
      function(user) {
        user = Meteor.users.findOne(user);
        if (user) {
          return user.profile.nick;
        }
        else {
          return '不明人物';
        }
      }
  //轉換timeStamp為中文時間
  ,'convertTimeToChinese' :
      function(time) {
        time = parseInt(time, 10);
        if (time) {
          return moment(time).format('[(]YYYY/MM/DD HH:mm:ss[)]');
        }
        else {
          return '(????/??/?? ??:??:??)'
        }
      }
  //判斷目前使用者是否為目前房間之管理者
  ,'userIsAdm' :
      function() {
        var id = Meteor.userId();
        return (id && (id == TRPG.adm || _.indexOf(Session.get('room').adm, id) !== -1 ));
      }
  //判斷目前使用者是否為目前房間之玩家
  ,'userIsPlayer' :
      function() {
        var id = Meteor.userId();
        return (id && (id == TRPG.adm || _.indexOf(Session.get('room').adm, id) !== -1 || _.indexOf(Session.get('room').player, id) !== -1));
      }
  };