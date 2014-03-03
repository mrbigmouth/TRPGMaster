Template.main_character_PF.helpers(
  {'title'          :
      function(character) {
        var RouterParams = Session.get('RouterParams')
          , character    = (
              ( DB.character.find(RouterParams.character, {'fields': {'name': 1}}).fetch()[0] ) ||
              {'name' : ''}
            )
          , room         = (
              ( DB.room.find(RouterParams.room, {'fields': {'name': 1}}).fetch()[0] ) ||
              {'name' : ''}
            )
          ;
        return room.name + '--' + character.name + '角色表';
      }
  ,'characterID'      :
      function() {
        return Session.get('RouterParams').character || '';
      }
  }
)

var updateMSG =
    function(characterID, msg1, msg2) {
      var character = DB.character.findOne(characterID) || {};
      DB.message_all.insert(
        {'room'      : character.room
        ,'type'      : 'room'
        ,'msg'       : msg1 + '角色「' + character.name + '」' + msg2 + '。'
        ,'character' : character._id
        }
      )
    }
  , findNameNumber =
    function(name) {
      var useFilter =
            {'character' : Session.get('RouterParams').character
            ,'type'      : 'number'
            ,'name'      : name
            }
        , number    = DB.character_data.find(useFilter, {fields: {'_id': 1}}).fetch()[0]
        ;
      return (number ? findNumber(number._id) : 0);
    }
  //尋找特定id角色數值總合 
  , findNumber =
    function(id) {
      var number = DB.character_data.find(id, {fields: {'character' : 1, 'value': 1}}).fetch()[0];
      if (! number) {
        console.log('cant find number' + id);
        return 0;
      }
      return  _.reduce( number.value
                      , function(memo, v) {
                          var useFilter =
                                {'character' : number.character
                                ,'type'      : 'number'
                                }
                            , useNumber
                            , undefined
                            ;
                          if (v.value !== undefined) {
                            return v.value + memo;
                          }
                          if (v.use !== undefined) {
                            useFilter.name = v.use;
                            useNumber = DB.character_data.find(useFilter, {fields: {'_id': 1}}).fetch()[0];
                            return (useNumber ? findNumber(useNumber._id) : 0) + memo;
                          }
                          return memo ;
                        }
                      , 0
                      );
    }
  , floatMul   =
      function (a, b) {
        var atens = Math.pow(10,String(a).length - String(a).indexOf('.') - 1)
          , btens = Math.pow(10,String(b).length - String(b).indexOf('.') - 1)
          ;
        return (a * atens) * (b * btens) / (atens * btens);
      }
  , floatAdd   =
      function (a, b) {
        var atens = Math.pow(10,String(a).length - String(a).indexOf('.') - 1)
          , btens = Math.pow(10,String(b).length - String(b).indexOf('.') - 1)
          , tens  = Math.max(atens, btens)
          ;
        return ((a * tens) + (b * tens)) / tens;
      }
  //計算角色物品總重或總財富
  , sumItem    =
      function(character, what) {
        var useFilter =
              {'character' : character
              ,'type'      : 'item'
              }
          , fields    = { 'amount' : 1 }
          ;
        fields[ what ] = 1;
        return _.reduce(DB.character_data.find(useFilter, {'fields' : fields}).fetch()
                       ,function(memo, v) {
                          return floatAdd(memo, floatMul(v[what], v.amount));
                        }
                       ,0
                       );
      }
  , trim       =
      function(data) {
        return (data.trim ? data.trim() : data.replace(/^\s+|\s+$/gm,''));
      }
  , intToBigA  = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９']
  , intToBig   =
      function(no) {
        var result = '';
        _.each((no + '').split(''), function(v) {
          result += intToBigA[ v ];
        });
        return result;
      }
  , getMaxLevel =
      function(character) {
        var allLevel  = DB.character_data.find({'character' : character, 'type' : 'level'}, {'fields' : {'level' : 1}}).fetch();
        if (allLevel.length > 0) {
          return _.max(allLevel, function(d) { return d.level; }).level;
        }
        else {
          return 0;
        }
      }
  , getMaxSpellCircle =
      function(character, belong) {
        var allLevel  = DB.character_data.find({'character' : character, 'type' : 'known', 'belong' : belong}, {'fields' : {'circle' : 1}}).fetch();
        if (allLevel.length > 0) {
          return _.max(allLevel, function(d) { return d.circle; }).circle;
        }
        else {
          return 0;
        }
      }
  , totalSpell =
      function(type, character, belong, circle) {
        var filter = {'character' : character, 'belong' : belong};
        if (circle !== 'all') {
          filter.circle = circle;
        }
        switch (type) {
        case 'known' :
          filter.type = 'known';
          break;
        case 'slot' :
          filter.type = 'slot';
          break;
        case 'slotAvailable' :
          filter.type = 'slot';
          filter.used = false;
          break;
        }
        return DB.character_data.find(filter).count();
      }
  , toggleContent =
      function(e, ins) {
        $(ins.firstNode).find('div.content:first').toggle();
      }
  ;

