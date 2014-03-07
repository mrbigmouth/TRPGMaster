Router.map(function () {
  this.route(
    'map'
  , {'path'      : '/room/:room/:chapter/map/:mapID/'
    ,'template'  : 'main_map'
    ,'yieldTemplates'   :
      {'map_message' : {'to' : 'south'}
      ,'map_info'    : {'to' : 'west'}
      }
    ,'waitOn'    :
        function() {
          var params = this.params;
          return [
            Meteor.subscribe('map', params.room, params.mapID)
          ]
        }
    ,'after'     :
        function() {
          //新增round資訊至params
          var params = _.extend({}, this.params)
            , map
            , undefined
            ;
          if (params.hash === undefined) {
            map = DB.map.find(params.mapID, {'fields' : {'round' : 1}}).fetch();
            map = map[0] || {};
            params.hash = map.round || '1';
            Session.set('RouterParams', params);
          }

          //防拖曳
          $(window).off('selectstart').on('selectstart', function(event) { event.preventDefault(); });

          //css rule init
          $.rule('#map svg text', 'style').remove();
          $.rule('#map svg text {font-size:' + MAP.fontSize + 'px;}').appendTo('style');
        }
    }
  );
});

//map message
Template.map_message.helpers(
  {'allMsgs'     :
      function () {
        var params     = Session.get('RouterParams')
          , room       = params.room
          , cursor     = DB.message_all.find({'room' : room, 'type' : {'$in' : ['chat', 'outside', 'dice']} }, {'sort' : {'time' : 1} })
          , scrollDown =
              _.debounce(
                function() {
                  var $message = $('#map_message');
                  $message.scrollTop( $message.prop('scrollHeight') );
                }
              , 100)
          ;
        cursor.observeChanges(
          {'added' :
              function(id, fields) {
                var layout   = $('body').data('layout')
                  , $message = $('#map_message')
                  ;
                //有新訊息時打開訊息列
                if (layout && typeof layout.open === 'function') {
                  layout.open('south');
                }
                scrollDown();
              }
          }
        );
        return cursor;
      }
  //時間中文化
  ,'timeChinese' : TOOL.convertTimeToChinese
  //使用者id轉暱稱
  ,'getNick'     : TOOL.getUserNick
  //房間id轉暱稱
  ,'roomName'    :
      function(room) {
        room = DB.room.findOne({'_id' : room});
        return room ? room.name : '';
      }
  //訊息類別轉中文
  ,'typeChinese' :
      function(type) {
        return TRPG.options.messageType[ type ];
      }
  ,'typeChat'    :
      function() {
        return (this.type === 'chat') || (this.type === 'outside');
      }
  ,'typeDice'    :
      function() {
        return (this.type === 'dice');
      }
  ,'diceResult'  :
      function() {
        var record  = this.result
          , number  = record.length
          , face    = this.face
          , add     = this.add
          , addSign = ((add >= 0) ? '+ ' : '')
          , sum     = 0
          , result
          ;
        if (this.addEach) {
          result = '[1d' + face + addSign + add + '] x ' + number + '結果分別為 ';
          result += 
              (_.map(record, function(v) {
                var total = v + add;
                sum += total;
                return v + '(' + ( total ) + ')';
              })).join(',');
          result += ' 總合為 ' + sum + ' 。';
        }
        else {
          result = number + 'd' + face + addSign + add + '結果為 ';
          result += record.join(',');
          result += ' 總合為'
          result += _.reduce(record, function(memo, v) { return memo + v;}, add);
          result += ' 。';
        }
        return result;
      }
  }
)

//main_map
Template.main_map.helpers(
  {'mapData' :
      function() {
        var params  = Session.get('RouterParams')
          , mapData =
              DB.map.find(
                params.mapID
              , {'fields' :
                  {'sizeX' : 1
                  ,'sizeY' : 1
                  }
                }
              )
              .fetch()
          ;
        if (mapData.length) {
          mapData = mapData[0];
        }
        else {
          mapData = {};
        }
        return mapData;
      }
  }
)

//mapEditform
var $form        = $('#map_editForm')
  , EditDeps     = new Deps.Dependency()
  , EditData     = []
  , callEditForm =
      function(ids) {
        EditData = _.uniq(EditData.concat(ids));
        EditDeps.changed();
        $form.modal('show');
      }
  ;

Template.map_editForm.rendered =
    function() {
      $form = $('#map_editForm').modal({'show' : false});
    }
