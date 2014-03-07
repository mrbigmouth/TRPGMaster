//首頁router
var LastViewTime = 0;
Router.map(function () {
  this.route(
    'record'
  , {'path'      : '/room/:room/:chapter/'
    ,'template'  : 'main_record'
    ,'waitOn'    :
        function() {
          var params = this.params
            ;
          return [
            Meteor.subscribe('chapter', params.room, params.chapter, (params.hash || ''))
          , Meteor.subscribe('mapList', params.chapter)
          ]
          ;
        }
    ,'after'     :
        function() {
          var RouterParams = this.params
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
          //離開頁面警示
          window.onbeforeunload =
            function() {
              if ($('article.editing').length > 0) {
                return '你正在編輯文章，離開此網頁將會失去所有編輯訊息，是否確定？'; 
              }
            };
        }
    ,'unload'    :
        function() {
          window.onbeforeunload = $.noop;
        }
    }
  );
});


Template.main_record.helpers(
  {'title'      :
      function(name) {
        var params  = Session.get('RouterParams')
          , room    = DB.room.findOne(params.room) || {'name' : ''}
          , chapter = DB.record.findOne(params.chapter) || {'name' : ''}
          ;
        return room.name + '--' + chapter.name;
      }
  ,'allSection' :
      function() {
        var RouterParams = Session.get('RouterParams');
        return DB.record.find({'room' : RouterParams.room, 'chapter' : RouterParams.chapter, 'section' : {'$exists' : false} }, {'sort' : {'sort' : 1}});
      }
  }
);
Template.main_record.events(
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
        //更新紀錄
        DB.message_all.insert(
          {'user'    : Meteor.userId()
          ,'room'    : room
          ,'chapter' : chapter
          ,'type'    : 'room'
          ,'msg'     : '更新了遊戲紀錄。'
          }
        )
      }
  ,'click ul.breadcrumb a.goSection'  :
      function(e) {
        location.href = '#' + $(e.currentTarget).attr('data-id');
      }
  }
)

//section template
var goHash = _.debounce(function() { if (location.hash) { location.href = location.hash; } }, 500);
Template.chapter_section.helpers(
  {'allParagraph'   :
      function() {
        var room    = this.room
          , chapter = this.chapter
          , section = this._id
          , cursor  = DB.record.find({'room' : room, 'chapter' : chapter, 'section' : section }, {'sort' : {'sort' : 1}})
          ;
        goHash();
        return DB.record.find({'room' : room, 'chapter' : chapter, 'section' : section }, {'sort' : {'sort' : 1}});
      }
  ,'emptyParagraph' :
      function() {
        return {};
      }
  ,'isAdm'          : TOOL.userIsAdm
  ,'isPlayer'       : TOOL.userIsPlayer
  }
);
Template.chapter_section.events(
  //展開收起此章節
  {'click header' :
      function(e, ins) {
        var RouterParams = Session.get('RouterParams')
          , room         = RouterParams.room
          , chapter      = RouterParams.chapter
          , section      = ins.firstNode.id
          , $section     = $(ins.firstNode)
          , $content     = $section.children('div.content')
          ;
        if ($section.find('article.editing').length > 0) {
          return false;
        }
        if ($content.is(':visible')) {
          $content.hide();
        }
        else {
          Meteor.subscribe('chapter', room, chapter, section);
          $content.show();
        }
      }
  //編輯章節標題
  ,'click header i.icon-pencil' :
      function(e, ins) {
        var section = ins.firstNode.id
          , insData = ins.data
          , title   = window.prompt('請輸入新標題：')
          ;
        e.stopPropagation();
        if (title) {
          DB.record.update(section, {'$set' : {'name' : title} });
          //更新紀錄
          DB.message_all.insert(
            {'user'    : Meteor.userId()
            ,'room'    : insData.room
            ,'chapter' : insData.chapter
            ,'section' : section
            ,'type'    : 'room'
            ,'msg'     : '更新了遊戲紀錄。'
            }
          )
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
            {'room'    : insData.room
            ,'chapter' : insData.chapter
            ,'section' : section
            ,'type'    : 'outside'
            ,'msg'     : msg
            }
          );
        }
      }
  //新增地圖
  ,'click aside a.createMap' :
      function(e, ins) {
        var $link   = $(e.currentTarget)
          , section = ins.data
          , maps    = DB.map.find({'chapter' : section.chapter}).fetch()
          , href    = 
              function(mapID) {
                return '/room/' + section.room + '/' + section.chapter + '/map/' + mapID + '/';
              }
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
            , linkMap
            ;

          msgs.unshift('請指定地圖或開新地圖：', '0)為此章節開新地圖');
          choice = window.prompt(msgs.join('\r\n'), 0);
          if (choice === null) {
            return false;
          }
          //開新地圖
          if (choice == '0') {
            var mapData =
                {'_id'     : section._id
                ,'room'    : section.room
                ,'chapter' : section.chapter
                ,'section' : section._id
                ,'round'   : 1
                ,'sizeX'   : 10
                ,'sizeY'   : 10
                ,'light'   : 100
                }
              ;
            mapData.name = window.prompt('請輸入地圖名稱：', section.name + '戰場地圖');
            if (mapData.name === null) {
              return false;
            }
            DB.map.insert(mapData, function() {
              DB.message_all.insert(
                {'room'    : section.room
                ,'chapter' : section.chapter
                ,'section' : section._id
                ,'type'    : 'room'
                ,'msg'     : '建立了新地圖「' + mapData.name + '」'
                }
              );
              DB.record.update(section._id, {'$set' : {'map' : section._id} });
            });
          }
          //指定地圖
          else {
            //輸入值錯誤
            if (isNaN(choice) || choice === null) {
              return false;
            }
            //獲取要指定的地圖
            choice = parseInt(choice, 10) - 1;
            linkMap = maps[ choice ];
            //指定地圖
            DB.record.update(
              section._id
            , {'$set' : {'map' : linkMap._id} }
            , function() {
                //指定地圖並開視窗
                window.open(href( linkMap._id ), 'map');
              }
            );
          }
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
        //更新紀錄
        DB.message_all.insert(
          {'user'    : Meteor.userId()
          ,'room'    : room
          ,'chapter' : chapter
          ,'section' : section
          ,'type'    : 'room'
          ,'msg'     : '更新了遊戲紀錄。'
          }
        )
      }
  //回到頁首
  ,'click aside a.top' :
      function() {
        location.href = '#main_record';
      }
  }
)

