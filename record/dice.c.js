"use strict";
var pageData = require("router");
var DB = require("db");
var UTIL = require("util");
var STORE = require("store");

Template.dice_dialog.created =
  function() {
    $("#dice_dialog").modal(
      {"show" : false
      }
    );
    this.reactiveDict = new ReactiveDict();
    this.reactiveDict.set("character", null);
    this.reactiveDict.set("quick", null);
  };

Template.dice_dialog.helpers(
  {"title" :
      function() {
        var room      = pageData.get("room")
          , chapter   = pageData.get("chapter")
          , section   = pageData.get("section")
          , paragraph = pageData.get("paragraph")
          ;
        if (room && chapter && section) {
          if (paragraph) {
            return "擲骰--" + room.name + "--" + chapter.name + "--" + section.name + "--段落" + (paragraph.sort + 1);
          }
          else {
            return "擲骰--" + room.name + "--" + chapter.name + "--" + section.name;
          }
        }
        else {
          return "擲骰"
        }
      }
  ,"input_who" :
      function() {
        return {
          "parent"    : Template.instance()
        , "name"      : "who"
        , "options"   :
            function() {
              var ins = Template.instance();
              return DB.character.find(
                {"adm"  : Meteor.userId()
                ,"name" : new RegExp( ins.inputValue.get() )
                }
              );
            }
        , "onSelect"  :
            function(id, ins) {
              ins.data.parent.reactiveDict.set(
                "character"
              , DB.character.findOne( id )
              );
            }
        };
      }
  ,"input_quick"  :
      function() {
        return {
          "parent"      : Template.instance()
        , "name"        : "quick"
        , "options"     :
            function(value) {
              var ins = Template.instance();
              var character = ins.data.parent.reactiveDict.get("character");
              var result;
              var filter = new RegExp( ins.inputValue.get() );

              //已選角色才有快擲
              if (character) {
                //儲存在前端的快擲資料
                result =
                  _.map(
                    STORE("QuickDice") || []
                  , function(data, key) {
                      if (data.character === character._id && filter.test(data.name)) {
                        return {
                          "_id"     : key
                        , "type"    : "store"
                        , "name"    : data.name
                        , "amount"  : data.amount
                        , "face"    : data.face
                        , "add"     : data.add
                        , "addEach" : data.addEach
                        }
                      }
                      return null;
                    }
                  );
                result = _.compact(result);

                //儲存在角色表的擲骰資料
                result =
                  result.concat(
                    DB.character_data
                      .find(
                        {"type"       : "dice"
                        ,"character"  : character._id
                        ,"name"       : filter
                        }
                      )
                      .fetch()
                  );
              }
              else {
                result = [];
              }
              return result;
            }
        , "onSelect"    :
            function(id, ins) {
              var parent = ins.data.parent;
              var character = parent.reactiveDict.get("character");
              var $form = parent.$("form");
              var dice_data = DB.character_data.findOne(id);
              var reactiveDict = ins.data.parent.reactiveDict;
              var add;
              //如果是角色的d20快擲
              if (dice_data) {
                add = UTIL.getCharacterNumber(dice_data._id, character._id);
                $form
                  .find("[name]")
                    .filter("[name=\"name\"]")
                      .val( dice_data.name )
                      .end()
                    .filter("[name=\"amount\"]")
                      .val(1)
                      .end()
                    .filter("[name=\"face\"]")
                      .val(20)
                      .end()
                    .filter("[name=\"add\"]")
                      .val( add )
                      .end()
                    .filter("[name=\"extra\"]")
                      .val(0)
                      .end()
                    .filter("[name=\"addEach\"]")
                      .prop("checked", false)
                      .end()
                    .filter("[name=\"isHide\"]")
                      .prop("checked", false);

                reactiveDict.set("quick", dice_data);
                return true;
              }
              dice_data = (STORE("QuickDice") || {})[id];
              //如果是瀏覽器存的快擲紀錄
              if (dice_data) {
                $form
                  .find("[name]")
                    .filter("[name=\"name\"]")
                      .val( dice_data.name )
                      .end()
                    .filter("[name=\"amount\"]")
                      .val( dice_data.amount )
                      .end()
                    .filter("[name=\"face\"]")
                      .val( dice_data.face )
                      .end()
                    .filter("[name=\"add\"]")
                      .val( dice_data.add )
                      .end()
                    .filter("[name=\"extra\"]")
                      .val(0)
                      .end()
                    .filter("[name=\"addEach\"]")
                      .prop("checked", dice_data.addEach)
                      .end()
                    .filter("[name=\"isHide\"]")
                      .prop("checked", dice_data.isHide)
                      .end()
                    .filter("[name=\"isSaveAsQuick\"]")
                      .prop("checked", true)
                      .end()
                    .filter("[name=\"quick_name\"]")
                      .val( dice_data.name );

                reactiveDict.set("quick", dice_data);
                reactiveDict.set("quick_type", dice_data);
                return true;
              }
            }
        , "canDelete"   :
            function() {
              var ins = Template.instance();
              var parent = ins.data.parent;
              var quick = parent.reactiveDict.get("quick");
              //只有前端快擲才會有face屬性
              return (quick && quick.face);
            }
        , "onDelete"    :
            function() {
              var ins = Template.instance();
              var parent = ins.data.parent;
              var quick = parent.reactiveDict.get("quick");
              var storeQuickDice;
              //只有前端快擲才會有face屬性
              if (quick && quick.face) {
                storeQuickDice = STORE("QuickDice") || {};
                _.some(
                  storeQuickDice
                , function(data, key, store) {
                    if (data.name === quick.name && data.character === quick.character) {
                      delete store[ key ];
                      return true;
                    }
                    return false;
                  }
                )
                STORE("QuickDice", storeQuickDice);
                parent.$("form").trigger("reset");
              }
            }
        };
      }
  ,"canSaveQuick" :
      function() {
        var ins = Template.instance();
        var reactiveDict = ins.reactiveDict;
        var quick = reactiveDict.get("quick");
        if (quick) {
          //如果是角色的快擲資料，只能去角色區修改
          if (quick.type === "dice") {
            return false;
          }
          //如果是儲存在前端的快擲資料，隨時可修改
          else if (quick.type === "store") {
            return true;
          }
        }
        return true;
      }
  }
);

