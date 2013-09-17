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

//mapEditform
var $form        = $($.parseHTML('<div />'))
  , callEditForm =
      function(ids) {
        var editing = Session.get('map_editing');
        editing = _.isArray(editing) ? ( editing.concat(ids) ) : ids;
        Session.set('map_editing', _.uniq(editing) );
        $form.modal('show');
      }
  ;

Template.map_editForm.rendered =
    function() {
      //只執行一次
      if (this.firstNode && ! this.inited) {
        $form = $('#map_editForm').modal({'show' : false});
        this.inited = true;
      }
    }
Template.map_editForm.helpers(
  {'editing' :
      function() {
        var editing = Session.get('map_editing') || [];
        return DB.map_detail.find({'_id' : {'$in' : editing} });
      }
  }
)


//map_info
Template.map_info.helpers(
  {'isAdm'        : TOOL.userIsAdm
  ,'prevRound'    :
      function() {
        if (! Session.get('map')) {
          return false;
        }
        return Session.get('map').prev;
      }
  ,'nowRound'     :
      function() {
        if (! Session.get('map')) {
          return 0;
        }
        return Session.get('map').round;
      }
  ,'nextRound'    :
      function() {
        var round;
        if (! Session.get('map')) {
          return false;
        }
        return Session.get('map').next;
      }
  ,'hasAffect'    :
      function() {
        if (! Session.get('map')) {
          return false;
        }
        return (DB.map_detail.find(
                  {'map'   : Session.get('map')._id
                  ,'type'  : 'affect'
                  ,'round' :
                      {'$lte' : Session.get('map').round
                      }
                  }
                ).count() > 0);
      }
  ,'allAffect'    :
      function() {
        return DB.map_detail.find(
          {'map'   : Session.get('map')._id
          ,'type'  : 'affect'
          ,'until' :
              {'$lte' : Session.get('map').round
              }
          }
        , {'sort' :
            {'sort'  : 1}
          }
        );
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

        var $this = $(e.currentTarget)
          , ids   = []
          , data
          ;

        switch ($this.attr('data-fn')) {
        case 'add':
          data =
            {'map'   : Session.get('map')._id
            ,'round' : Session.get('map').round
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
        if (Session.get('map')) {
          return true;
        }
        else {
          return false;
        }
      }
  ,'sizeX'    :
      function() {
        return _.range(1, Session.get('map').sizeX + 1);
      }
  ,'sizeY'    :
      function() {
        return _.range(1, Session.get('map').sizeY + 1);
      }
  ,'GridsRow' :
      function(sizeY) {
        var sizeX = Session.get('map').sizeX
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