//自動展開
Template.chapter_section.rendered =
    function () {
      var id       = this.data._id
        , $section = $(this.firstNode)
        ;
      //已訂閱之section自動展開
      if (DB.record.findOne({'section' : id})) {
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
          , user         = Meteor.userId()
          ;
        return (user && (user === this.user || TOOL.userIsAdm(RouterParams.room) ));
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
        newData.sort = sort;
        $all.each(function(i) {
          if (i >= sort) {
            DB.record.update($(this).attr('data-id'), {'$inc' : {'sort' : 1} });
          }
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
        var insData = ins.data
          , room    = insData.room
          , chapter = insData.chapter
          , section = insData.section || insData._id
          ;
        e.stopPropagation();
        if (window.confirm('你確定要刪除此段落？')) {
          $(ins.firstNode).nextAll('article').each(function() {
            DB.record.update($(this).attr('data-id'), {'$inc' : {'sort' : -1} });
          });
          DB.record.remove($(ins.firstNode).attr('data-id'));
          //更新紀錄
          DB.message_all.insert(
            {'user'    : Meteor.userId()
            ,'room'    : room
            ,'chapter' : chapter
            ,'section' : section
            ,'type'    : 'room'
            ,'msg'     : '刪除了遊戲紀錄。'
            }
          )
        }
      }
  //取消修改
  ,'click article header a.cancel' :
      function(e, ins) {
        e.stopPropagation();
        var $this   = $(ins.firstNode)
          , insData = ins.data
          ;
        if (! $this.hasClass('editing')) {
          return false;
        }
        $this
          .removeClass('editing')
          .find('div.paragraph')
            .html(insData.content)
            .prop('contenteditable', false);
      }
  //送出修改
  ,'click article header a.submit' :
      function(e, ins) {
        e.stopPropagation();
        var userID  = Meteor.userId()
          , $this   = $(ins.firstNode)
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
          insData.content = content.shift();
          //更新第一段內容
          DB.record.update(insData._id, {'$set' : {'content' : insData.content}});
          //sort排序+1
          sort += 1;
        }
        //若不只送出一段
        if (content.length) {
          inc = content.length;
          //將後方的所有段落sort += 新增的段落數量
          $this.nextAll('article').each(function(i) {
            var id = $(this).attr('data-id');
            DB.record.update(id, {'$inc' : {'sort' : inc} });
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
        //取消編輯模式
        $this
          .removeClass('editing')
          .find('div.paragraph')
            .html(insData.content)
            .prop('contenteditable', false);
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
        return DB.message_all.find({'section' : this._id, 'type' : {'$in' : ['outside', 'dice']}},{'sort' : {'_id' : 1}});
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
