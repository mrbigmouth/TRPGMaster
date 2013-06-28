//chapter template
Template.main_chapter.helpers(
  {'isLoading'  :
      function() {
        return ! Session.get('chapter');
      }
  ,'title'      :
      function() {
        var room    = Session.get('room')
          , chapter = Session.get('chapter')
          ;
        return room.name + '--' + chapter.name;
      }
  ,'allSection' :
      function() {
        var room    = Session.get('room')._id
          , chapter = Session.get('chapter')._id
          ;
        return DB.record.find({'room' : room, 'chapter' : chapter, 'section' : {'$exists' : false} });
      }
  }
);
Template.main_chapter.events(
  {'click ul.breadcrumb a.addSection' :
      function(e, ins) {
        var room    = Session.get('room')._id
          , chapter = Session.get('chapter')._id
          , sort    = DB.record.find({'room' : room, 'chapter' : chapter, 'section' : {'$exists' : false} }).count()
          ;
        DB.record.insert(
          {'room'    : room
          ,'chapter' : chapter
          ,'name'    : '第' + (sort + 1) + '節'
          ,'sort'    : sort
          }
        );
      }
  }
)
Template.main_chapter.rendered =
    function() {
      var hash  = Session.get('hash');
      if (hash && $(hash).length > 0) {
        _.delay(function() { location.hash = hash }, 50);
        Session.set('hash');
      }
    }


//section template
Template.chapter_section.helpers(
  {'allParagraph' :
      function() {
        var room    = this.room
          , chapter = this.chapter
          , section = this._id
          , cursor  = DB.record.find({'room' : room, 'chapter' : chapter, 'section' : section })
          , count   = cursor.count()
          , result
          ;

        if (! SCRIBE.paragraph[ section ] || ! SCRIBE.paragraph[ section ].ready()) {
          return [];
        }
        //無段落時自動新增
        if (count < 1) {
          DB.record.insert(
            {'room'    : room
            ,'chapter' : chapter
            ,'section' : section
            ,'sort'    : 0
            }
          , _.identity
          )
        }
        return _.sortBy(cursor.fetch(), function(v) { return v.sort; });
      }
  ,'mapLink'       :
      function() {
        var map = DB.map.findOne({'section' : this._id});
        if (map) {
          return '/map/' + this.room + '/' + map._id + '/';
        }
        else {
          return '';
        }
      }
  ,'emptyParagraph':
      function() {
        return {};
      }
  ,'isAdm'         : TOOL.userIsAdm
  ,'isPlayer'      : TOOL.userIsPlayer
  }
);
Template.chapter_section.events(
  //展開收起此章節
  {'click header' :
      function(e, ins) {
        var room     = Session.get('room')._id
          , chapter  = Session.get('chapter')._id
          , $section = $(ins.firstNode)
          , section  = ins.firstNode.id
          ;
        if (ins.opened) {
          if ($section.find('article.editing').length > 0) {
            return false;
          }
          $section.children('div.content').hide();
          ins.opened = false;
        }
        else {
          if (! SCRIBE.paragraph[ section ]) {
            SCRIBE.paragraph[ section ] = Meteor.subscribe('paragraph', room, chapter, section);
          }
          $section.children('div.content').show();
          ins.opened = true;
        }
      }
  //編輯章節標題
  ,'click header i.icon-pencil' :
      function(e, ins) {
        var section = ins.firstNode.id
          , title   = window.prompt('請輸入新標題：')
          ;
        e.stopPropagation();
        if (title) {
          DB.record.update(section, {'$set' : {'name' : title} });
        }
      }
  //場外發言
  ,'click aside a.outside' :
      function(e, ins) {
        var section = ins.firstNode.id
          , insData = ins.data
          , msg
          ;
        e.stopPropagation();
        msg = window.prompt('請輸入場外發言：');
        if (msg) {
          DB.message_all.insert(
            {'user'    : Meteor.userId()
            ,'room'    : insData.room
            ,'chapter' : insData.chapter
            ,'section' : section
            ,'type'    : 'outside'
            ,'msg'     : msg
            }
          );
        }
      }
  //新增地圖
  ,'click aside a.map' :
      function(e, ins) {
        var $link   = $(e.currentTarget);

        if ($link.attr('href')) {
          e.stopImmediatePropagation();
          return true;
        }
        else {
          e.preventDefault();
        }
        var section = DB.record.findOne(ins.firstNode.id)
          , maps    = DB.map.find({'chapter' : section.chapter}).fetch()
          ;

        //若不存在地圖且為點擊者為ADM，嘗試開新地圖
        if (TOOL.userIsAdm() && window.confirm('你確定要為章節「' + section.name + '」編修戰場地圖？')) {
          var msgs  =
                _.chain(maps)
                .pluck('name')
                .map(function(name, i) {
                      return (i + 1) + ')' + name;
                    })
                .value()
            , choice
            , data
            ;
          
          msgs.unshift('請選擇繼承地圖或開新地圖：', '0)不繼承舊地圖，開新地圖');
          msgs = msgs.join('\r\n');
          choice = window.prompt(msgs, 0);
          if (choice !== null && ! isNaN(choice)) {
            choice = parseInt(choice, 10) - 1;
            if (choice !== 0 && (data = maps[ choice ])) {
              Meteor.apply('ExtendMap', [ data._id ], function(err, mapID) {
                if (err) {
                  console.log(err);
                }
                else {
                  var href = '/map/' + section.room + '/' + mapID + '/';
                  $link.attr('href', href);
                  window.open(href, 'map');
                }
              });
            }
            else {
              Meteor.apply(
                'ExtendMap'
              , [ null
                , section._id
                ]
              , function(err, mapID) {
                  if (err) {
                    console.log(err);
                  }
                  else {
                    var href = '/map/' + section.room + '/' + mapID + '/';
                    $link.attr('href', href);
                    window.open(href, 'map');
                  }
                }
              );
            }
          }
        }
        else {
          alert('本章節目前無地圖！');
        }
      }
  //新增段落
  ,'click aside a.addParagraph' :
      function(e, ins) {
        var room    = Session.get('room')._id
          , chapter = Session.get('chapter')._id
          , section = ins.firstNode.id
          , sort    = DB.record.find({'room' : room, 'chapter' : chapter, 'section' : section }).count()
          ;

        DB.record.insert(
          {'room'    : room
          ,'chapter' : chapter
          ,'section' : section
          ,'sort'    : sort
          ,'content' : ''
          }
        );
      }
  }
)

