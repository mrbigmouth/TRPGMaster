var CharData      = {}
  , CharDep       = new Deps.Dependency()
  , fieldTypeName =
    {'description' : '額外詳述'
    ,'dice'        : '擲骰資料'
    ,'item'        : '物品欄'
    ,'level'       : '等級資訊紀錄'
    ,'name'        : '角色名稱'
    ,'number'      : '角色數值'
    ,'profile'     : '基本訊息'
    ,'spell'       : '法術表'
    }
  , RuleSwtich =
      {'PF'         : 'PF'
      ,'3.5'        : 'PF'
      ,'mrbigmouth' : 'PF'
      }
  , updateMsg   =
    function(type) {
      var msg = fieldTypeName[type] || type;
      DB.message_all.insert(
        {'room'      : CharData.room
        ,'type'      : 'room'
        ,'msg'       : '更新了角色「' + CharData.name + '」的' + msg + '資料。'
        ,'character' : CharData._id
        }
      )
    }

//自動更新角色
Deps.autorun(function () {
  var RouterParams = Session.get('RouterParams') || {}
    , newCharData  = DB.character.findOne(RouterParams.character) || {}
    ;
  CharData = newCharData;
});

Router.map(function () {
  this.route(
    'character'
  , {'path'      : '/character/:room/:character/'
    ,'template'  : 'main_character'
    ,'waitOn'    :
        function() {
          var _this  = this
            , params = this.params
            ;
          return Meteor.subscribe('character', params.character);
        }
    }
  );
});

Template.main_character.helpers(
  {'character'      :
      function() {
        var RouterParams = Session.get('RouterParams');
        return DB.character.findOne(RouterParams.character) || {};
      }
  ,'isRule'          :
      function(data, rule) {
        return (RuleSwtich[ data.rule ] === rule);
      }
  ,'characterRuleSwitch' :
      function() {
        var RouterParams = Session.get('RouterParams')
          , data         = DB.character.findOne(RouterParams.character) || {}
          ;
        
        return Template['main_character_' + (RuleSwtich[ data.rule ] || 'error') ]['render'](data);
        //return UI.render(Template.foo)Template['main_character_' + (RuleSwtich[ data.rule ] || 'error') ]['render'](data);
      }
  }
)

Handlebars.registerHelper('characterRuleSwitch', function (character) {
  switch (RuleSwtich[ character.rule ]) {
  case 'PF':
    return Template.character_profile_PF;
  }
});


Template.main_character_PF.helpers(
  {'title'          :
      function(character) {
        var room = DB.room.findOne(character.room) || {'name' : ''};
        return room.name + '--' + character.name + ' 角色表';
      }
  }
)



  //計算陣列中object value總合之函數
  //計算一物件陣列裡物件之屬性(或use參照值)總合
