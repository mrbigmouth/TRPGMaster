Template.form_auto_complete.created =
  function() {
    this.inputValue = new ReactiveVar("");
  };
Template.form_auto_complete.events(
  {"keyup input" :
      function(e, ins) {
        ins.inputValue.set( e.currentTarget.value );
      }
  //typeahead click
  ,"click .input-group .typeahead li" :
    function(e, ins) {
      var $emiter = $(e.currentTarget);
      $emiter
        .closest(".input-group")
        .find(".typeahead")
          .hide()
          .end()
        .find("input:first")
          .val( $emiter.text() );
      ins.data.onSelect( $emiter.attr("data-id"), ins);
    }
  //action
  ,"click [data-action]" :
    function(e, ins) {
      ins.data.actions[ $(e.currentTarget).attr("data-action") ].call(this, e, ins);
    }
  }
);