//判斷是否自動展開
Template.chapter_section.created =
    function () {
      var data    = this.data
        ;
      //若已訂閱此章節
      if (SCRIBE.paragraph[ data._id ]) {
        this.opened = true;
      }
      //三天內有更新者自動進行訂閱
      else if (Date.now() - data.time <= 259200000) {
        this.opened = true;
        if (! SCRIBE.paragraph[ data._id ]) {
          SCRIBE.paragraph[ data._id ] =
            Meteor
              .subscribe( 'paragraph'
                        , data.room
                        , data.chapter
                        , data._id
                        );
        }
      }
    }
//自動展開
Template.chapter_section.rendered =
    function () {
      var id       = this.data._id
        , $section = $(this.firstNode)
        ;
      //已訂閱之section自動展開
      if (this.opened) {
        $section.children('div.content').show();
      }
    }


//paragraph template
Template.chapter_section_paragraph.helpers(
  {'timeChinese' : TOOL.convertTimeToChinese
  ,'getNick'     : TOOL.getUserNick
  }
)
Template.chapter_section_paragraph.events(
  //focus時
  {'click article' :
      function(e, ins) {
        var $this = $(ins.firstNode);
        if ($this.hasClass('focus')) {
          return false;
        }
        $this
          .addClass('focus');
      }
  //blur時
  ,'click article header a.blur' :
      function(e, ins) {
        e.stopPropagation();
        var $this = $(ins.firstNode);
        if (! $this.hasClass('focus')) {
          return false;
        }
        $this
          .removeClass('focus')
          .find('header,footer')
            .hide();
      }
  //編輯段落
  ,'click article header a.edit' :
      function(e, ins) {
        e.stopPropagation();
        $(ins.firstNode)
          .addClass('editing')
          .find('div.paragraph')
            .prop('contenteditable', true)
            .trigger('focus');
      }
  //新增段落
  ,'click article header a.addBefore, click article header a.addAfter' :
      function(e, ins) {
        e.stopPropagation();
        var userID  = Meteor.userId()
          , $this   = $(e.currentTarget).closest('article')
          , $all    = $this.parent().children('article')
          , sort    = $all.index($this)
          , insData = ins.data
          , room    = insData.room
          , chapter = insData.chapter
          , section = insData.section || insData._id
          , newData =
              {'user'    : userID
              ,'room'    : room
              ,'chapter' : chapter
              ,'section' : section
              }
          , undefined
          ;
        if ($(e.currentTarget).hasClass('addAfter')) {
          sort += 1;
        }
        $all.slice(sort).each(function() {
          DB.record.update($(this).attr('data-id'), {'$inc' : {'sort' : 1} });
        });
        newData.sort = sort;
        DB.record.insert(newData);
      }
  //取消修改
  ,'click article header a.cancel' :
      function(e, ins) {
        e.stopPropagation();
        var $this = $(ins.firstNode);
        if (! $this.hasClass('editing')) {
          return false;
        }
        $this
          .removeClass('editing')
          .find('div.paragraph')
            .prop('contenteditable', false);
      }
  //送出修改
  ,'click article header a.submit' :
      function(e, ins) {
        e.stopPropagation();
        var userID  = Meteor.userId()
          , $this   = $(e.currentTarget).closest('article')
          , insData = ins.data
          , room    = insData.room
          , chapter = insData.chapter
          , section = insData.section || insData._id
          , newData =
              {'user'    : userID
              ,'room'    : room
              ,'chapter' : chapter
              ,'section' : section
              }
          , content = []
          , sort    = 0
          , inc
          , undefined
          ;
        $(ins.firstNode).find('div.paragraph').find('p').each(function() {
          content.push($(this).html());
        });
        sort = $this.prevAll('article').length;
        //如果是編修已存在的段落
        if (insData._id !== undefined) {
          newData.content = content.shift();
          //更新第一段內容
          DB.record.update(insData._id, {'$set' : newData});
          //sort排序+1
          sort += 1;
        }
        //若不只送出一段
        if (content.length) {
          inc = content.length;
          //將後方的所有段落sort += 新增的段落數量
          $this.nextAll('article').each(function(i) {
            var id = $(this).attr('data-id');
            DB.record.update(id, {'$set' : {'sort' : inc + sort} });
          });
          //依序新增
          _.each(content, function(d, k) {
            newData.sort = sort + k;
            newData.content = d;
            DB.record.insert(newData);
          });
        }
        //更新紀錄
        DB.message_all.insert(
          {'user'    : userID
          ,'room'    : room
          ,'chapter' : chapter
          ,'section' : section
          ,'type'    : 'room'
          ,'msg'     : '更新了遊戲紀錄。'
          }
        )
      }
  }
)
//自動編輯新增段落
Template.chapter_section_paragraph.rendered =
    function() {
      var undefined;
      if (this.data.content === undefined) {
        $(this.firstNode).addClass('focus editing')
          .find('div.paragraph')
            .prop('contenteditable', true)
            .trigger('focus');
      }
    }

//outside template
Template.chapter_section_outside.helpers(
  {'allOutside'  :
      function() {
        return DB.message_recent.find({'section' : this._id, 'type' : {'$in' : ['outside', 'dice']}},{'sort' : {'_id' : 1}});
      }
  ,'timeChinese' : TOOL.convertTimeToChinese
  ,'getNick'     : TOOL.getUserNick
  ,'typeOutside' :
      function() {
        return (this.type === 'outside');
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