Template.character_PF_profile.helpers(
  {'characterName' :
      function(id) {
        var character = DB.character.find(id, {fields: {'name': 1}}).fetch()[0];
        return character ? character.name : '';
      }
  ,'profileList'   :
      function(id) {
        return DB.character_data.find({'character' : id, 'type' : 'profile'}, {'sort' : {'sort' : 1}});
      }
  }
)
Template.character_PF_profile.events(
  //展開收起內容
  {'click legend' : toggleContent
  //新增基本訊息
  ,'click legend a' :
      function(e, ins) {
        var character = ins.data + ''
          , data      =
            {'character' : character
            ,'type'      : 'profile'
            ,'value'     : ''
            }
          ;

        //防止繼續往上觸發click
        e.stopPropagation();

        data.name = window.prompt('請輸入要新增的基本訊息名稱：');
        if (! data.name) {
          return false;
        }
        data['class'] = window.prompt('請設定輸入格大小(1~9)：');
        if (data['class']) {
          if (! isNaN(data['class'])) {
            data['class'] = 'span' + data['class'];
          }
        }
        else {
          data['class'] = '';
        }

        DB.character_data.insert(data, function() {
          updateMSG(character, '新增了', '的「' + data.name + '」基本訊息資料');
        });
      }
  ,'click i.icon-remove' :
      function(e, ins) {
        var data      = this
          , character = ins.data + ''
          ;
        if (confirm('你確定要刪除角色的「' + data.name + '」基本訊息嗎？')) {
          DB.character_data.remove(data._id, function() {
            updateMSG(character, '刪除了', '的「' + data.name + '」基本訊息資料');
          });
        }
      }
  ,'change input' :
      function(e, ins) {
        var name      = e.currentTarget.name
          , value     = e.currentTarget.value
          , data      = this
          , character = ins.data + ''
          ;
        if (name === 'name') {
          DB.character.update(
            character
          , {'$set' : {'name' : value}}
          , function() {
              updateMSG(character, '重新命名', '為「' + value + '」');
            }
          );
        }
        else {
          DB.character_data.update(
            data._id
          , {'$set' : {'value' : value}}
          , function() {
              updateMSG(character, '更新了', '的「' + data.name + '」基本訊息資料');
            }
          );
        }
      }
  }
)

//number
Template.character_PF_number.helpers(
  {'numberList'     :
      function(id) {
        return DB.character_data.find({'character' : id, 'type' : 'number'}, {'sort' : {'sort' : 1}});
      }
  }
)
Template.character_PF_number.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增角色數值
  ,'click legend a' :
      function(e, ins) {
        var character = ins.data + ''
          , newData      =
            {'character' : character
            ,'type'      : 'number'
            ,'value'     : []
            }
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的數值名稱：');
        if (! newData.name) {
          return false;
        }
        if (DB.character_data.findOne({'character' : character, 'type' : 'number', 'name' : newData.name}) !== undefined) {
          alert('角色已經存在數值「' + newData.name +'」');
          return false;
        }

        DB.character_data.insert(newData, function() {
          updateMSG(character, '新增了', '的「' + newData.name + '」數值資料');
        });
      }
  }
)

