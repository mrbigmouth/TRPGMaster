//取得伺服器時間
Meteor.methods(
  {'getTime' :
      function() {
        return Date.now();
      }
  }
)