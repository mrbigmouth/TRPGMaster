var hasher =
    function() {
      return _.toArray(arguments).join(',');
    }

MAP =
  {'marginLeft'  : 10
  ,'marginTop'   : 10
  ,'gridWidth'   : 32
  ,'gridHeight'  : 32
  ,'fontSize'    : 16
  ,'getLeftByX'  :
      _.memoize(function(x) {
        return x * MAP.gridWidth;
      })
  ,'getTopByY'  :
      _.memoize(function(y) {
        return y * MAP.gridHeight;
      })
  ,'centerText' :
      _.memoize(
        function(x, y) {
          x = x + MAP.gridWidth / 2;
          y = y + MAP.gridHeight - (MAP.gridHeight - MAP.fontSize) / 2;
          return [x, y];
        }
      , hasher
      )
  }