Template.map_editForm.helpers(
  {'editing' :
      function() {
        var result;
        EditDeps.depend();

        result = _.map(EditData, function(data) {
          if (typeof data === 'string') {
            return DB.map_detail.findOne(data);
          }
          return data;
        });
        return _.compact(result);
      }
  ,'isType'  :
      function(isType, detailType) {
        return (isType === detailType);
      }
  }
)
Template.map_editForm.events(
  //儲存修改
  {'click i.icon-ok' :
      function() {
        console.log(this);
      }
  //刪除資料　
  ,'click i.icon-trash' :
      function(e, ins) {
        console.log(this);
      }
  //取消修改
  ,'click i.icon-ban-circle' :
      function(e, ins) {
        console.log(this);
      }
  }
)

//svg
Session.setDefault('mapScale', 1);
Template.map_svg.helpers(
  {'totalWidth' :
      function() {
        var scale = Session.get('mapScale')
          , sizeX = this.sizeX + 2
          ;
        return ((sizeX * MAP.gridWidth) * scale + MAP.marginLeft) + '';
      }
  ,'totalHeight' :
      function() {
        var scale = Session.get('mapScale')
          , sizeY = this.sizeY + 2
          ;
        return ((sizeY * MAP.gridHeight) * scale + MAP.marginTop) + '';
      }
  ,'marginLeft'  :
      function() {
        return MAP.marginLeft;
      }
  ,'marginTop'   :
      function() {
        return MAP.marginTop;
      }
  ,'transform'   :
      function() {
        var scale = Session.get('mapScale');
        return 'scale(' + scale + ')';
      }
  ,'gridLabel'   :
      function() {
        var sizeX  = this.sizeX
          , sizeY  = this.sizeY
          , result = []
          , textPos
          , posX
          , posY
          , x
          , y
          ;

        for (x = 1; x <= sizeX; x += 1) {
          posX = MAP.getLeftByX(x);
          textPos = MAP.centerText(posX, 0);
          result.push(
            {'text'     : x
            ,'textLeft' : textPos[0]
            ,'textTop'  : textPos[1]
            ,'left'     : posX
            ,'top'      : 0
            ,'width'    : MAP.gridWidth
            ,'height'   : MAP.gridHeight
            }
          );
          posY = MAP.getTopByY(sizeX + 1);
          textPos = MAP.centerText(posX, posY);
          result.push(
            {'text'     : x
            ,'textLeft' : textPos[0]
            ,'textTop'  : textPos[1]
            ,'left'     : posX
            ,'top'      : posY
            ,'width'    : MAP.gridWidth
            ,'height'   : MAP.gridHeight
            }
          );
        }
        for (y = 1; y <= sizeY; y += 1) {
          posY = MAP.getTopByY(y);
          textPos = MAP.centerText(0, posY);
          result.push(
            {'text'     : y
            ,'textLeft' : textPos[0]
            ,'textTop'  : textPos[1]
            ,'left'     : 0
            ,'top'      : posY
            ,'width'    : MAP.gridWidth
            ,'height'   : MAP.gridHeight
            }
          );
          posX = MAP.getLeftByX(sizeX + 1);
          textPos = MAP.centerText(posX, posY);
          result.push(
            {'text'     : y
            ,'textLeft' : textPos[0]
            ,'textTop'  : textPos[1]
            ,'left'     : MAP.getLeftByX(sizeX + 1)
            ,'top'      : posY
            ,'width'    : MAP.gridWidth
            ,'height'   : MAP.gridHeight
            }
          );
        }
        return result;
      }
  ,'textStyle'   :
      function() {
        var fontSize = MAP.fontSize;
        return 'font-size:' + fontSize + 'px;';
      }
  }
)
Template.map_svg.events(
  {'click svg' :
      function(e) {
        Session.set('mapScale', (Session.get('mapScale') * 10 + 1) / 10);
      }
  }
)


