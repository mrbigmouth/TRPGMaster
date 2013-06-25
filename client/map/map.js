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

Template.map_info.events(
  {'click header' :
      function(e) {
        $(e.currentTarget).closest('section').children('div.content').slideToggle();
      }
  }
)
Template.map_info.rendered =
    function() {
      if (this.firstNode && ! this.inited) {
        var gridSize, unitSize;
        this.inited = true;
        if (STORE('map_gridView')) {

        }
        else {

        }
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