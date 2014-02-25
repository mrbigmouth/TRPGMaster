var diceDep   = new Deps.Dependency()
  , callDice
  , $dice
  , $mainDice
  , $eachDice
  , undefined
  ;

//呼叫擲骰視窗
callDice =
    function(data) {
      diceDep.changed();
      $dice
        .data('diceData', data)
        .modal('show');
    }

/**
 * 暫時可以從說明頁中擲骰
 */
Template.main_explain.events(
  {'click a.dice' :
      function() {
        var params  = Session.get('RouterParams') || {};
        callDice(
          {'room'    : params.room
          }
        )
      }
  }
)

//從段落中呼叫擲骰
Template.chapter_section.events(
  {'click a.dice' :
      function(e, ins) {
        var params  = Session.get('RouterParams') || {}
          , room    = DB.room.findOne(params.room)
          , chapter = DB.record.findOne(params.chapter)
          , section = DB.record.findOne(ins.data._id)
          ;
        callDice(
          {'title'    : '擲骰--' + room.name + '--' + chapter.name + '--' + section.name
          ,'room'     : room._id
          ,'chapter'  : chapter._id
          ,'section'  : section._id
          }
        )
      }
  }
)

//開始後註冊$dice
Meteor.startup(function() {
  var $times;
  $dice = $('#dice_form').modal({'show' : false, 'backdrop' : false});
  $dice.draggable(
    {'handle' : 'div.modal-header'
    ,'cursor' : 'move'
    ,'delay'  : 0
    }
  );

  //主要擲骰設定
  $mainDice = $dice.find('div.mainDice:first');
  //每次擲骰template
  $eachDice = $dice.find('div.eachDice:first').clone();
  //事件
  //調整擲骰次數
  $times = $mainDice.find('input.times:first');
  $times.on('change', function() {
      var times    = $(this).val()
        , $nowDice = $mainDice.nextAll('div.eachDice')
        , needMore = parseInt(times, 10) - $nowDice.length
        ;
      if (times > 0) {
        $nowDice.not(':lt(' + times +')').remove();
        while ((needMore -= 1) >= 0) {
          $nowDice.last().after($eachDice.clone());
        }
      }
    });

  //自動選項
  $dice
    //擲骰人自動選項
    .find('input.who')
      .typeahead(
        {'source'    : []
        ,'minLength' : 0
        ,'items'     : 255
        ,'css'       :
            {'max-height' : '300px'
            ,'overflow-y' : 'auto'
            }
        }
      )
      .end()
    //擲骰名目自動選項
    .find('input.saveName')
      .typeahead(
        {'source'    : []
        ,'minLength' : 0
        ,'items'     : 255
        ,'css'       :
            {'max-height' : '300px'
            ,'overflow-y' : 'auto'
            }
        }
      )
      .end()
    //擲骰名稱自動選項
    .find('input.name')
      .typeahead(
        {'source'    : []
        ,'minLength' : 0
        ,'items'     : 255
        ,'css'       :
            {'max-height' : '300px'
            ,'overflow-y' : 'auto'
            }
        }
      )
      .end()
    //骰子面數自動選項
    .find('input.face')
      .typeahead(
        {'source'    : ['2', '3', '4', '6', '8', '10', '12', '20', '100']
        ,'items'     : 9
        ,'minLength' : 0
        ,'matcher'   : function() { return true; }
        }
      )
  Deps.autorun(function () {
    var params    = Session.get('RouterParams') || {}
      , room      = DB.room.findOne(params.room)
      , $find     = { 'adm' : Meteor.userId() }
      , character
      ;
    if (room) {
      $find.room = room._id;
    }
    //更新擲骰人自動選項
    $dice.find('input.who').data('typeahead').source = _.pluck(DB.character.find($find).fetch(), 'name');
  });

  //自動填入資料
    //總合
  var sum        =
      function(character, data) {
        return _.reduce(data
                       ,function(memo, v) {
                          var undefined;
                          if (v.value !== undefined) {
                            return v.value + memo;
                          }
                          if (v.use !== undefined) {
                            return (findNumber(character, v.use) || 0) + memo;
                          }
                          return memo;
                        }
                       ,0
                       );
      }
    //尋找並回傳特定name object之函數
    , findName   =
      function(data, name) {
        return _.find(data, function(v){ return v.name === name; });
      }
    , findNumber =
      function(character, name) {
        var result = DB.character_data.findOne({'character' : character, 'type' : 'dice', 'name' : name});
        if (! result) {
          return 0;
        }
        return sum(character, result.value);
      }
  $dice
    .find('input.who')
      //修改擲骰人時自動調整可用擲骰名目與擲骰名稱的自動填入資料
      .on('change', function() {
        var result    = []
          , who       = this.value
          , character = DB.character.findOne({'adm' : Meteor.userId(), 'name' : who})
          , saveData  = STORE('QuickDice') || {}
          , dices     = {}
          ;
        saveData = saveData[who] || {};
        if (character) {
          DB.character_data
            .find({'character' : character._id, 'type' : 'dice'}, {'sort' : {'sort' : 1}})
            .forEach(function(v) {
              var add = sum(character._id, v.value);
              saveData[ v.name ] =
                  {'times'   : 1
                  ,'isHide'  : false
                  ,'dices'   :
                      [ {'name'    : v.name
                        ,'note'    : ''
                        ,'addEach' : false
                        ,'amount'  : 1
                        ,'face'    : 20
                        ,'add'     : add
                        ,'extra'   : 0
                        }
                      ]
                  }
              dices[ v.name ] =
                  {'note'    : ''
                  ,'addEach' : false
                  ,'amount'  : 1
                  ,'face'    : 20
                  ,'add'     : add
                  ,'extra'   : 0
                  }
            });
          //更新擲骰名目自動選項
          $dice.find('input.saveName').data('typeahead').source = _.keys(saveData);
          //更新擲骰名目自動填入資料
          $dice.find('input.saveName').data('QuickDice', saveData);
          //更新擲骰名稱自動選項
          $dice.find('input.name').data('typeahead').source = _.keys(dices);
          //更新擲骰名稱自動填入資料
          $dice.find('input.name').data('QuickDice', dices);
        }
      })
      .end()
    .find('input.saveName')
      //自動填入 快擲名稱 資料
      .on('change', function() {
        var saveName = this.value
          , quick    = $.data(this, 'QuickDice')
          , data
          , dices
          , dSize
          , dKeys
          , undefined
          ;
        if (quick === undefined) {
          return true;
        }
        data     = quick[ saveName ]
        if (data === undefined) {
          return true;
        }
        dices    = data.dices;
        dSize    = _.size(dices);
        dKeys    = _.keys(dices);
        if (! dSize) {
          return true;
        }
        if (data) {
          $dice
            .find('input.times').val(dSize).trigger('change').end()
            .find('input.isHide').prop('checked', data.isHide).end()
            .find('input.save').prop('checked', false).end()
            .find('div.eachDice').each(function(i) {
              var name = dKeys[i]
                , d    = dices[ name ]
                ;
              $(this)
                .find('input')
                  .filter('.name').val(name).end()
                  .filter('.addEach').prop('checked', d.addEach).end()
                  .filter('.amount').val(d.amount).end()
                  .filter('.face').val(d.face).end()
                  .filter('.add').val(d.add).end()
                  .filter('.extra').val(0);
            });
        }
      })
      .end()
    .find('input.name')
      //自動填入 擲骰名目 資料
      .on('change', function() {
        var $input = $(this).closest('div.eachDice').find('input')
          , name   = this.value
          , quick  = $.data(this, 'QuickDice')
          , data   = quick[ name ]
          ;
        if (data) {
          $input
            .filter('.note').val(data.note).end()
            .filter('.addEach').prop('checked', data.addEach).end()
            .filter('.amount').val(data.amount).end()
            .filter('.face').val(data.face).end()
            .filter('.add').val(data.add).end()
            .filter('.extra').val(0)
        }
      })
      ;
});

