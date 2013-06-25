DB.message_all.deny(
  {'insert' :
      function(userID, doc) {
        if (doc.type === 'dice') {
          var amount = doc.amount
            , face   = doc.face
            , result = []
            ;
          while ((amount -= 1) >= 0) {
            result.push( Math.floor( ( Math.random() * face ) + 1 ) );
          }
          delete doc.amount;
          doc.result = result;
        }
        return false;
      }
  }
);
/*
Meteor.methods(
  {'rollDice' :
      function(data) {
        var user = this.userId;
        if (data && Array.isArray(data.dices)) {
          data.dices.forEach(function(v, k, a) {
            var dice    =
                  {'_id'     : Date.now()
                  ,'room'    : data.room
                  ,'user'    : user
                  ,'type'    : 'dice'
                  ,'chapter' : data.chapter
                  ,'section' : data.section
                  ,'who'     : data.who
                  ,'isHide'  : data.isHide
                  }
              , dices   = v.dice
              , face    = v.face
              , result  = []
              ;
            dice.name = v.name;
            dice.note = v.note;
            dice.face = face;
            dice.addEach = v.addEach;
            while ((dices -= 1) >= 0) {
              result.push( Math.floor( ( Math.random() * face ) + 1 ) );
            }
            dice.result = result;
            dice.add = v.add;
            dice.extra = v.extra;

            DB.message.insert(dice);
          });
          return true;
        }
        return false;
      }
  }
)
*/