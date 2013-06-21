TRPG =
  {'public'  :
      {'_id'        : 1367153330780
      }
  ,'adm'     : 'Hstk4c7N953EnBQns'
  ,'getUserNick' :
      function(_id) {
        if (_.isArray(_id)) {
          return  (
            _.map(
                  _id
                 ,function(_id) {
                    return TRPG.getUserNick(_id);
                  }
                 )
          ).join('、');
        }
        else {
          return Meteor.users.findOne({'_id' : _id}).profile.nick;
        }
      }
  ,'options' :
      {'roomStatus'      :
          ['申請中', '招募中', '進行中', '已結束']
      ,'characterStatus' :
          ['創建中', '進行中']
      ,'messageType'     :
          {'chat'    : '聊天'
          ,'dice'    : '擲骰'
          ,'outside' : '場外'
          ,'system'  : '系統'
          ,'room'    : '資訊'
          }
      }
  }