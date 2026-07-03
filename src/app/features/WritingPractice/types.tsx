

export const writingScripts = ["hiragana", "katakana", "kanji"] as const;
export type WritingScript = (typeof writingScripts)[number];
export const writingCharacters: Record<WritingScript, string[]> = {
  hiragana: [
    "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と", "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も", "や", "ゆ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "ん",
    "が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど",
    "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ", "きゃ", "きゅ", "きょ", "しゃ", "しゅ", "しょ",
    "ちゃ", "ちゅ", "ちょ", "にゃ", "にゅ", "にょ", "ひゃ", "ひゅ", "ひょ", "みゃ", "みゅ", "みょ", "りゃ", "りゅ", "りょ",
  ],
  katakana: [
    "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ", "サ", "シ", "ス", "セ", "ソ",
    "タ", "チ", "ツ", "テ", "ト", "ナ", "ニ", "ヌ", "ネ", "ノ", "ハ", "ヒ", "フ", "ヘ", "ホ",
    "マ", "ミ", "ム", "メ", "モ", "ヤ", "ユ", "ヨ", "ラ", "リ", "ル", "レ", "ロ", "ワ", "ヲ", "ン",
    "ガ", "ギ", "グ", "ゲ", "ゴ", "ザ", "ジ", "ズ", "ゼ", "ゾ", "ダ", "ヂ", "ヅ", "デ", "ド",
    "バ", "ビ", "ブ", "ベ", "ボ", "パ", "ピ", "プ", "ペ", "ポ", "キャ", "キュ", "キョ", "シャ", "シュ", "ショ",
    "チャ", "チュ", "チョ", "ニャ", "ニュ", "ニョ", "ヒャ", "ヒュ", "ヒョ", "ミャ", "ミュ", "ミョ", "リャ", "リュ", "リョ",
  ],
  kanji: [
    "日", "月", "火", "水", "木", "金", "土", "山", "川", "人", "口", "田", "本", "中", "学",
    "年", "時", "分", "先", "生", "名", "前", "後", "左", "右", "上", "下", "東", "西", "南", "北",
    "駅", "電", "車", "雨", "雪", "花", "天", "気", "食", "飲", "見", "聞", "読", "書", "話", "買",
    "行", "来", "帰", "休", "友", "家", "父", "母", "兄", "姉", "弟", "妹", "犬", "猫", "海", "国",
  ],
};

export type WritingText = {
  writingInstruction: string;
  writingTarget: string;
  writingClear: string;
  writingCheck: string;
  writingNext: string;
  writingSimilarity: string;
  writingPass: string;
  writingRetry: string;
  writingHint: string;
  writingGuide: string;
  writingAccuracy: string;
  writingAttempts: string;
  noWritingMatches: string;
  noMatchingCards: string;
};

export type WritingStat = {
  attempts: number;
  passes: number;
  bestSimilarity: number;
};