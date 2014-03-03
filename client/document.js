Router.map(function () {
  this.route(
    'document'
  , {'path'      : '/room/:room/doc/'
    ,'template'  : 'main_document'
    ,'before'    :
        function() {
          Meteor.subscribe('documentList', this.params.room);
          Meteor.subscribe('document', this.params.hash);
        }
    }
  );
});

//chapter template
Template.main_document.helpers(
  {'rootDocument' :
      function() {
        var RouterParams = Session.get('RouterParams');
        return DB.document.find(
          {'room'   : RouterParams.room
          ,'parent' : null
          }
        , {'sort'   : {'sort' : 1}
          ,'fields' :
              {'_id'    : 1
              ,'parent' : 1
              ,'name'   : 1
              }
          }
        );
      }
  ,'thisDocument' :
      function() {
        var RouterParams = Session.get('RouterParams');
        return DB.document.findOne(RouterParams.hash);
      }
  ,'isAdm'        : TOOL.userIsAdm
  }
);
Template.main_document.events(
  {'click i.icon-plus-sign' :
      function(e, ins) {
        var RouterParams = Session.get('RouterParams')
          , room         = RouterParams.room
          , parent       = this._id || null
          , data         = {}
          , $parent      = $(e.currentTarget).closest('li.eachDocument')
          ;

        e.preventDefault();
        e.stopImmediatePropagation();
        data.room = room;
        data.name = window.prompt('請輸入資料標題');
        if (! data.name) {
          return false;
        }
        data.detail = '';
        data.parent = parent;
        DB.document.insert(data);
      }
  }
);

//nav
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
        return DB.document.find(
          {'parent' : this._id
          }
        , {'sort'   : {'sort' : 1}
          ,'fields' :
              {'_id'    : 1
              ,'parent' : 1
              ,'name'   : 1
              }
          }
        );
      }
  ,'isAdm'       : TOOL.userIsAdm
  }
)
Template.main_document_nav.events(
  {'click i.icon-folder-close, click i.icon-folder-open' :
      function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var $this = $(e.currentTarget);
        if ($this.hasClass('icon-folder-open')) {
          $this
            .removeClass('icon-folder-open')
            .addClass('icon-folder-close')
            .closest('li.eachDocument')
              .find('ul:first')
                .hide();
        }
        else {
          $this
            .removeClass('icon-folder-close')
            .addClass('icon-folder-open')
            .closest('li.eachDocument')
              .find('ul:first')
                .show();
        }
      }
  }
)

//detail
Template.main_document_detail.helpers(
  {'timeChinese' : TOOL.convertTimeToChinese
  ,'getNick'     : TOOL.getUserNick
  ,'isAdm'       : TOOL.userIsAdm
  }
)
Template.main_document_detail.events(
  //編輯
  {'click i.icon-pencil' :
      function(e, ins) {
        var id      = this._id
          , name    = this.name
          , room    = this.room
          , newName = window.prompt('請輸入新的資料標題', name)
          ;
        e.stopImmediatePropagation();
        if (name !== newName) {
          DB.document.update(id, {$set : {'name' : newName}}, function() {
            DB.message_all.insert(
              {'type'     : 'room'
              ,'room'     : room
              ,'document' : id
              ,'msg'      : '修改資料「' + name + '」為「' + newName + '」。'
              }
            );
          });
        }
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
  //刪除
  ,'click i.icon-trash' :
      function(e, ins) {
        var id     = this._id
          , room   = this.room
          , name   = this.name
          , data   = DB.document.findOne(id)
          , parent = data.parent || null
          , sort   = data.sort
          ;
        e.stopImmediatePropagation();
        if (window.confirm('確定刪除此筆資料?')) {
          DB.document.remove(id, function() {
            DB.document.find({'parent' : id}).forEach(function(doc) {
              DB.document.update(doc._id, { $set: { 'parent': parent } });
            });
            DB.document.find({'parent' : parent, 'sort' : {$gt : sort}}).forEach(function(doc) {
              DB.document.update(doc._id, {$inc : {'sort' : -1}});
            });
            DB.message_all.insert(
              {'type'     : 'room'
              ,'room'     : room
              ,'document' : id
              ,'msg'      : '刪除了資料「' + name + '」。'
              }
            );
          });
        }
      }
  //調整順序
  ,'click i.icon-arrow-up, click i.icon-arrow-down' :
      function(e, ins) {
        var id   = this._id
          , sort = this.sort
          , temp
          ;
        e.stopImmediatePropagation();
        if ($(e.currentTarget).hasClass('icon-arrow-up')) {
          if (sort === 0) {
            return false;
          }
          sort -= 1;
          if (temp = DB.document.findOne({'room' : this.room, 'parent' : this.parent, 'sort' : sort})) {
            DB.document.update(temp._id, {$inc : {'sort' : 1}});
          }
        }
        else {
          sort += 1;
          if (temp = DB.document.findOne({'room' : this.room, 'parent' : this.parent, 'sort' : sort})) {
            DB.document.update(temp._id, {$inc : {'sort' : -1}});
          }
        }
        DB.document.update(id, {$set : {'sort' : sort}});
      }
  //取消編輯
  ,'click button.btn-cancel' :
      function(e, ins) {
        $(ins.firstNode)
          .removeClass('editing')
          .find('div.detail')
            .prop('contenteditable', false);
      }
  //送出編輯成果
  ,'click button.btn-primary' :
      function(e, ins) {
        e.stopImmediatePropagation();
        var id     = this._id
          , name   = this.name
          , room   = this.room
          , detail = $(ins.firstNode).find('div.detail').html()
          ;
        DB.document.update(id, {$set : {'detail' : detail}}, function() {
            DB.message_all.insert(
              {'type'     : 'room'
              ,'room'     : room
              ,'document' : id
              ,'msg'      : '修改了資料「' + name + '」。'
              }
            );
        });
        $(ins.firstNode)
          .removeClass('editing')
          .find('div.detail')
            .prop('contenteditable', false);
      }
  }
)