Template.character_PF_number_list.helpers(
  {'findNumber'     : findNumber
  ,'findNameNumber' : findNameNumber
  }
)
Template.character_PF_number_list.events(
  //刪除一列數值
  {'click label > i.icon-remove' :
      function(e, ins) {
        var data = ins.data;
        if (confirm('你確定要刪除角色的「' + data.name + '」數值資料嗎？')) {
          DB.character_data.remove(data._id, function() {
            updateMSG(data.character, '刪除了', '的「' + data.name + '」數值資料');
          });
        }
      }
  //刪除一列數值中的某個加值
  ,'click div.eachNumber span.add-on > i.icon-remove' :
      function(e, ins) {
        var data     = ins.data
          , sumName  = data.name
          , value    = data.value
          , name     = this.name
          , index
          , undefined
          ;

        _.find(
          value
        , function(obj, key) {
            if (obj.name === name) {
              index = key;
              return true; 
            }
            else {
              return false;
            }
          }
        )
        if (index === undefined) {
          console.log('error: can\'t find name:[' + name + '] index!');
          return false;
        }

        if (confirm('你確定要刪除「' + sumName + '」數值中的「' + name + '」加值嗎？')) {
          value.splice(index, 1);
          DB.character_data.update(
            data._id
          , {'$set' : {'value' : value}}
          , function() {
              updateMSG(data.character, '刪除了', '的「' + sumName + '」數值的「' + name + '」加值');
            }
          );
        }
      }
  //在一列數值中新增加值
  ,'click div.eachNumber strong' :
      function(e, ins) {
        var data     = ins.data
          , value    = data.value
          , $this    = $(e.currentTarget)
          , sumName  = data.name
          , newAdd   = {}
          , undefined
          ;

        newAdd.name = window.prompt('請輸入加值名稱：');
        if (! newAdd.name) {
          return false;
        }
        if (_.find(value, function(obj) { return obj.name === newAdd.name; }) !== undefined) {
          alert('此列數值已存在名稱為「' + newAdd.name + '」的加值！');
          return false;
        }
        newAdd.use = window.prompt('請輸入此加值所參照的角色數值名稱\n（或不輸入，手動修改數值）：');
        if (! newAdd.use) {
          delete newAdd.use;
          newAdd.value = 0;
        }
        value.push(newAdd);
        DB.character_data.update(
          data._id
        , {'$set' : {'value' : value}}
        , function() {
            updateMSG(data.character, '新增了', '的「' + data.name + '」數值的「' + newAdd.name + '」加值');
          }
        );
      }
  //修改加值
  ,'change input' :
      function(e, ins) {
        var data     = ins.data
          , sumName  = data.name
          , value    = data.value
          , name     = this.name
          , index
          , undefined
          ;

        _.find(
          value
        , function(obj, key) {
            if (obj.name === name) {
              index = key;
              return true; 
            }
            else {
              return false;
            }
          }
        )
        if (index === undefined) {
          console.log('error: can\'t find name:[' + name + '] index!');
          return false;
        }

        value[index].value = parseInt(e.currentTarget.value, 10);
        DB.character_data.update(
          data._id
        , {'$set' : {'value' : value}}
        , function() {
            updateMSG(data.character, '修改了', '的「' + sumName + '」數值的「' + name + '」加值');
          }
        );
      }
  }
)

