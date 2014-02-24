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

/*
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
  }
)
Handlebars.registerHelper('characterRuleSwitch', function (character) {
  switch (RuleSwtich[ character.rule ]) {
  case 'PF':
    return Template.character_profile_PF;
  }
});
*/

