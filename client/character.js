var RuleSwtich =
      {'PF'         : 'PF'
      ,'3.5'        : 'PF'
      ,'mrbigmouth' : 'PF'
      }
  ;

Router.map(function () {
  this.route(
    'character'
  , {'path'      : '/character/:room/:character/'
    ,'waitOn'    :
        function() {
          var _this  = this
            , params = this.params
            ;
          return Meteor.subscribe('character', params.character, function() {
            var data =  DB.character.findOne(params.character) || {};
            _this.template = ( 'main_character_' + (RuleSwtich[ data.rule ] || 'error') );
          });
        }
    }
  );
});