var sum        =
    function(data) {
      return _.reduce(data
                     ,function(memo, v) {
                        var undefined;
                        if (v.value !== undefined) {
                          return v.value + memo;
                        }
                        if (v.use !== undefined) {
                          return (findNumber(v.use) || 0) + memo;
                        }
                        return memo ;
                      }
                     ,0
                     );
    }
  //尋找並回傳特定name object之函數
  , findName   =
    function(data, name) {
      return _.find(data, function(v){ return v.name === name; });
    }
  //移除並傳回陣列中特定name object之函數
  , removeName =
    function(data, name) {
      return _.reject(data, function(v){ return v.name === name; });
    }
  //定位某name object之index
  , indexName  =
    function(data, name) {
      var index = -1;
      _.some(data, function(v, k) {
        if (v.name === name) {
          index = k;
          return true;
        }
      });
      return index;
    }
  //尋找特定name的角色數值總合
  , findNumber =
    function(name) {
      var result = findName(CharData.number, name);
      if (! result) {
        return 0;
      }
      return sum( result.value );
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
      function(what) {
        return _.reduce(CharData.item
                       ,function(memo, v) {
                          return floatAdd(memo, floatMul(v[what], v.amount));
                        }
                       ,0
                       );
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
  , toggleContent =
      function(e, ins) {
        $(ins.firstNode).find('div.content').toggle();
      }
  ;

Template.character_profile_PF.events(
  //展開收起內容
  {'click legend' : toggleContent
  //新增基本訊息
  ,'click legend a' :
      function(e, ins) {
        var profile = CharData.profile
          , newData = { 'value' : '' }
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的基本訊息名稱：');
        if (! newData.name) {
          return false;
        }
        if (findName(profile, newData.name) !== undefined) {
          alert('角色已經存在基本訊息「' + newData.name +'」');
          return false;
        }
        newData['class'] = window.prompt('請設定輸入格大小(1~9)：');
        if (newData['class']) {
          if (! isNaN(newData['class'])) {
            newData['class'] = 'span' + newData['class'];
          }
        }
        else {
          newData['class'] = '';
        }

        DB.character.update(CharData._id, {'$push' : {'profile' : newData }});
        updateMsg('profile');
      }
  ,'click i.icon-remove' :
      function(e, ins) {
        var profile = CharData.profile
          , name    = $(e.currentTarget).closest('div.eachProfile').attr('data-name')
          ;

        if (confirm('你確定要刪除角色的「' + name + '」基本訊息嗎？')) {
          profile = removeName(profile, name);
          DB.character.update(CharData._id, {'$set' : {'profile' : profile }});
          updateMsg('profile');
        }
      }
  ,'change input' :
      function(e, ins) {
        var profile = CharData.profile
          , name    = e.currentTarget.name
          , value   = e.currentTarget.value
          , index   = indexName(profile, name)
          , $set    = {}
          ;
        if (name === 'name') {
          DB.character.update(CharData._id, {'$set' : {'name' : value} });
        }
        else {
          $set['profile.' + index + '.value'] = value;
          DB.character.update(CharData._id, {'$set' : $set});
        }
        updateMsg('profile');
      }
  }
)

//number
Template.character_number_PF.helpers(
  {'getNumber' : findNumber
  }
)
Template.character_number_PF.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增角色數值
  ,'click legend a' :
      function(e, ins) {
        var number = CharData.number
          , newData = { 'value' : [] }
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的基本訊息名稱：');
        if (! newData.name) {
          return false;
        }
        if (findName(number, newData.name) !== undefined) {
          alert('角色已經存在數值「' + newData.name +'」');
          return false;
        }

        DB.character.update(CharData._id, {'$push' : {'number' : newData }});
        updateMsg('「' + newData.name + '」角色數值');
      }
  //刪除一列數值
  ,'click label > i.icon-remove' :
      function(e, ins) {
        var number  = CharData.number
          , name    = $(e.currentTarget).closest('div.eachNumber').attr('data-name')
          ;

        if (confirm('你確定要刪除角色的「' + name + '」數值嗎？')) {
          number = removeName(number, name);
          DB.character.update(CharData._id, {'$set' : {'number' : number }});
          updateMsg('「' + name + '」角色數值');
        }
      }
  //刪除一列數值中的某個加值
  ,'click div.eachNumber span.add-on > i.icon-remove' :
      function(e, ins) {
        var number   = CharData.number
          , $this    = $(e.currentTarget)
          , sumName  = $this.closest('div.eachNumber').attr('data-name')
          , sumIndex = indexName(number, sumName)
          , name     = $this.closest('div.input-prepend').find('input').attr('name')
          , $set     = {}
          ;
        if (confirm('你確定要刪除「' + sumName + '」角色數值的「' + name + '」加值嗎？')) {
          $set['number.' + sumIndex + '.value'] = removeName(number[sumIndex].value, name);
          DB.character.update(CharData._id, {'$set' : $set});
          updateMsg('「' + sumName + '」角色數值');
        }
      }
  //在一列數值中新增加值
  ,'click div.eachNumber strong' :
      function(e, ins) {
        var number   = CharData.number
          , $this    = $(e.currentTarget).closest('div.eachNumber')
          , sumName  = $this.attr('data-name')
          , sumIndex = indexName(number, sumName)
          , newAdd   = {}
          , $push    = {}
          , undefined
          ;

        newAdd.name = window.prompt('請輸入加值名稱：');
        if (! newAdd.name) {
          return false;
        }
        if (findName(number[sumIndex].value, newAdd.name) !== undefined) {
          alert('此列數值已存在名稱為「' + newAdd.name + '」的加值！');
          return false;
        }
        newAdd.use = window.prompt('請輸入此加值所參照的角色數值名稱\n（或不輸入，手動修改數值）：');
        if (! newAdd.use) {
          delete newAdd.use;
          newAdd.value = 0;
        }
        debugger;
        $push['number.' + sumIndex + '.value'] = newAdd;
        DB.character.update(CharData._id, {'$push' : $push});
        updateMsg('「' + sumName + '」角色數值');
      }
  //修改加值
  ,'change input' :
      function(e, ins) {
        var number   = CharData.number
          , $this    = $(e.currentTarget)
          , sumName  = $this.closest('div.eachNumber').attr('data-name')
          , sumIndex = indexName(number, sumName)
          , name     = e.currentTarget.name
          , index    = indexName(number[sumIndex].value, name)
          , $set     = {}
          ;
        $set['number.' + sumIndex + '.value.' + index + '.value'] = parseInt(e.currentTarget.value, 10);
        DB.character.update(CharData._id, {'$set' : $set});
        updateMsg('「' + sumName + '」角色數值');
      }
  }
)