//dice
Template.character_PF_dice.helpers(
  {'diceList'     :
      function(id) {
        return DB.character_data.find({'character' : id, 'type' : 'dice'}, {'sort' : {'sort' : 1}});
      }
  }
)
Template.character_PF_dice.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增擲骰資料
  ,'click legend a' :
      function(e, ins) {
        var character = ins.data + ''
          , newData   =
            {'character' : character
            ,'type'      : 'dice'
            ,'value'     : []
            }
          , undefined
          ;

        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的擲骰名稱：');
        if (! newData.name) {
          return false;
        }
        if (DB.character_data.findOne({'character' : character, 'type' : 'dice', 'name' : newData.name}) !== undefined) {
          alert('角色已經存在擲骰資料「' + newData.name +'」');
          return false;
        }

        DB.character_data.insert(newData, function() {
          updateMSG(character, '新增了', '的「' + newData.name + '」擲骰資料');
        });
      }
  }
)
Template.character_PF_dice_list.helpers(
  {'getDice'        : findNumber
  ,'findNameNumber' : findNameNumber
  }
)
Template.character_PF_dice_list.events(
  //刪除一列數值
  {'click label > i.icon-remove' :
      function(e, ins) {
        var data = ins.data;
        if (confirm('你確定要刪除角色的「' + data.name + '」擲骰資料嗎？')) {
          DB.character_data.remove(data._id, function() {
            updateMSG(data.character, '刪除了', '的「' + data.name + '」擲骰資料');
          });
        }
      }
  //刪除一列數值中的某個加值
  ,'click div.eachDice span.add-on > i.icon-remove' :
      function(e, ins) {
        var data     = ins.data
          , sumName  = data.name
          , value    = data.value
          , name     = this.name
          , index
          , undefined
          ;

        _.find(
          value
        , function(obj, key) {
            if (obj.name === name) {
              index = key;
              return true; 
            }
            else {
              return false;
            }
          }
        )
        if (index === undefined) {
          console.log('error: can\'t find name:[' + name + '] index!');
          return false;
        }

        if (confirm('你確定要刪除「' + sumName + '」擲骰中的「' + name + '」加值嗎？')) {
          value.splice(index, 1);
          DB.character_data.update(
            data._id
          , {'$set' : {'value' : value}}
          , function() {
              updateMSG(data.character, '刪除了', '的「' + sumName + '」擲骰的「' + name + '」加值');
            }
          );
        }
      }
  //在一列數值中新增加值
  ,'click div.eachDice strong' :
      function(e, ins) {
        var data     = ins.data
          , value    = data.value
          , $this    = $(e.currentTarget)
          , sumName  = data.name
          , newAdd   = {}
          , undefined
          ;

        newAdd.name = window.prompt('請輸入加值名稱：');
        if (! newAdd.name) {
          return false;
        }
        if (_.find(value, function(obj) { return obj.name === newAdd.name; }) !== undefined) {
          alert('此列數值已存在名稱為「' + newAdd.name + '」的加值！');
          return false;
        }
        newAdd.use = window.prompt('請輸入此加值所參照的角色數值名稱\n（或不輸入，手動修改數值）：');
        if (! newAdd.use) {
          delete newAdd.use;
          newAdd.value = 0;
        }
        value.push(newAdd);
        DB.character_data.update(
          data._id
        , {'$set' : {'value' : value}}
        , function() {
            updateMSG(data.character, '新增了', '的「' + data.name + '」擲骰的「' + newAdd.name + '」加值');
          }
        );
      }
  //修改加值
  ,'change input' :
      function(e, ins) {
        var data     = ins.data
          , sumName  = data.name
          , value    = data.value
          , name     = this.name
          , index
          , undefined
          ;

        _.find(
          value
        , function(obj, key) {
            if (obj.name === name) {
              index = key;
              return true; 
            }
            else {
              return false;
            }
          }
        )
        if (index === undefined) {
          console.log('error: can\'t find name:[' + name + '] index!');
          return false;
        }

        value[index].value = parseInt(e.currentTarget.value, 10);
        DB.character_data.update(
          data._id
        , {'$set' : {'value' : value}}
        , function() {
            updateMSG(data.character, '修改了', '的「' + sumName + '」擲骰的「' + name + '」加值');
          }
        );
      }
  }
)