Template.map_info.helpers(
  {'prevRound' :
      function() {
        var params = Session.get('RouterParams')
          , round  = parseInt(params.hash, 10)
          ;
        if (round <= 1) {
          return false;
        }
        return '#' + (round - 1);
      }
  ,'nextRound' :
      function() {
        var params = Session.get('RouterParams')
          , round  = parseInt(params.hash, 10)
          ;
        if (! location.hash) {
          return false;
        }
        return '#' + (round + 1);
      }
  ,'nowRound'  :
      function() {
        return Session.get('RouterParams').hash;
      }
  ,'isAdm'     : TOOL.userIsAdm
  ,'hasDetail' :
      function(type) {
        var params = Session.get('RouterParams')
          , map    = params.mapID
          , round  = parseInt(params.hash, 10)
          ;
        return (DB.map_detail
                  .find(
                    {'type'  : type
                    ,'map'   : map
                    ,'round' : round
                    }
                  )
                  .fetch()
                  .length
                > 0)
      }
  ,'allDetail' :
      function(type) {
        var params = Session.get('RouterParams')
          , map    = params.mapID
          , round  = parseInt(params.hash, 10)
          ;
        return  DB.map_detail
                  .find(
                    {'type'  : type
                    ,'map'   : map
                    ,'round' : round
                    }
                  );
      }
  }
)
Template.map_info.events(
  //跳到指定輪
  {'click a.go' :
      function(e) {
        var params   = Session.get('RouterParams')
          , map      = DB.map.findOne(params.map)
          , maxRound = map.round
          , go       = window.prompt('跳到第幾輪？(1~' + maxRound + ')', now)
          , result   = parseInt(go, 10)
          ;
        if (result != go || result < 1 || result > maxRound) {
          alert('輸入格式不正確！');
          return false;
        }
        location.href = '#' + result;
        return true;
      }
  //推進下一輪
  ,'click a.newRound' : $.noop
  //展開細節　
  ,'click header' :
      function(e) {
        $(e.currentTarget).closest('section').children('div.content').slideToggle('fast');
      }
  //改變縮放尺寸
  ,'change input.zoom' :
      function(e) {
        var value    = e.currentTarget.value
          , oldValue = Session.get('mapScale')
          ;

        if (parseInt(value, 10) != value) {
          alert('縮放尺寸必須為整數！');
          e.currentTarget.value = oldValue * 100;
          return false;
        }
        Session.set('mapScale', value / 100);
      }
  //新增
  ,'click header a' :
      function(e) {
        var $this  = $(e.currentTarget)
          , type   = $this.attr('data-type')
          , params = Session.get('RouterParams')
          , map    = DB.map.findOne(params.mapID)
          , ids    = []
          , data
          ;
        e.stopPropagation();

        switch ($this.attr('data-fn')) {
        case 'add':
          data =
            {'_id'   : ''
            ,'map'   : map._id
            ,'round' : map.round
            ,'type'  : $this.attr('data-type')
            }
          switch ($this.attr('data-type')) {
          case 'affect':
            data.name   = '未命名效應';
            data.until  = data.round;
            data.desc   = '';
            data.hide   = '';
            data.affect = [];
            break;
          case 'land':
            data.name  = '未命名地型';
            data.show  = 'land';
            data.color = '#FFFFFF';
            data.desc  = '';
            data.hide  = '';
            data.light = 0;
            data.shadow = 0;
            data.minusView = 0;
            data.isHideTo = [];
            break;
          case 'unit':
            data.name = '未命名單位';
            data.token = '？';
            data.desc  = '';
            data.hide  = '';
            data.character = false;
            data.maxhp = 10;
            data.hp = 10;
            data.light = 0;
            data.shadow = 0;
            data.minusView = 0;
            data.sightNormal = 20;
            data.sightLowLight = 0;
            data.sightDark = 0;
            data.sightBlind = 0;
            data.hiddenTo = [];
            data.isPublicView = false;
            break;
          }
          ids.push(data);
          callEditForm(ids);
          break;
        case 'editAll':
          $this.closest('section').find('section[data-id]').each(function() {
            ids.push( $(this).attr('data-id') );
          });
          callEditForm(ids);
          break;
        case 'edit':
          $this.closest('section').find('div.content:visible').each(function() {
            var id = $(this).parent().attr('data-id');
            if (id) {
              ids.push(id);
            }
          });
          callEditForm(ids);
          break;
        }
      }
  }
)