//dice
Template.character_dice_PF.helpers(
  {'getNumber' : findNumber
  ,'getDice'   :
      function(value) {
        return sum( value );
      }
  }
)
Template.character_dice_PF.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增擲骰資料
  ,'click legend a' :
      function(e, ins) {
        var dice    = CharData.dice
          , newData = { 'value' : [] }
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的擲骰名稱：');
        if (! newData.name) {
          return false;
        }
        if (findName(dice, newData.name) !== undefined) {
          alert('角色已經存在擲骰資料「' + newData.name +'」');
          return false;
        }

        DB.character.update(CharData._id, {'$push' : {'dice' : newData }});
        updateMsg('「' + newData.name + '」擲骰資料');
      }
  //刪除一列擲骰資料
  ,'click label > i.icon-remove' :
      function(e, ins) {
        var dice    = CharData.dice
          , name    = $(e.currentTarget).closest('div.eachDice').attr('data-name')
          ;

        if (confirm('你確定要刪除角色的「' + name + '」擲骰資料嗎？')) {
          dice = removeName(dice, name);
          DB.character.update(CharData._id, {'$set' : {'dice' : dice }});
          updateMsg('「' + name + '」擲骰資料');
        }
      }
  //刪除一列擲骰資料中的某個加值
  ,'click div.eachDice span.add-on > i.icon-remove' :
      function(e, ins) {
        var dice     = CharData.dice
          , $this    = $(e.currentTarget)
          , sumName  = $this.closest('div.eachDice').attr('data-name')
          , sumIndex = indexName(dice, sumName)
          , name     = $this.closest('div.input-prepend').find('input').attr('name')
          , $set     = {}
          ;
        if (confirm('你確定要刪除「' + sumName + '」擲骰資料的「' + name + '」加值嗎？')) {
          $set['dice.' + sumIndex + '.value'] = removeName(dice[sumIndex].value, name);
          DB.character.update(CharData._id, {'$set' : $set});
          updateMsg('「' + sumName + '」擲骰資料');
        }
      }
  //在一列數值中新增加值
  ,'click div.eachDice strong' :
      function(e, ins) {
        var dice     = CharData.dice
          , $this    = $(e.currentTarget).closest('div.eachDice')
          , sumName  = $this.attr('data-name')
          , sumIndex = indexName(dice, sumName)
          , newAdd   = {}
          , $push    = {}
          , undefined
          ;

        newAdd.name = window.prompt('請輸入加值名稱：');
        if (! newAdd.name) {
          return false;
        }
        if (findName(dice[sumIndex].value, newAdd.name) !== undefined) {
          alert('此列擲骰中已存在名稱為「' + newAdd.name + '」的加值！');
          return false;
        }
        newAdd.use = window.prompt('請輸入此加值所參照的角色數值名稱\n（或不輸入，手動修改數值）：');
        if (! newAdd.use) {
          delete newAdd.use;
          newAdd.value = 0;
        }

        $push['dice.' + sumIndex + '.value'] = newAdd;
        DB.character.update(CharData._id, {'$push' : $push});
        updateMsg('「' + sumName + '」擲骰資料');
      }
  //修改加值
  ,'change input' :
      function(e, ins) {
        var dice     = CharData.dice
          , $this    = $(e.currentTarget)
          , sumName  = $this.closest('div.eachDice').attr('data-name')
          , sumIndex = indexName(dice, sumName)
          , name     = e.currentTarget.name
          , index    = indexName(dice[sumIndex].value, name)
          , $set     = {}
          ;
        $set['dice.' + sumIndex + '.value.' + index + '.value'] = parseInt(e.currentTarget.value, 10);
        DB.character.update(CharData._id, {'$set' : $set});
        updateMsg('「' + sumName + '」擲骰資料');
      }
  }
)