Template.dice_dialog.events(
  //擲骰
  {"click button.btn-primary" :
      function(e, ins) {
        var room      = pageData.get("room")
          , chapter   = pageData.get("chapter")
          , section   = pageData.get("section")
          , paragraph = pageData.get("paragraph")
          , $form     = ins.$("form")
          , $input    = $form.find("[name]")
          , dice
          , quick
          , store
          ;

        dice =
            {"room"     : room._id
            ,"chapter"  : chapter._id
            ,"section"  : section._id
            };
        if (paragraph) {
          dice.paragraph = paragraph._id;
        }
        dice.who = $input.filter("[name=\"who\"]").val();
        dice.name = $input.filter("[name=\"name\"]").val();
        dice.amount = parseInt( $input.filter("[name=\"amount\"]").val() );
        dice.face = parseInt( $input.filter("[name=\"face\"]").val() );
        dice.add = parseInt( $input.filter("[name=\"add\"]").val() );
        dice.extra = parseInt( $input.filter("[name=\"extra\"]").val() );
        dice.addEach = $input.filter("[name=\"addEach\"]").prop("checked");
        dice.note = $input.filter("[name=\"note\"]").val();
        dice.isHide = $input.filter("[name=\"isHide\"]").prop("checked");

        //存為快擲
        if ($input.filter("[name=\"isSaveAsQuick\"]:visible").prop("checked")) {
          quick = _.omit(dice, "room", "chapter", "section", "paragraph", "extra", "note");
          quick.name = $input.filter("[name=\"quick_name\"]").val();
          quick.character = ins.reactiveDict.get("character")._id;

          store = STORE("QuickDice") || {};
          //若之前已存在相同名稱的快擲
          if (
            _.some(
              store
            , function(data, key, store) {
                if (data.name === quick.name && data.character === quick.character) {
                  store[ key ] = quick;
                  return true;
                }
                return false;
              }
            )
          ) {

          }
          //否則另存新快擲
          else {
            store[ "" + Date.now() ] = quick;
          }
          STORE("QuickDice", store);
        }
        Meteor.call(
          "insertDice"
        , dice
        , function() {
            $("#dice_dialog").modal("hide");
            $form.trigger("reset");
          }
        );
      }
  //typeahead show
  ,"focus .input-group input" :
      function(e) {
        var $emiter = $(e.currentTarget).closest(".input-group")
          , hideFn
          ;

        if ($emiter.find(".typeahead li").length > 0) {
          $emiter.find(".typeahead").show();
          hideFn =
            function(e) {
              if ($(e.target).closest($emiter).length < 1) {
                $emiter.find(".typeahead").hide();
                $("body").off("click", hideFn);
              }
            };
          $("body").on("click", hideFn);
        }
      }
  //重設擲骰時
  ,"reset form" :
      function(e, ins) {
        var reactiveDict = ins.reactiveDict;
        reactiveDict.set("character", null);
        reactiveDict.set("quick", null);
      }
  //自動設定是否要存為快擲
  ,"keyup [name=\"quick_name\"]" :
      function(e, ins) {
        if (e.currentTarget.value) {
          ins.$("[name=\"isSaveAsQuick\"]").prop("checked", true);
        }
        else {
          ins.$("[name=\"isSaveAsQuick\"]").prop("checked", false);
        }
      }
  }
);


Template.dice_dialog_auto_complete.created =
  function() {
    this.inputValue = new ReactiveVar("");
  };
Template.dice_dialog_auto_complete.events(
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
  ,"click [data-action=\"delete\"]" :
    function(e, ins) {
      ins.data.onDelete();
    }
  }
);
