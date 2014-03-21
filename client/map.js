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
          , Meteor.subscribe('characterList', params.room)
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
        if (EditData.length < 1) {
          $form.modal('hide');
          return [];
        }
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
      function(e, ins) {
        var data    = this
          , $this   = $(e.currentTarget).closest('div.eachEdit')
          , index   = $this.closest('div.modal-body').children('div.eachEdit').index($this)
          , newData =
              {'map'   : data.map
              ,'round' : data.round
              ,'type'  : data.type
              }
          ;
        if (data._id) {
          $this.find('[name]').each(function() {
            var val  = $(this).val()
              , name = this.name
              ;
            if (data[ name ] != val) {
              newData[ name ] = val;
            }
          });
          DB.map_detail.update(data._id, {'$set' : newData}, function() {
            EditData.splice(index, 1);
            EditDeps.changed();
          });          
        }
        else {
          $this.find('[name]').each(function() {
            newData[ this.name ] = $(this).val();
          });
          debugger;
          DB.map_detail.insert(newData, function() {
            EditData.splice(index, 1);
            EditDeps.changed();
          });
        }
      }
  //刪除資料　
  ,'click i.icon-trash' :
      function(e, ins) {
        var data  = this
          , $this = $(e.currentTarget).closest('div.eachEdit')
          , index = $this.closest('div.modal-body').children('div.eachEdit').index($this)
          ;
        if (confirm('確定要刪除此項資料?')) {
          if (data._id) {
            DB.map_detail.remove(data._id);
          }
          EditData.splice(index, 1);
          EditDeps.changed();
        }
      }
  //取消修改
  ,'click i.icon-ban-circle' :
      function(e, ins) {
        var data  = this
          , $this = $(e.currentTarget).closest('div.eachEdit')
          , index = $this.closest('div.modal-body').children('div.eachEdit').index($this)
          ;
        EditData.splice(index, 1);
        EditDeps.changed();
      }
  }
)
Template.map_edit_affect.helpers(
  {'units' :
      function() {
        var map      = this.map
          , round    = this.round
          , selected = this.unit
          ;
        return _.map(DB.map_detail
                      .find(
                        {'map'   : this.map
                        ,'round' : this.round
                        ,'type'  : 'unit'
                        }
                      , {'fields' :
                            {'_id'   : 1
                            ,'name'  : 1
                            }
                        }
                      )
                      .fetch()
                    , function(unit) {
                        return {
                         '_id'      : unit._id
                        ,'name'     : unit.name
                        ,'selected' : (_.indexOf(selected, unit._id) !== -1)
                        }
                      }
                    );
      }
  }
)
Template.map_edit_land.helpers(
  {'showList' :
      function() {
        return [
          {'value'    : 'land'
          ,'name'     : '方格底色'
          ,'selected' : (this.show === 'land')
          }
        , {'value'    : 'mist'
          ,'name'     : '半透明遮蓋'
          ,'selected' : (this.show === 'mist')
          }
        , {'value'    : 'wall'
          ,'name'     : '方格色邊'
          ,'selected' : (this.show === 'wall')
          }
        ]
      }
  }
)
Template.map_edit_land.rendered =
    function() {
      $(this.find('input.color')).minicolors();
    }
Template.map_edit_unit.helpers(
  {'allCharacter' :
      function() {
        var params   = Session.get('RouterParams')
          , selected = this.character
          ;
        return _.map(DB.character
                      .find(
                        {'room' : params.room
                        }
                      , {'fields' :
                            {'_id'   : 1
                            ,'name'  : 1
                            }
                        }
                      )
                      .fetch()
                    , function(character) {
                        return {
                         '_id'      : character._id
                        ,'name'     : character.name
                        ,'selected' : (character._id === selected)
                        }
                      }
                    );
      }
  }
)