//item
Template.character_item_PF.helpers(
  //總負重
  {'getDetail'   :
      function(data) {
        return data.detail;
      }
  ,'totalWeight' :
      function() {
        return sumItem('weight');
      }
  //總財富
  ,'totalWorth'  :
      function() {
        return sumItem('worth');
      }
  }
)
Template.character_item_PF.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增物品
  ,'click legend a' :
      function(e, ins) {
        var newData
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData =
            {'name'   : ''
            ,'detail' : ''
            ,'amount' : 1
            ,'weight' : 0
            ,'worth'  : 0
            }
        DB.character.update(CharData._id, {'$push' : {'item' : newData }});
        updateMsg('item');
      }
  //展開收起細節
  ,'click i.icon-plus, click i.icon-th-list' :
      function(e, ins) {
        $(e.currentTarget).closest('div.eachItem').find('div.detail').toggle();
      }
  ,'click i.icon-remove' :
      function(e, ins) {
        var item     = CharData.item
          , $this    = $(e.currentTarget).closest('div.eachItem')
          , name     = $this.find('input.name').val()
          , $content = $this.closest('div.content')
          , index    = $content.find('i.icon-remove').index(e.currentTarget)
          ;

        if (confirm('你確定要刪除角色的物品「' + name + '」嗎？')) {
          item.splice(index, 1);
          DB.character.update(CharData._id, {'$set' : {'item' : item }});
          updateMsg('item');
        }
      }
  ,'change input, change textarea' :
      function(e, ins) {
        var item     = CharData.item
          , name     = e.currentTarget.name
          , value    = e.currentTarget.value
          , $this    = $(e.currentTarget).closest('div.eachItem')
          , $content = $this.closest('div.content')
          , index    = $content.find('div.eachItem').index($this)
          , $set     = {}
          ;
        switch (name) {
        case 'amount' :
        case 'weight' :
        case 'worth'  :
          value = parseFloat(value);
          break;
        }
        $set['item.' + index + '.' + name] = value;
        DB.character.update(CharData._id, {'$set' : $set});
        updateMsg('item');
      }
  }
)