//item
Template.character_PF_item.helpers(
  {'itemList'    :
      function(id) {
        return DB.character_data.find({'character' : id, 'type' : 'item'}, {'sort' : {'sort' : 1}});
      }
  //計算角色總財富或總負重
  ,'sumItem' : sumItem
  }
)
Template.character_PF_item.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增物品
  ,'click legend a' :
      function(e, ins) {
        var character = ins.data + ''
          , newData   =
            {'character' : character
            ,'type'      : 'item'
            ,'name'      : ''
            ,'detail'    : ''
            ,'amount'    : 1
            ,'weight'    : 0
            ,'worth'     : 0
            }
          ;

        //防止繼續往上觸發click
        e.stopPropagation();

        DB.character_data.insert(newData, function() {
          updateMSG(character, '新增了', '的物品項目');
        });
      }
  }
)
Template.character_PF_item_list.helpers(
  {'trim' : trim
  }
)
Template.character_PF_item_list.events(
  //展開收起細節
  {'click i.icon-plus, click i.icon-th-list' :
      function(e) {
        $(e.currentTarget).closest('div.eachItem').find('div.detail').toggle();
      }
  ,'click i.icon-remove' :
      function(e, ins) {
        var item      = ins.data
          , character = item.character
          , name      = item.name
          ;

        if (confirm('你確定要刪除角色的物品「' + name + '」嗎？')) {
          DB.character_data.remove(item._id, function() {
            updateMSG(character, '刪除了', '的「' + name + '」物品資料');
          });
        }
      }
  ,'change input, change textarea' :
      function(e, ins) {
        var item      = ins.data
          , character = item.character
          , type      = e.currentTarget.name
          , value     = e.currentTarget.value
          , $set      = {}
          , msg       = '的' + (item.name ? '「' + item.name + '」' : '一項未命名') + '物品細節'
          ;
        switch (type) {
        case 'amount' :
        case 'weight' :
        case 'worth'  :
          $set[ type ] = parseFloat(value);
          break;
        case 'name'   :
          msg += '為「' + value + '」';
          $set[ type ] = value;
          break;
        case 'detail' :
          $set[ type ] = value;
        default       :
          break;
        }
        DB.character_data.update(item._id, {'$set' : $set}, function() {
          updateMSG(character, '調整了', msg);
        });
      }
  }
)

//spell
var spellClass    = []
  , spellClassDep = new Deps.Dependency()
  ;
Deps.autorun(function() {
  var result = []
    , temp   = {}
    , params = Session.get('RouterParams') || {}
    , undefined
    ;
  DB.character_data
    .find(
      {'character' : params.character
      ,'type'      : 'known'
      }
    , {'fields'    : {'belong' : 1}}
    )
    .forEach(function(doc) {
      if (temp[ doc.belong ] === undefined) {
        result.push(
          {'character' : params.character
          ,'belong'    : doc.belong
          }
        );
        temp[ doc.belong ] = true;
      }
    })
  if (spellClass.length !== result.length) {
    spellClass = result;
    spellClassDep.changed();
  }
});
Template.character_PF_spell.helpers(
  {'allClass'    :
      function(id) {
        spellClassDep.depend();
        return spellClass;
      }
  }
)
Template.character_PF_spell.events(
  //展開收起內容
  {'click legend'      : toggleContent
  //切換tab
  ,'click ul.nav-tabs li' :
      function(e) {
        var $this = $(e.currentTarget)
          , $tab
          , index
          , $pane
          ;

        if ($this.hasClass('active')) {
          return true;
        }
        $tab = $this.closest('ul').children();
        index = $tab.index($this);
        $pane = $tab.closest('div.content').find('div.tab-content div.tab-pane');
        $tab.not($this).removeClass('active');
        $this.addClass('active');
        $pane.removeClass('in active').eq(index).addClass('in active');
        return true;
      }
  //新增法術體系
  ,'click ul.nav-tabs a.add' :
      function(e, ins) {
        var character = ins.data + ''
          , newData   =
            {'belong'    : ''
            ,'character' : character
            ,'circle'    : 0
            ,'type'      : 'known'
            ,'name'      : ''
            ,'detail'    : ''
            }
          , filter
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.belong = window.prompt('請輸入要新增的法術體系名稱：');
        if (! newData.belong) {
          return false;
        }
        filter    =
          {'character' : character
          ,'type'      : 'known'
          ,'belong'    : newData.belong
          }
        if (DB.character_data.findOne(filter) !== undefined) {
          alert('角色已經法術體系「' + newData.belong +'」');
          return false;
        }
        DB.character_data.insert(newData, function() {
          updateMSG(character, '新增了', '的「' + newData.belong + '」法術體系');
        });
      }
  }
)
Template.character_PF_spell.rendered =
    function() {
      $(this.find('li')).addClass('active');
      $(this.find('div.tab-pane')).addClass('in active');
    }
