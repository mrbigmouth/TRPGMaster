//chapter template
Template.main_chapter.helpers(
  {'isLoading'  :
      function() {
        var RouterParams = Session.get('RouterParams');
        return ! DB.record.findOne(RouterParams.chapter);
      }
  ,'title'      :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room)
          , chapter      = DB.record.findOne(RouterParams.chapter)
          ;
        return room.name + '--' + chapter.name;
      }
  ,'allSection' :
      function() {
        var RouterParams = Session.get('RouterParams');
        return DB.record.find({'room' : RouterParams.room, 'chapter' : RouterParams.chapter, 'section' : {'$exists' : false} });
      }
  }
);
Template.main_chapter.events(
  {'click ul.breadcrumb a.addSection' :
      function(e, ins) {
        var RouterParams = Session.get('RouterParams')
          , room         = RouterParams.room
          , chapter      = RouterParams.chapter
          , sort         = DB.record.find({'room' : room, 'chapter' : chapter, 'section' : {'$exists' : false} }).count()
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
//紀錄上次觀看時間
LastViewTime = 0;
//紀錄觀看時間
Template.main_chapter.created =
    function() {
      var RouterParams = Session.get('RouterParams')
        , viewTime     = STORE('recordViewTime') || {}
        , chapter      = RouterParams.chapter
        , thisViewTime = viewTime[ chapter ] || [0 , 0]
        ;
      //紀錄上次觀看時間
      LastViewTime = thisViewTime[1] = thisViewTime[0];
      //紀錄這次觀看時間
      thisViewTime[0] = Date.now();
      viewTime[ chapter ] = thisViewTime;
      STORE('recordViewTime', viewTime);
    }
//依據hash傳送到指定節
var toHash = _.debounce(function(hash) { location.hash = hash; }, 500);
Template.main_chapter.rendered =
    function() {
      var RouterParams = Session.get('RouterParams')
        , section      = RouterParams.section
        , hash         = '#' + section
        ;
      if (section && $(hash).length > 0) {
        toHash(hash);
      }
    }

//訂閱一個section
function subscribeSection(room, chapter, id) {
  if (! SCRIBE.paragraph[ id ]) {
    SCRIBE.paragraph[ id ] = Meteor.subscribe('paragraph', room, chapter, id);
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
        var RouterParams = Session.get('RouterParams')
          , room         = RouterParams.room
          , chapter      = RouterParams.chapter
          , $section     = $(ins.firstNode)
          , section      = ins.firstNode.id
          ;
        if (ins.opened) {
          if ($section.find('article.editing').length > 0) {
            return false;
          }
          $section.children('div.content').hide();
          ins.opened = false;
        }
        else {
          subscribeSection(room, chapter, section);
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
  //段落全選取
  ,'click header i.icon-eye-open' :
      function(e, ins) {
        e.stopPropagation();
        $(ins.firstNode).find('article').addClass('focus');
      }
  //段落全取消選取
  ,'click header i.icon-eye-close' :
      function(e, ins) {
        e.stopPropagation();
        $(ins.firstNode).find('article').removeClass('focus editing');
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
        var RouterParams = Session.get('RouterParams')
          , room         = RouterParams.room
          , chapter      = RouterParams.chapter
          , section      = ins.firstNode.id
          , sort         = DB.record.find({'room' : room, 'chapter' : chapter, 'section' : section }).count()
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
      var data     = this.data
        ;
      //若已訂閱此章節
      if (SCRIBE.paragraph[ data._id ]) {
        this.opened = true;
      }
      //三天內有更新者自動進行訂閱
      else if (Date.now() - data.time <= 259200000) {
        this.opened = true;
        subscribeSection(data.room, data.chapter, data._id);
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
  ,'canEdit'     :
      function() {
        var RouterParams = Session.get('RouterParams')
          , room         = DB.room.findOne(RouterParams.room)
          , user         = Meteor.userId()
          ;
        return (user && (user === this.user || user === TRPG.adm || _.indexOf(room.adm, user) !== -1));
      }
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
          .removeClass('focus');
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
  //刪除段落
  ,'click article header a.delete' :
      function(e, ins) {
        e.stopPropagation();
        if (window.confirm('你確定要刪除此段落？')) {
          DB.record.remove($(ins.firstNode).attr('data-id'));
        }
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
//自動選取與自動編輯
Template.chapter_section_paragraph.rendered =
    function() {
      var RouterParams  = Session.get('RouterParams')
        //要自動選取起來的時間
        , selectTime    = LastViewTime
        , undefined
        ;
      //自動編輯新增段落
      if (this.data.content === undefined && this.data.user === Meteor.userId()) {
        $(this.firstNode).addClass('focus editing')
          .find('div.paragraph')
            .prop('contenteditable', true)
            .trigger('focus');
      }
      //更新時間在選取時間之後的所有文章皆自動選取
      else if (this.data.time >= selectTime) {
        $(this.firstNode).addClass('focus');
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