//spell
Template.character_spell_PF.helpers(
  {'showValue'   :
      function(value) {
        return value ? value : '';
      }
  }
)
Template.character_spell_PF.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增法術體系
  ,'click legend a' :
      function(e, ins) {
        var spell   = CharData.spell
          , newData = { 'circle' : [] }
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的法術體系名稱：');
        if (! newData.name) {
          return false;
        }
        if (findName(spell, newData.name) !== undefined) {
          alert('角色已經法術體系「' + newData.name +'」');
          return false;
        }
        DB.character.update(CharData._id, {'$push' : {'spell' : newData }});
        updateMsg('spell');
      }
  //移除法術體系
  ,'click i.icon-remove.spell' :
      function(e, ins) {
        var spell   = CharData.spell
          , name    = $(e.currentTarget).closest('div.eachSpell').attr('data-name')
          ;

        if (confirm('你確定要刪除角色的「' + name + '」法術體系嗎？')) {
          spell = removeName(spell, name);
          DB.character.update(CharData._id, {'$set' : {'spell' : spell }});
          updateMsg('spell');
        }
      }
  //新增法術等級
  ,'click h4 a' :
      function(e, ins) {
        var $this    = $(e.currentTarget).closest('div.eachSpell')
          , $content = $this.closest('div.content')
          , index    = $content.find('div.eachSpell').index($this)
          , $push    = {}
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        $push['spell.' + index + '.circle'] = {'known' : [], 'slot' : []};
        DB.character.update(CharData._id, {'$push' : $push});
      }
  //新增已知法術
  ,'click p.known i.icon-plus' :
      function(e, ins) {
        var $circle     = $(e.currentTarget).closest('div.eachCircle')
          , $spell      = $circle.closest('div.eachSpell')
          , $content    = $spell.closest('div.content')
          , spellIndex  = $content.find('div.eachSpell').index($spell)
          , circleIndex = $spell.find('div.eachCircle').index($circle)
          , $push       = {}
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        $push['spell.' + spellIndex + '.circle.' + circleIndex + '.known'] = {'name' : '', 'detail' : ''};
        DB.character.update(CharData._id, {'$push' : $push});
      }
  //編輯已知法術
  ,'change p.known input' :
      function(e, ins) {
        var value       = e.currentTarget.value
          , spell       = CharData.spell
          , $known      = $(e.currentTarget).closest('div')
          , $circle     = $known.closest('div.eachCircle')
          , $spell      = $circle.closest('div.eachSpell')
          , $content    = $spell.closest('div.content')
          , spellIndex  = $content.find('div.eachSpell').index($spell)
          , circleIndex = $spell.find('div.eachCircle').index($circle)
          , knownIndex  = $circle.find('p.known > div').index($known)
          , $set        = {}
          ;

        $set['spell.' + spellIndex + '.circle.' + circleIndex + '.known.' + knownIndex] = value;
        DB.character.update(CharData._id, {'$set' : $set});
      }
  //移除已知法術
  ,'click p.known i.icon-remove' :
      function(e, ins) {
        var value       = e.currentTarget.value
          , spell       = CharData.spell
          , $known      = $(e.currentTarget).closest('div')
          , $circle     = $known.closest('div.eachCircle')
          , $spell      = $circle.closest('div.eachSpell')
          , $content    = $spell.closest('div.content')
          , spellIndex  = $content.find('div.eachSpell').index($spell)
          , circleIndex = $spell.find('div.eachCircle').index($circle)
          , knownIndex  = $circle.find('p.known > div').index($known)
          , $set        = {}
          , data
          ;

        data = spell[spellIndex];
        if (data) {
          data = data.circle;
          if (data) {
            data = data[circleIndex];
            if (data) {
              data = data.known;
              if (data) {
                data.splice(knownIndex, 1);
                $set['spell.' + spellIndex + '.circle.' + circleIndex + '.known'] = data;
                DB.character.update(CharData._id, {'$set' : $set});
              }
            }
          }
        }
        $set['spell.' + spellIndex + '.circle.' + circleIndex + '.known.' + knownIndex] = value;
        DB.character.update(ins.data._id, {'$set' : $set});
      }
  //新增法術格
  ,'click p.slot i.icon-plus' :
      function(e, ins) {
        var $circle     = $(e.currentTarget).closest('div.eachCircle')
          , $spell      = $circle.closest('div.eachSpell')
          , $content    = $spell.closest('div.content')
          , spellIndex  = $content.find('div.eachSpell').index($spell)
          , circleIndex = $spell.find('div.eachCircle').index($circle)
          , $push       = {}
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        $push['spell.' + spellIndex + '.circle.' + circleIndex + '.slot'] = {'name' : '', 'used' : false} ;
        DB.character.update(CharData._id, {'$push' : $push});
      }
  //編輯法術格
  ,'change p.slot input' :
      function(e, ins) {
        var value       = e.currentTarget.value
          , spell       = CharData.spell
          , $slot       = $(e.currentTarget).closest('div')
          , $circle     = $slot.closest('div.eachCircle')
          , $spell      = $circle.closest('div.eachSpell')
          , $content    = $spell.closest('div.content')
          , spellIndex  = $content.find('div.eachSpell').index($spell)
          , circleIndex = $spell.find('div.eachCircle').index($circle)
          , slotIndex   = $circle.find('p.slot > div').index($slot)
          , $set        = {}
          ;

        $set['spell.' + spellIndex + '.circle.' + circleIndex + '.slot.' + slotIndex + '.name'] = value;
        DB.character.update(CharData._id, {'$set' : $set});
      }
  //移除法術格
  ,'click p.slot i.icon-remove' :
      function(e, ins) {
        var spell       = CharData.spell
          , $slot       = $(e.currentTarget).closest('div')
          , $circle     = $slot.closest('div.eachCircle')
          , $spell      = $circle.closest('div.eachSpell')
          , $content    = $spell.closest('div.content')
          , spellIndex  = $content.find('div.eachSpell').index($spell)
          , circleIndex = $spell.find('div.eachCircle').index($circle)
          , slotIndex   = $circle.find('p.slot > div').index($slot)
          , $set        = {}
          , data
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        data = spell[spellIndex];
        if (data) {
          data = data.circle;
          if (data) {
            data = data[circleIndex];
            if (data) {
              data = data.slot;
              data.splice(slotIndex, 1);
              $set['spell.' + spellIndex + '.circle.' + circleIndex + '.slot'] = data;
              DB.character.update(CharData._id, {'$set' : $set});
            }
          }
        }
      }
  //標示為已使用/未使用
  ,'click p.slot i.icon-ok' :
      function(e, ins) {
        var spell       = CharData.spell
          , $slot       = $(e.currentTarget).closest('div')
          , $circle     = $slot.closest('div.eachCircle')
          , $spell      = $circle.closest('div.eachSpell')
          , $content    = $spell.closest('div.content')
          , spellIndex  = $content.find('div.eachSpell').index($spell)
          , circleIndex = $spell.find('div.eachCircle').index($circle)
          , slotIndex   = $circle.find('p.slot > div').index($slot)
          , $set        = {}
          , data
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        data = spell[spellIndex];
        if (data) {
          data = data.circle;
          if (data) {
            data = data[circleIndex];
            if (data) {
              data = data['slot'];
              if (data) {
                data = data[slotIndex];
                if (data) {
                  data = ! data.used;
                  $set['spell.' + spellIndex + '.circle.' + circleIndex + '.slot.' + slotIndex + '.used'] = data;
                  DB.character.update(CharData._id, {'$set' : $set});
                }
              }
            }
          }
        }
      }
  }
)
Template.character_spell_PF.rendered =
    function() {
      if (! this.firstNode) {
        return true;
      }
      $(this.findAll('div.eachSpell')).each(function() {
        $(this).find('strong').each(function(i) {
          $(this).text( intToBig(i) );
        });
      });
    }