Template.character_PF_spellClass.helpers(
  {'totalSpell'  : totalSpell
  ,'spellKnownCircle' :
      function(character, belong) {
        //取最高環 + 零環 + 最高環+1環
        var showCircle = getMaxSpellCircle(character, belong) + 2;
        if (showCircle > 10) {
          showCircle = 10;
        }
        return _.map(_.range(showCircle), function(circle) {
          return {'character' : character, 'belong' : belong, 'circle' : circle};
        });
      }
  ,'spellSlotCircle'  :
      function(character, belong) {
        var showCircle = getMaxSpellCircle(character, belong) + 1;
        if (showCircle > 10) {
          showCircle = 10;
        }
        return _.map(_.range(showCircle), function(circle) {
          return {'character' : character, 'belong' : belong, 'circle' : circle};
        });
      }
  }
);
Template.character_PF_spellClass.events(
  //展開收起內容
  {'click h4' :
      function(e) {
        $(e.currentTarget).next().toggle();
      }
  }
)
Template.character_PF_spellKnown.helpers(
  {'totalSpell'  : totalSpell
  ,'spellKnown'  :
      function(character, belong, circle) {
        return DB.character_data
                .find(
                  {'character' : character
                  ,'type'      : 'known'
                  ,'belong'    : belong
                  ,'circle'    : circle
                  }
                , {'sort'      : {'sort' : 1}
                  }
                )
      }
  ,'intToBig'    : intToBig
  ,'trim'        : trim
  }
);
Template.character_PF_spellKnown.events(
  //展開收起此環級法術的內容
  {'click h5' :
      function(e) {
        $(e.currentTarget).next().toggle();
      }
  //展開法術細節
  ,'click div.eachKnown i.icon-pencil, click div.eachKnown i.icon-th-list' :
      function(e) {
        //防止繼續往上觸發click
        e.stopPropagation();
        $(e.currentTarget).closest('div.eachKnown').find('textarea').toggle();
      }
  //新增法術
  ,'click i.icon-plus' :
      function(e) {
        var character = this.character
          , circle    = this.circle
          , belong    = this.belong
          , newData   =
            {'belong'    : belong
            ,'character' : character
            ,'circle'    : circle
            ,'type'      : 'known'
            ,'name'      : ''
            ,'detail'    : ''
            }
          ;

        //防止繼續往上觸發click
        e.stopPropagation();

        DB.character_data.insert(newData, function() {
          updateMSG(character, '新增了', '「' + belong + '」職業的一個' + circle + '環法術');
        });
      }
  //刪除法術
  ,'click i.icon-remove' :
      function() {
        var name      = this.name
          , character = this.character
          , belong    = this.belong
          , circle    = this.circle
          ;
        if (confirm('你確定要刪除法術「' + name + '」嗎？')) {
          DB.character_data.remove(this._id, function() {
            updateMSG(character, '刪除了', '「' + belong + '」職業的'  + (name ? '「' + name + '」' : '一個未命名') +  circle + '環法術資料');
          });
        }
      }
  //修改法術名稱細節
  ,'change input, change textarea' :
      function(e, ins) {
        var data      = this
          , character = data.character
          , name      = data.name
          , belong    = data.belong
          , circle    = data.circle
          , type      = e.currentTarget.name
          , value     = e.currentTarget.value
          , $set      = {}
          , msg       = '「' + belong + '」職業的' + (name ? '「' + name + '」' : '一個未命名') + circle + '環法術資料';
          ;

        if (type === 'name') {
          msg += '為「' + value + '」';
        }
        $set[ type ] = value;
        DB.character_data.update(data._id, {'$set' : $set}, function() {
          updateMSG(character, '更新了', msg);
        });
      }
  }
);
Template.character_PF_spellSlot.helpers(
  {'totalSpell'  : totalSpell
  ,'intToBig'    : intToBig
  ,'spellSlot'   :
      function(character, belong, circle) {
        return DB.character_data
                .find(
                  {'character' : character
                  ,'type'      : 'slot'
                  ,'belong'    : belong
                  ,'circle'    : circle
                  }
                , {'sort'      : {'sort' : 1}
                  }
                )
      }
  //可準備法術列表
  ,'prepareList' :
      function(character, belong, circle, prepared) {
        var result = [];
        DB.character_data
          .find(
            {'character' : character
            ,'type'      : 'known'
            ,'belong'    : belong
            ,'circle'    : circle
            }
          , {'sort'      : {'sort' : 1}
            ,'fields'    : {'name' : 1}
            }
          )
          .forEach(function(doc) {
            result.push(doc.name);
          });
        
        if (prepared) {
          result.unshift(prepared);
        }
        else {
          result.unshift('未準備');
        }
        return result;
      }
  }
);
Template.character_PF_spellSlot.events(
  //新增法術格
  {'click i.icon-plus' :
      function() {
        var character = this.character
          , circle    = this.circle
          , belong    = this.belong
          , newData   =
            {'belong'    : belong
            ,'character' : character
            ,'circle'    : circle
            ,'type'      : 'slot'
            ,'name'      : ''
            ,'used'      : false
            }
          ;
        console.log(this);
        DB.character_data.insert(newData, function() {
          updateMSG(character, '調整了', '在「' + belong + '」職業' + circle + '環法術的法術格數量');
        });
      }
  //刪除法術格
  ,'click i.icon-minus' :
      function() {
        var character = this.character
          , circle    = this.circle
          , belong    = this.belong
          , slot     =
              DB.character_data
                .findOne(
                  {'character' : character
                  ,'type'      : 'slot'
                  ,'belong'    : belong
                  ,'circle'    : circle
                  }
                , {'sort'      : {'sort' : -1}
                  }
                )
          ;
        console.log(this);
        DB.character_data.remove(slot._id, function() {
          updateMSG(character, '調整了', '在「' + belong + '」職業' + circle + '環法術的法術格數量');
        });
      }
  //修改準備法術
  ,'change select' :
      function(e, ins) {
        var data      = this
          , character = data.character
          , belong    = data.belong
          , circle    = data.circle
          , value     = $(e.currentTarget).val()
          ;

        DB.character_data.update(data._id, {'$set' : {'name' : value}}, function() {
          updateMSG(character, '調整了', '在「' + belong + '」職業' + circle + '環法術的準備法術');
        });
      }
  //標示為已使用
  ,'click i.icon-ok' :
      function(e, ins) {
        var data      = this
          , character = data.character
          , belong    = data.belong
          , circle    = data.circle
          , isUsed    = (data.used ? false : true)
          ;

        DB.character_data.update(data._id, {'$set' : {'used' : isUsed}}, function() {
          updateMSG(character, '調整了', '在「' + belong + '」職業' + circle + '環法術的法術格使用情形');
        });
      }
  }
);

