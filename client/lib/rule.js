RULE = 
{'PF' :
    {'character' :
        {'profile'     :
            [ {'name'  : '種族'
              ,'class' : 'span3'
              ,'value' : ''
              }
            , {'name'  : '性別'
              ,'class' : 'span1'
              ,'value' : ''
              }
            , {'name'  : '年齡'
              ,'class' : 'span1'
              ,'value' : ''
              }
            , {'name'  : '身高'
              ,'class' : 'span2'
              ,'value' : ''
              }
            , {'name'  : '體重'
              ,'class' : 'span2'
              ,'value' : ''
              }
            , {'name'  : '陣營'
              ,'class' : 'span2'
              ,'value' : ''
              }
            , {'name'  : '語言'
              ,'class' : 'span6'
              ,'value' : ''
              }
            ]
        ,'number'      :
            [ {'name'  : '經驗值'
              ,'value' :
                  [ {'name'  : '經驗值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '生命值'
              ,'value' :
                  [ {'name'  : '現存生命值'
                    ,'value' : 0
                    }
                  , {'name'  : '暫時生命值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '最大生命值'
              ,'value' :
                  [ {'name'  : '體質加值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '基本攻擊加值'
              ,'value' :
                  []
              }
            , {'name'  : '力量'
              ,'value' :
                  [ {'name'  : '初始'
                    ,'value' : 0
                    }
                  , {'name'  : '升級'
                    ,'value' : 0
                    }
                  , {'name'  : '增強加值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '力量調整值'
              ,'value' :
                  [ {'name'  : '力量調整值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '敏捷'
              ,'value' :
                  [ {'name'  : '初始'
                    ,'value' : 0
                    }
                  , {'name'  : '升級'
                    ,'value' : 0
                    }
                  , {'name'  : '增強加值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '敏捷調整值'
              ,'value' :
                  [ {'name'  : '敏捷調整值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '體質'
              ,'value' :
                  [ {'name'  : '初始'
                    ,'value' : 0
                    }
                  , {'name'  : '升級'
                    ,'value' : 0
                    }
                  , {'name'  : '增強加值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '體質調整值'
              ,'value' :
                  [ {'name'  : '體質調整值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '智力'
              ,'value' :
                  [ {'name'  : '初始'
                    ,'value' : 0
                    }
                  , {'name'  : '升級'
                    ,'value' : 0
                    }
                  , {'name'  : '增強加值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '智力調整值'
              ,'value' :
                  [ {'name'  : '智力調整值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '睿智'
              ,'value' :
                  [ {'name'  : '初始'
                    ,'value' : 0
                    }
                  , {'name'  : '升級'
                    ,'value' : 0
                    }
                  , {'name'  : '增強加值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '睿智調整值'
              ,'value' :
                  [ {'name'  : '睿智調整值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '魅力'
              ,'value' :
                  [ {'name'  : '初始'
                    ,'value' : 0
                    }
                  , {'name'  : '升級'
                    ,'value' : 0
                    }
                  , {'name'  : '增強加值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '魅力調整值'
              ,'value' :
                  [ {'name'  : '魅力調整值'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '防禦等級'
              ,'value' :
                  [ {'name'  : '基本'
                    ,'value' : 10
                    }
                  , {'name'  : '盔甲'
                    ,'value' : 0
                    }
                  , {'name'  : '盾牌'
                    ,'value' : 0
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  , {'name'  : '天生防禦'
                    ,'value' : 0
                    }
                  , {'name'  : '卸勁'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '戰技防禦'
              ,'value' :
                  [ {'name'  : '基本'
                    ,'value' : 10
                    }
                  , {'name'  : '基本攻擊加值'
                    ,'use'   : '基本攻擊加值'
                    }
                  , {'name'  : '力量調整'
                    ,'use'   : '力量調整值'
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  , {'name'  : '特殊體型調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '防具減值'
              ,'value' :
                  [ {'name'  : '盔甲'
                    ,'value' : 0
                    }
                  , {'name'  : '盾牌'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '基礎速度'
              ,'value' :
                  [ {'name'  : '基本'
                    ,'value' : 30
                    }
                  ]
              }
            ]
        ,'dice'        :
            [ {'name'  : '先攻擲骰'
              ,'value' :
                  [ {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  ]
              }
            , {'name'  : '強韌檢定'
              ,'value' :
                  [ {'name'  : '體質調整'
                    ,'use'   : '體質調整值'
                    }
                  ]
              }
            , {'name'  : '反射檢定'
              ,'value' :
                  [ {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  ]
              }
            , {'name'  : '意志檢定'
              ,'value' :
                  [ {'name'  : '睿智調整'
                    ,'use'   : '睿智調整值'
                    }
                  ]
              }
            , {'name'  : '一般近戰命中'
              ,'value' :
                  [ {'name'  : '基本攻擊加值'
                    ,'use'   : '基本攻擊加值'
                    }
                  , {'name'  : '力量調整'
                    ,'use'   : '力量調整值'
                    }
                  ]
              }
            , {'name'  : '一般遠程命中'
              ,'value' :
                  [ {'name'  : '基本攻擊加值'
                    ,'use'   : '基本攻擊加值'
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  ]
              }
            , {'name'  : '戰技檢定'
              ,'value' :
                  [ {'name'  : '基本攻擊加值'
                    ,'use'   : '基本攻擊加值'
                    }
                  , {'name'  : '力量調整'
                    ,'use'   : '力量調整值'
                    }
                  , {'name'  : '特殊體型調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '力量檢定'
              ,'value' :
                  [ {'name'  : '力量調整'
                    ,'use'   : '力量調整值'
                    }
                  ]
              }
            , {'name'  : '敏捷檢定'
              ,'value' :
                  [ {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  ]
              }
            , {'name'  : '體質檢定'
              ,'value' :
                  [ {'name'  : '體質調整'
                    ,'use'   : '體質調整值'
                    }
                  ]
              }
            , {'name'  : '智力檢定'
              ,'value' :
                  [ {'name'  : '智力調整'
                    ,'use'   : '智力調整值'
                    }
                  ]
              }
            , {'name'  : '睿智檢定'
              ,'value' :
                  [ {'name'  : '睿智調整'
                    ,'use'   : '睿智調整值'
                    }
                  ]
              }
            , {'name'  : '魅力檢定'
              ,'value' :
                  [ {'name'  : '魅力調整'
                    ,'use'   : '魅力調整值'
                    }
                  ]
              }
            , {'name'  : '運動技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  , {'name'  : '防具減值'
                    ,'use'   : '防具減值'
                    }
                  ]
              }
            , {'name'  : '估價技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '智力調整'
                    ,'use'   : '智力調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '唬弄技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '魅力調整'
                    ,'use'   : '魅力調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '攀爬技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '力量調整'
                    ,'use'   : '力量調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  , {'name'  : '防具減值'
                    ,'use'   : '防具減值'
                    }
                  ]
              }
            , {'name'  : '交涉技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '魅力調整'
                    ,'use'   : '魅力調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '偽裝技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '魅力調整'
                    ,'use'   : '魅力調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '脫逃技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  , {'name'  : '防具減值'
                    ,'use'   : '防具減值'
                    }
                  ]
              }
            , {'name'  : '飛行技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  , {'name'  : '防具減值'
                    ,'use'   : '防具減值'
                    }
                  ]
              }
            , {'name'  : '醫療技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '睿智調整'
                    ,'use'   : '睿智調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '威嚇技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '魅力調整'
                    ,'use'   : '魅力調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '感知技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '睿智調整'
                    ,'use'   : '睿智調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '騎術技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  , {'name'  : '防具減值'
                    ,'use'   : '防具減值'
                    }
                  ]
              }
            , {'name'  : '察顏觀色技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '睿智調整'
                    ,'use'   : '睿智調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '隱匿技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '敏捷調整'
                    ,'use'   : '敏捷調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  , {'name'  : '防具減值'
                    ,'use'   : '防具減值'
                    }
                  ]
              }
            , {'name'  : '生存技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '睿智調整'
                    ,'use'   : '睿智調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  ]
              }
            , {'name'  : '游泳技能檢定'
              ,'value' :
                  [ {'name'  : '技能等級'
                    ,'value' : 0
                    }
                  , {'name'  : '力量調整'
                    ,'use'   : '力量調整值'
                    }
                  , {'name'  : '本職調整'
                    ,'value' : 0
                    }
                  , {'name'  : '防具減值'
                    ,'use'   : '防具減值'
                    }
                  ]
              }
            ]
        ,'item'        :
            [ {'name'   : '白金幣'
              ,'detail' : ''
              ,'amount' : 0
              ,'weight' : 0.02
              ,'worth'  : 10
              }
            , {'name'   : '金幣'
              ,'detail' : ''
              ,'amount' : 0
              ,'weight' : 0.02
              ,'worth'  : 1
              }
            , {'name'   : '銀幣'
              ,'detail' : ''
              ,'amount' : 0
              ,'weight' : 0.02
              ,'worth'  : 0.1
              }
            , {'name'   : '銅幣'
              ,'detail' : ''
              ,'amount' : 0
              ,'weight' : 0.02
              ,'worth'  : 0.01
              }
            ]
        ,'spell'       :
            []
        ,'level'       :
            [ []
            ]
        ,'description' :
            [ {'name'  : '背景'
              ,'value' : ''
              }
            , {'name'  : '外表'
              ,'value' : ''
              }
            ]
        }
    }
}

RULE.mrbigmouth = $.extend(true, {}, RULE.PF);

RULE.mrbigmouth.character.number.splice(
  1
, 0
, {'name'  : '歷練點數'
  ,'value' :
      [ {'name'  : '歷練點數'
        ,'value' : 0
        }
      ]
  }
, {'name'  : '英雄點數'
  ,'value' :
      [ {'name'  : '歷練點數'
        ,'value' : 0
        }
      ]
  }
)
RULE.mrbigmouth.character.description.push(
  {'name'  : '創角問答'
  ,'value' : ''
  }
)