//level
Template.character_level_PF.events(
  //展開收起內容
  {'click legend'       : toggleContent
  //新增升級紀錄
  ,'click legend a.add' :
      function(e, ins) {
        //防止繼續往上觸發click
        e.stopPropagation();

        DB.character.update(CharData._id, {'$push' : {'level' : [] }});
        updateMsg('level');
      }
  //降級
  ,'click legend a.del' :
      function(e, ins) {
        //防止繼續往上觸發click
        e.stopPropagation();
        DB.character.update(CharData._id, {'$pop' : {'level' : 1 }});
        updateMsg('level');
      }
  //在一筆等級資料中新增能力資訊
  ,'click div.eachLevel a.addAbility' :
      function(e, ins) {
        var $this    = $(e.currentTarget).closest('div.eachLevel')
          , $content = $this.closest('div.content')
          , index    = $content.find('div.eachLevel').index($this)
          , $push    = {}
          , data     = { 'name' : '', 'detail' : ''}
          ;
        $push['level.' + index] = data;
        DB.character.update(CharData._id, {'$push' : $push});
        updateMsg('level');
      }
  //展開能力細節
  ,'click div.eachAbility i.icon-plus, click div.eachAbility i.icon-th-list' :
      function(e) {
        $(e.currentTarget).closest('div.eachAbility').find('textarea').toggle();
      }
  //刪除能力
  ,'click div.eachAbility i.icon-remove' :
      function(e, ins) {
        var $this    = $(e.currentTarget).closest('div.eachAbility')
          , value    = e.currentTarget.value
          , $level   = $this.closest('div.eachLevel')
          , aIndex   = $level.find('div.eachAbility').index($this)
          , $content = $level.closest('div.content')
          , lIndex   = $content.find('div.eachLevel').index($level)
          , $set     = {}
          , data     = CharData.level[lIndex];
          ;
        data.splice(aIndex, 1);
        $set['level.' + lIndex] = data;
        DB.character.update(CharData._id, {'$set' : $set});
        updateMsg('level');
      }
  //修改能力名稱
  ,'change input' :
      function(e, ins) {
        var $this    = $(e.currentTarget).closest('div.eachAbility')
          , value    = e.currentTarget.value
          , $level   = $this.closest('div.eachLevel')
          , aIndex   = $level.find('div.eachAbility').index($this)
          , $content = $level.closest('div.content')
          , lIndex   = $content.find('div.eachLevel').index($level)
          , $set     = {}
          ;
        $set['level.' + lIndex + '.' + aIndex + '.name'] = value;
        DB.character.update(CharData._id, {'$set' : $set});
        updateMsg('level');
      }
  //修改能力細節
  ,'change textarea' :
      function(e, ins) {
        var $this    = $(e.currentTarget).closest('div.eachAbility')
          , value    = e.currentTarget.value
          , $level   = $this.closest('div.eachLevel')
          , aIndex   = $level.find('div.eachAbility').index($this)
          , $content = $level.closest('div.content')
          , lIndex   = $content.find('div.eachLevel').index($level)
          , $set     = {}
          ;
        $set['level.' + lIndex + '.' + aIndex + '.detail'] = value;
        DB.character.update(CharData._id, {'$set' : $set});
        updateMsg('level');
      }
  }
);
Template.character_level_PF.rendered =
    function() {
      if (! this.firstNode) {
        return true;
      }
      _.each(this.findAll('div.eachLevel strong'), function(v, i) {
        $(v).text('ＬＶ' + intToBig(i));
      });
    }