//level
Template.character_PF_level.helpers(
  {'eachLevel' :
      function(character) {
        return _.map(_.range(getMaxLevel(character) + 1), function(level) {
          return {'character' : character, 'level' : level};
        });
      }
  ,'levelList' :
      function(data) {
        return  DB.character_data.find({'character' : data.character, 'type' : 'level', 'level' : data.level}, {'sort' : {'sort' : 1}});
      }
  ,'intToBig'  : intToBig
  }
);
Template.character_PF_level.events(
  //展開收起內容
  {'click legend'       : toggleContent
  //新增升級紀錄
  ,'click legend a.add' :
      function(e, ins) {
        var character = ins.data + ''
          , maxLevel  = getMaxLevel(character) + 1
          , newData   =
            {'character' : character
            ,'type'      : 'level'
            ,'level'     : maxLevel
            ,'name'      : ''
            ,'detail'    : ''
            }
          ;

        //防止繼續往上觸發click
        e.stopPropagation();

        DB.character_data.insert(newData, function() {
          updateMSG(character, '提升了', '的資訊紀錄至' + maxLevel + '級');
        });
      }
  //在一筆等級資料中新增能力資訊
  ,'click div.eachLevel a.addAbility' :
      function(e, ins) {
        var character = this.character
          , level     = this.level
          , newData   =
            {'character' : character
            ,'type'      : 'level'
            ,'level'     : level
            ,'name'      : ''
            ,'detail'    : ''
            }
          ;
        DB.character_data.insert(newData, function() {
          updateMSG(character, '更新了', level + '級的等級資訊紀錄');
        });
      }
  }
);
Template.character_PF_level_list.helpers(
  {'trim' : trim
  }
);
Template.character_PF_level_list.events(
  //展開能力細節
  {'click div.eachAbility i.icon-plus, click div.eachAbility i.icon-th-list' :
      function(e) {
        $(e.currentTarget).closest('div.eachAbility').find('textarea').toggle();
      }
  //刪除能力
  ,'click div.eachAbility i.icon-remove' :
      function(e, ins) {
        var data  = ins.data
          , level = data.level
          ;
        if (confirm('你確定要刪除這筆等級' + level + '的資訊紀錄嗎？')) {
          DB.character_data.remove(data._id, function() {
            updateMSG(data.character, '更新了', level + '級的等級資訊紀錄');
          });
        }
      }
  //修改能力名稱細節
  ,'change input, change textarea' :
      function(e, ins) {
        var data     = ins.data
          , type     = e.currentTarget.name
          , $set     = {}
          ;

        $set[ type ] = e.currentTarget.value;
        DB.character_data.update(data._id, {'$set' : $set}, function() {
          updateMSG(data.character, '更新了', data.level + '級的等級資訊紀錄');
        });
      }
  }
);

