//chapter template
Template.main_document.helpers(
  {'rootDocument' :
      function() {
        var room = Session.get('room');
        if (room) {
          return DB.document.find({'room' : room._id, 'parent': null}, {'sort' : {'sort' : 1}});
        }
      }
  ,'isAdm'        : TOOL.userIsAdm
  }
);
Template.main_document.events(
  {'click i.icon-plus-sign' :
      function(e, ins) {
        var data    = {}
          , $parent = $(e.currentTarget).closest('li.eachDocument')
          ;
        e.stopImmediatePropagation();
        data.room = Session.get('room')._id;
        data.name = window.prompt('請輸入資料標題');
        if (! data.name) {
          return false;
        }
        data.detail = '<p>尚未輸入資料。</p>';
        data.user = Meteor.userId();
        if ($parent.length) {
          data.parent = $(e.currentTarget).closest('li.eachDocument').attr('data-id');
          data.sort = DB.document.find({'parent': data.parent}).count();
        }
        else {
          data.parent = null;
          data.sort = DB.document.find({'room' : data.room, 'parent': null}).count();
        }
        DB.document.insert(data);
      }
  }
)
Template.main_document.rendered =
    function() {
      var hash = Session.get('hash');
      if (hash) {
        location.hash = Session.get('hash');
        Session.set('hash');
      }
    }

//nav
Template.main_document_nav.created =
    function() {
      this.opened = true;
    }
Template.main_document_nav.rendered =
    function() {
      if (this.firstNode && this.opened === false) {
        var $this = $(this.firstNode);
        $this
          .find('ul:first')
            .hide()
            .end()
          .find('i:first')
            .removeClass('icon-folder-open')
            .addClass('icon-folder-close');
      }
    }
Template.main_document_nav.helpers(
  {'hasChildren' :
      function() {
        if (DB.document.find({ 'parent' : this._id }).count() > 0) {
          return true;
        }
        else {
          return false;
        }
      }
  ,'children'    :
      function() {
        return DB.document.find({ 'parent' : this._id }, {'sort' : {'sort' : 1}});
      }
  ,'isAdm'       : TOOL.userIsAdm
  }
)
Template.main_document_nav.events(
  {'click i.icon-folder-close, click i.icon-folder-open' :
      function(e, ins) {
        e.stopImmediatePropagation();
        if (ins.opened) {
          $(e.currentTarget)
            .removeClass('icon-folder-open')
            .addClass('icon-folder-close')
            .closest('li.eachDocument')
              .find('ul:first')
                .hide();
          ins.opened = false;
        }
        else {
          $(e.currentTarget)
            .removeClass('icon-folder-close')
            .addClass('icon-folder-open')
            .closest('li.eachDocument')
              .find('ul:first')
                .show();
          ins.opened = true;
        }
      }
  }
)

//detail
Template.main_document_detail.helpers(
  {'children'    :
      function() {
        return DB.document.find({ 'parent' : this._id }, {'sort' : {'sort' : 1}});
      }
  ,'timeChinese' : TOOL.convertTimeToChinese
  ,'getNick'     : TOOL.getUserNick
  ,'isAdm'       : TOOL.userIsAdm
  }
)
Template.main_document_detail.events(
  {'click i.icon-pencil' :
      function(e, ins) {
        var id   = ins.firstNode.id
          , name = window.prompt('請輸入資料標題')
          ;
        e.stopImmediatePropagation();
        if (name) {
          DB.document.update(id, {$set : {'name' : name}});
        }
      }
  ,'click i.icon-trash' :
      function(e, ins) {
        var id     = ins.firstNode.id
          , data   = DB.document.findOne(id)
          , parent = data.parent || null
          , sort   = data.sort
          ;
        e.stopImmediatePropagation();
        if (window.confirm('確定刪除此筆資料?')) {
          DB.document.remove(id);
          DB.document.find({'parent' : id}).forEach(function(doc) {
            DB.document.update(doc._id, { $set: { 'parent': parent } });
          });
          DB.document.find({'parent' : parent, 'sort' : {$gt : sort}}).forEach(function(doc) {
            DB.document.update(doc._id, {$inc : {'sort' : -1}});
          });
        }
      }
  ,'click i.icon-arrow-up, click i.icon-arrow-down' :
      function(e, ins) {
        var id   = ins.firstNode.id
          , data = DB.document.findOne(id)
          , sort = data.sort
          , temp
          ;
        e.stopImmediatePropagation();
        if ($(e.currentTarget).hasClass('icon-arrow-up')) {
          if (sort === 0) {
            return false;
          }
          sort -= 1;
          if (temp = DB.document.findOne({'room' : data.room, 'parent' : data.parent, 'sort' : sort})) {
            DB.document.update(temp._id, {$inc : {'sort' : 1}});
          }
        }
        else {
          sort += 1;
          if (temp = DB.document.findOne({'room' : data.room, 'parent' : data.parent, 'sort' : sort})) {
            DB.document.update(temp._id, {$inc : {'sort' : -1}});
          }
        }
        DB.document.update(id, {$set : {'sort' : sort}});
      }
  //編輯
  ,'click div.detail' :
      function(e, ins) {
        e.stopImmediatePropagation();
        var $this = $(ins.firstNode);
        if ($this.hasClass('editing')) {
          return false;
        }
        else {
          $this
            .addClass('editing')
            .find('div.detail')
              .prop('contenteditable', true)
              .trigger('focus');
        }
      }
  //取消編輯
  ,'click button.btn-cancel' :
      function(e, ins) {
        e.stopImmediatePropagation();
        var id = ins.firstNode.id;
        DB.document.update(id, {$set : {'temp' : ''}});
        DB.document.update(id, {$unset : {'temp' : ''}});
      }
  //送出編輯成果
  ,'click button.btn-primary' :
      function(e, ins) {
        e.stopImmediatePropagation();
        var id     = ins.firstNode.id
          , detail = $(ins.firstNode).find('div.detail').html()
          ;
        DB.document.update(id, {$set : {'detail' : detail}})
      }
  }
)