//description
Template.character_description_PF.events(
  //展開收起內容
  {'click legend'   : toggleContent
  //新增額外詳述
  ,'click legend a' :
      function(e, ins) {
        var description = ins.data.description
          , newData     = { 'value' : '' }
          , undefined
          ;
        //防止繼續往上觸發click
        e.stopPropagation();

        newData.name = window.prompt('請輸入要新增的額外詳述標題：');
        if (! newData.name) {
          return false;
        }
        if (findName(description, newData.name) !== undefined) {
          alert('角色已經存在額外詳述「' + newData.name +'」');
          return false;
        }

        DB.character.update(CharData._id, {'$push' : {'description' : newData }});
        updateMsg('description');
      }
  ,'click i.icon-remove' :
      function(e, ins) {
        var description = CharData.description
          , name        = $(e.currentTarget).closest('div.eachDescription').attr('data-name')
          ;

        if (confirm('你確定要刪除角色的「' + name + '」額外詳述嗎？')) {
          description = removeName(description, name);
          DB.character.update(CharData._id, {'$set' : {'description' : description }});
          updateMsg('description');
        }
      }
  ,'change textarea' :
      function(e, ins) {
        var name        = e.currentTarget.name
          , value       = e.currentTarget.value
          , index       = indexName(description, name)
          , $set        = {}
          ;
        $set['description.' + index + '.value'] = value;
        DB.character.update(CharData._id, {'$set' : $set});
        updateMsg('description');
      }
  }
)