//description
Template.character_PF_description.helpers(
  {'descriptionList' :
      function(id) {
        return DB.character_data.find({'character' : id, 'type' : 'description'}, {'sort' : {'sort' : 1}});
      }
  ,'trim'            : trim
  }
)
Template.character_PF_description.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增額外詳述
  ,'click legend a' :
      function(e, ins) {
        var character = ins.data + ''
          , newData   =
            {'character' : character
            ,'type'      : 'description'
            ,'value'     : ''
            }
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的額外詳述標題：');
        if (! newData.name) {
          return false;
        }
        if (DB.character_data.findOne({'character' : character, 'type' : 'description', 'name' : newData.name}) !== undefined) {
          alert('角色已經存在額外詳述「' + newData.name +'」');
          return false;
        }

        DB.character_data.insert(newData, function() {
          updateMSG(character, '新增了', '的額外詳述「' + newData.name + '」');
        });
      }
  ,'click i.icon-remove' :
      function(e, ins) {
        var name      = this.name
          , character = ins.data + ''
          ;

        if (confirm('你確定要刪除角色的「' + name + '」額外詳述嗎？')) {
          DB.character_data.remove(this._id, function() {
            updateMSG(character, '刪除了', '的額外詳述「' + name + '」');
          });
        }
      }
  ,'change textarea' :
      function(e, ins) {
        var name      = this.name
          , character = ins.data + ''
          , $set      = {'value' : e.currentTarget.value}
          ;

        DB.character_data.update(this._id, {'$set' : $set}, function() {
          updateMSG(character, '更新了', '的額外詳述「' + name + '」');
        });
      }
  }
)