//svg
Session.setDefault('mapScale', 1);
Template.map_svg.helpers(
  {'totalWidth'  :
      function() {
        var scale = Session.get('mapScale')
          , sizeX = this.sizeX + 2
          ;
        return (((sizeX + 1) * MAP.gridWidth) * scale + MAP.marginLeft) + '';
      }
  ,'totalHeight' :
      function() {
        var scale = Session.get('mapScale')
          , sizeY = this.sizeY + 2
          ;
        return (((sizeY + 1) * MAP.gridHeight) * scale + MAP.marginTop) + '';
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
  ,'grids'       :
      function() {
        var params = Session.get('RouterParams')
          , map    = params.mapID
          , round  = parseInt(params.hash, 10)
          , sizeX  = this.sizeX
          , sizeY  = this.sizeY
          , result = []
          , x
          , y
          , gridData
          , grid
          , color
          ;

        for (x = 1; x <= sizeX; x += 1) {
          for (y = 1; y <= sizeY; y += 1) {
            gridData = DB.map_grid.findOne({'map' : map, 'round' : round, 'x' : x, 'y' : y}) || {};
            grid =
              {'left'   : MAP.getLeftByX(x)
              ,'top'    : MAP.getTopByY(y)
              ,'width'  : MAP.gridWidth
              ,'height' : MAP.gridHeight
              ,'fill'   : false
              ,'mist'   : []
              ,'unit'   : []
              ,'wall'   : []
              }

            _.each(gridData.land, function(land) {
              var landData = DB.map_detail.findOne(land) || {}
                , detail
                ;
              switch (landData.show) {
              case 'land' :
                grid.fill = landData.color;
                break;
              case 'mist' :
                grid.mist.push(
                  {'style'  : 'fill:' + landData.color + ';'
                  ,'left'   : grid.left + 1
                  ,'top'    : grid.top + 1
                  ,'width'  : grid.width - 2
                  ,'height' : grid.height - 2
                  }
                );
                break;
              case 'wall' :
                detail = gridData[ landData._id ] || {};
                grid.wall =
                  _.map(detail.direction, function(direction) {
                    switch (direction) {
                    case 'n' :
                      return {
                        'x1'    : grid.left
                      , 'y1'    : grid.top
                      , 'x2'    : grid.left + MAP.gridWidth
                      , 'y2'    : grid.top
                      , 'style' : 'stroke:' + landData.color + ';'
                      };
                    case 'e' :
                      return {
                        'x1'    : grid.left + MAP.gridWidth
                      , 'y1'    : grid.top
                      , 'x2'    : grid.left + MAP.gridWidth
                      , 'y2'    : grid.top + MAP.gridHeight
                      , 'style' : 'stroke:' + landData.color + ';'
                      };
                    case 'w' :
                      return {
                        'x1'    : grid.left
                      , 'y1'    : grid.top
                      , 'x2'    : grid.left
                      , 'y2'    : grid.top + MAP.gridHeight
                      , 'style' : 'stroke:' + landData.color + ';'
                      };
                      break;
                    case 's' :
                      return {
                        'x1'    : grid.left
                      , 'y1'    : grid.top + MAP.gridHeight
                      , 'x2'    : grid.left + MAP.gridWidth
                      , 'y2'    : grid.top + MAP.gridHeight
                      , 'style' : 'stroke:' + landData.color + ';'
                      };
                      break;
                    }
                  });
                break;
              }
            });
            grid.style = '';
            if (grid.fill) {
              grid.style += 'fill:' + grid.fill + ';';
            }

            result.push(grid);
          }
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
  {
  }
)


Template.map_info.helpers(
  {'mapName'   :
      function() {
        var params  = Session.get('RouterParams')
          , map     = DB.map.find(params.mapID, {'fields' : {'name' : 1} }).fetch()[0]
          , mapName = map ? map.name : ''
          ;
        return mapName;
      }
  ,'prevRound' :
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
  //新增與選取編輯
  ,'click header a' :
      function(e) {
        var $this  = $(e.currentTarget)
          , type   = $this.attr('data-type')
          , params = Session.get('RouterParams')
          , ids    = []
          , data
          ;
        e.stopPropagation();

        switch ($this.attr('data-fn')) {
        case 'add':
          data =
            {'_id'   : ''
            ,'map'   : params.mapID
            ,'round' : params.hash
            ,'type'  : $this.attr('data-type')
            }
          switch ($this.attr('data-type')) {
          case 'affect':
            data.name     = '未命名效應';
            data.until    = 0;
            data.showDesc = '';
            data.hideDesc = '';
            data.unit     = [];
            break;
          case 'land':
            data.name  = '未命名地型';
            data.show  = 'land';
            data.color = '#FFFFFF';
            data.showDesc  = '';
            data.hideDesc  = '';
            data.light = 0;
            data.shadow = 0;
            data.minusView = 0;
            data.isHideTo = [];
            break;
          case 'unit':
            data.name = '未命名單位';
            data.token = '？';
            data.showDesc = '';
            data.hideDesc = '';
            data.character = '';
            data.maxHp = 10;
            data.hp = 10;
            data.light = 0;
            data.shadow = 0;
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
  //雙擊編輯
  ,'dblclick section header' :
      function(e) {
        if (TOOL.userIsAdm()) {
          callEditForm( [ $(e.currentTarget).closest('section').attr('data-id') ] );
        }
      }
  //修改地圖資訊
  ,'change div.mapEdit input[name]' :
      function(e, ins) {
        var map   = ins.data
          , $set  = {}
          , input = e.currentTarget
          ;
        $set[ input.name ] = input.value;
        DB.map.update(map._id, {'$set' : $set });
      }
  }
)
Template.map_info_affect.helpers(
  {'untilRound' :
      function(until) {
        if (until <= 0) {
          return '無';
        }
        else {
          return until;
        }
      }
  }
)
Template.map_info_land.helpers(
  {'landStyle' :
      function() {
        var land  = this
          , style = ''
          ;
        switch (land.show) {
        case 'mist' :
          style = 'background:' + land.color + ';opacity: 0.5;';
          break;
        case 'wall' :
          style = 'border: 1px solid ' + land.color + ';';
          break;
        case 'land' :
        default     : 
          style = 'background:' + land.color + ';';
          break;
        }
        return style;
      }
  }
)
Template.map_info_unit.helpers(
  {'hpStyle' :
      function(hp, maxHp) {
        var width = hp * 100 / maxHp
          , color   = '#00FF00'
          ;
        if (width <= 50) {
          if (width <= 20) {
            color = '#FF0000';
          }
          else {
            color = '#FFFF00';
          }
        }
        return 'width:' + width +'%;background:' + color + ';';
      }
  }
)
Template.map_info_edit.helpers(
  {'mapData' :
      function() {
        return DB.map.findOne( Session.get('RouterParams').mapID );
      }
  }
)
Template.map_info_edit.events(
  {'change input' :
      function() {
        
      }
  }
)