//正常角色表轉化後初始計算與綁定事件
var NormalRendered =
    function() {
      var data   = this.data
        , number = data.number
        , $field = $('#character').find('fieldset')
        ;
      $field.on('click', 'legend', function() {
        $(this).next('div.content').toggle();
      });
      $field.filter('.number,.dice').find('div.eachNumber,div.eachDice')
        //移除一個tag
        .on('click', 'i.icon-remove', function() {
          var $this   = $(this).closest('div')
            , $number = $this.closest('div.eachDice,div.eachNumber')
            , $input
            , $other
            , $sum
            ;
          
          //icon-remove位於prepend或append內，代表只刪除此input
          if ($this.hasClass('input-prepend') || $this.hasClass('input-append')) {
            $this.add($this.next('strong')).remove();
            //如果刪除的是dice或number值
            if ($number.length) {
              $input  = $number.find('input');
              $other  = $input.not('.sum').not($this);
              $sum    = $input.filter('.sum');
              //若刪除此input後無其他加值欄位
              if ($other.length < 1) {
                //使sum input歸0並觸發change事件
                $sum.val(0).trigger('change');
              }
              //若刪除此input後有其他加值欄位
              else {
                //觸發最後一個input，使此列重計算
                $other.last().tirgger('change');
              }
            }
          }
          //一次刪除一列時
          else {
            //如果刪除的是dice或number值
            if ($number.length) {
              //觸發依賴事件
              $this.find('input.sum').val(0).trigger('change');
            }
            $this.remove();
          }
        })
        //input數值變動時自動加總、自動修改所依賴格子
        .on('change', 'input', function() {
          var $this = $(this)
            , value
            , useIt
            , $inputs
            , sum
            ;
          //若變動之input為sum
          if ($this.hasClass('sum')) {
            value = $this.val();
            useIt = $this.data('useIt');
            //修改依賴此格之資料
            if (useIt) {
              _.each(useIt, function($user) {
                $user.val(value).trigger('change');
              });
            }
          }
          //否則重新計算此列之sum
          else {
            $inputs = $this.closest('div.eachDice,div.eachNumber').find('input');
            sum = 0
            $inputs.not('.sum').each(function() {
              sum += parseInt($(this).val(), 10);
            });
            $inputs.filter('.sum').val(sum).trigger('change');
          }
        })
        //填入初始值與宣告依賴資料
        .each(function() {
          var $this    = $(this)
            , thisName = $this.attr('data-name')
            , thisData
            ;
          if ($this.hasClass('eachNumber')) {
            thisData =  find(data.number, thisName);
          }
          else {
            thisData =  find(data.dice, thisName);
          }
          
          //填入初始值
          $this
          .find('input').each(function() {
            var $this = $(this)
              , name  = $this.attr('name')
              , thisAdd
              , $use
              , useIt
              ;
            //填入總值
            if ($this.hasClass('sum')) {
              $this.attr('value', sum(thisData.value) );
            }
            else {
              thisAdd = find(thisData.value , name);
              //若此格數值是參照另一格的數值
              if (thisAdd.use) {
                $this.attr('value', sum( find(number, thisAdd.use).value ) );
                //增加被參照格子的已依賴資料
                $use = $field.filter('.number').find('div.eachNumber').filter('[data-name="' + thisAdd.use + '"]').find('input.sum');
                useIt = $use.data('useIt');
                if (! useIt) {
                  $use.data('useIt', [ $this ]);
                }
                else {
                  useIt.push( $this );
                }
              }
              else {
                $this.attr('value', thisAdd.value );
              }
            }
          });
        });
    }