//擲骰 dialog template
Template.dice_form.helpers(
  {'title' :
      function() {
        diceDep.depend();
        var data  = $dice && $dice.data('diceData')
          , title = '擲骰'
          ;

        if (! data) {
          return '擲骰';
        }
        return data.title;
      }
  }
)

//進行擲骰
Template.dice_form.events(
  {'click button.btn-primary' :
      function() {
        var data     = $dice.data('diceData')
          , room     = data.room
          , chapter  = data.chapter
          , section  = data.section
          , $input   = $dice.find('input')
          , who      = $input.filter('.who').val()
          , isHide   = $input.filter('.isHide').prop('checked')
          , isSave   = $input.filter('.isSave').prop('checked')
          , dices    = {}
          , saveName
          , saveData
          , saveDices
          , undefined
          ;
        console.log(data);
          debugger;
        $dice.find('div.eachDice').each(function() {
          var $input = $(this).find('input')
            , d      =
                {'type'    : 'dice'
                ,'room'    : room
                ,'chapter' : chapter
                ,'section' : section
                ,'who'     : who
                ,'isHide'  : isHide
                ,'name'    : $input.filter('.name').val()
                ,'note'    : $input.filter('.note').val()
                ,'addEach' : $input.filter('.addEach').prop('checked')
                ,'amount'  : parseInt($input.filter('.amount').val(), 10)
                ,'face'    : parseInt($input.filter('.face').val(), 10)
                ,'add'     : parseInt($input.filter('.add').val(), 10)
                ,'extra'   : parseInt($input.filter('.extra').val(), 10)
                }
            ;
          if (isSave) {
            dices[ d.name ] = _.pick(d, 'addEach', 'amount', 'face', 'add', 'extra');
          }
          DB.message_all.insert(d);
        });
        if (isSave) {
          saveName = $input.filter('.saveName').val();
          saveData = STORE('QuickDice') || {};
          saveData[ who ] = saveData[ who ] || {};
          saveData[ who ][ saveName ] =
              {'isHide' : isHide
              ,'dices'  : dices
              };
          STORE('QuickDice', saveData);
        }
        $dice
          .modal('hide')
          .find('form')
            .trigger('reset');
      }
  }
)