/*
//map_wrapper
Template.map_wrapper.events(
  //捲軸移動時同步修改顯示座標區塊位置
  {'scroll #map_wrapper' :
      function(e) {
        var $map = $(e.currentTarget)
          , left = $map.scrollLeft()
          , top  = $map.scrollTop()
          ;
        $('#point_pos')
          .css(
            {'left' : left + 'px'
            ,'top'  : top + 'px'
            }
          )
      }
  }
)

//map_info
Template.map_info.helpers(
  ,'hasAffect'    :
      function() {
        AffectData = 
          _.chain(DetailData)
            .filter(function(data) { return data.type === 'affect'; })
            .sortBy(function(data) { return data.sort; })
            .value();
        return (AffectData.length > 0);
      }
  ,'allAffect'    :
      function() {
        return AffectData;
      }
  }
)
Template.map_info.events(
  {'click header' :
      function(e) {
        $(e.currentTarget).closest('section').children('div.content').slideToggle('fast');
      }
  ,'click header a' :
      function(e) {
        e.stopPropagation();

        var $this        = $(e.currentTarget)
          , ids          = []
          , data
          ;

        switch ($this.attr('data-fn')) {
        case 'add':
          data =
            {'map'   : MapData._id
            ,'round' : MapData.round
            }
          switch ($this.attr('data-type')) {
          case 'affect':
            data.type   = 'affect';
            data.name   = '未命名效應';
            data.until  = data.round;
            data.desc   = '';
            data.hide   = '';
            data.affect = [];
            break;
          case 'land':
            data.type  = 'land';
            data.name  = '未命名地型';
            data.show  = 'land';
            data.color = '#FFFFFF';
            data.desc  = '';
            data.hide  = '';
            data.light = 0;
            data.shadow = 0;
            data.minusView = 0;
            data.isHideTo = [];
            break;
          case 'unit':
            data.type = 'unit';
            data.name = '未命名單位';
            data.token = '？';
            data.desc  = '';
            data.hide  = '';
            data.character = false;
            data.maxhp = 10;
            data.hp = 10;
            data.light = 0;
            data.shadow = 0;
            data.minusView = 0;
            data.sightNormal = 20;
            data.sightLowLight = 0;
            data.sightDark = 0;
            data.sightBlind = 0;
            data.hiddenTo = [];
            data.isPublicView = false;
            break;
          }
          Meteor.call('getTime', function(err, now) {
            data._id = (now + '');
            DB.map_detail.insert(data);
            callEditForm([ data._id ]);
          });
          break;
        case 'editAll':
          $this.closest('section').find('section[data-id]').each(function() {
            ids.push( $(this).attr('data-id') );
          });
          callEditForm(ids);
          break;
        case 'edit':
          $this.closest('section').find('div.content:visible').each(function() {
            var id = $(this).parent().attr('data-id');
            if (id) {
              ids.push(id);
            }
          });
          callEditForm(ids);
          break;
        }
      }
  //view
  ,'change input.grid_size' :
      function(e) {
        var size = e.currentTarget.value;
        $.rule('#map_table th,#map td', 'style').css({'min-width' : size + 'px', 'height' : size + 'px'});
      }
  ,'change input.unit_size' :
      function(e) {
        var size = e.currentTarget.value;
        $.rule('#map_table th, #map_table td', 'style').css('font-size', size + 'px');
        $.rule('#map_table td img', 'style').css({'width' : size + 'px', 'height' : size + 'px;'});
      }
  }
)
Template.map_info.rendered =
    function() {
      //只執行一次
      if (this.firstNode && ! this.inited) {
        var form = document.getElementById('map_info')
          , grid = form.grid_size
          , unit = form.unit_size
          , gridSize
          , unitSize
          ;

        //只執行一次
        this.inited = true;
        if (STORE('map_gridSize')) {
          gridSize = STORE('map_gridSize');
          grid.value = gridSize;
        }
        else {
          gridSize = '30';
          STORE('map_gridSize', gridSize);
          grid.value = gridSize;
        }
        if (STORE('map_unitSize')) {
          unitSize = STORE('map_unitSize');
          unit.value = unitSize;
        }
        else {
          unitSize = '22';
          STORE('map_unitSize', unitSize);
          unit.value = unitSize;
        }

        $.rule('#map_table th,#map td {min-width:' + gridSize +'px;height:' + gridSize +'px;}').appendTo('style');
        $.rule('#map_table th, #map_table td {font-size:' + unitSize + 'px;}').appendTo('style');
        $.rule('#map_table td img {width:' + unitSize + 'px;height:' + unitSize + 'px;}').appendTo('style');
      }
    }

//map_table
var makeGridsRow =
    _.memoize(
      function(x, y) {
        var result = []
          , i
          ;

        for (i = 1; i <= x; i += 1) {
          result.push(
            {'x' : i
            ,'y' : y
            }
          );
        }
        return result;
      }
    , MAP.hashFn
    )
Template.map_table.helpers(
  {'loaded'   :
      function() {
        var RouterParams = Session.get('RouterParams')
          , map          = DB.map.findOne(RouterParams.map)
          ;
        if (map) {
          MapData = map;
          return true;
        }
        else {
          return false;
        }
      }
  ,'sizeX'    :
      function() {
        return _.range(1, MapData.sizeX + 1);
      }
  ,'sizeY'    :
      function() {
        return _.range(1, MapData.sizeY + 1);
      }
  ,'GridsRow' :
      function(sizeY) {
        var sizeX = MapData.sizeX
          , i
          , result
          ;

        return makeGridsRow(sizeX, sizeY);
      }
  }
);
Template.map_table.events(
  //顯示座標
  {'mouseenter td' :
      function(e) {
        var $td = $(e.currentTarget);
        e.stopPropagation();

        $('#point_pos')
          .find('span.x')
            .text($td.attr('data-x'))
            .end()
          .find('span.y')
            .text($td.attr('data-y'));
      }
  }
)
*/