export type KanjiWord = {
  word: string;
  reading: string;
  meaning: string;
};

export type KanjiExample = {
  japanese: string;
  translation: string;
};

export type KanjiStroke = Array<{ x: number; y: number }>;

export type KanjiLevel = "N5" | "N4";

export type KanjiEntry = {
  kanji: string;
  jlptLevel: KanjiLevel;
  kunyomi: string[];
  onyomi: string[];
  meaning: string;
  words: KanjiWord[];
  examples: KanjiExample[];
  strokePaths: KanjiStroke[];
};

export const kanjiLibrary: KanjiEntry[] = [
  {
    kanji: "日",
    jlptLevel: "N5",
    meaning: "day, sun",
    kunyomi: ["ひ", "か"],
    onyomi: ["ニチ", "ジツ"],
    words: [
      { word: "日本", reading: "にほん", meaning: "Japan" },
      { word: "日曜日", reading: "にちようび", meaning: "Sunday" },
      { word: "毎日", reading: "まいにち", meaning: "every day" },
    ],
    examples: [
      { japanese: "毎日、日本語を勉強します。", translation: "I study Japanese every day." },
      { japanese: "今日はいい日です。", translation: "Today is a good day." },
    ],
    strokePaths: [
      [{ x: 18, y: 16 }, { x: 82, y: 16 }],
      [{ x: 18, y: 16 }, { x: 18, y: 84 }],
      [{ x: 82, y: 16 }, { x: 82, y: 84 }],
      [{ x: 18, y: 84 }, { x: 82, y: 84 }],
      [{ x: 28, y: 49 }, { x: 72, y: 49 }],
    ],
  },
  {
    kanji: "月",
    jlptLevel: "N5",
    meaning: "month, moon",
    kunyomi: ["つき"],
    onyomi: ["ゲツ", "ガツ"],
    words: [
      { word: "月曜日", reading: "げつようび", meaning: "Monday" },
      { word: "来月", reading: "らいげつ", meaning: "next month" },
      { word: "一か月", reading: "いっかげつ", meaning: "one month" },
    ],
    examples: [
      { japanese: "来月、東京へ行きます。", translation: "I will go to Tokyo next month." },
      { japanese: "月がきれいですね。", translation: "The moon is beautiful, isn't it?" },
    ],
    strokePaths: [
      [{ x: 20, y: 14 }, { x: 20, y: 86 }],
      [{ x: 20, y: 14 }, { x: 74, y: 14 }, { x: 82, y: 24 }, { x: 82, y: 86 }],
      [{ x: 30, y: 40 }, { x: 72, y: 40 }],
      [{ x: 30, y: 62 }, { x: 72, y: 62 }],
    ],
  },
  {
    kanji: "水",
    jlptLevel: "N5",
    meaning: "water",
    kunyomi: ["みず"],
    onyomi: ["スイ"],
    words: [
      { word: "水曜日", reading: "すいようび", meaning: "Wednesday" },
      { word: "飲み水", reading: "のみみず", meaning: "drinking water" },
      { word: "水道", reading: "すいどう", meaning: "water supply" },
    ],
    examples: [
      { japanese: "水を一杯ください。", translation: "Please give me a glass of water." },
      { japanese: "この川の水は冷たいです。", translation: "The river water is cold." },
    ],
    strokePaths: [
      [{ x: 50, y: 14 }, { x: 50, y: 82 }],
      [{ x: 32, y: 34 }, { x: 70, y: 47 }],
      [{ x: 28, y: 58 }, { x: 14, y: 84 }],
      [{ x: 62, y: 58 }, { x: 84, y: 86 }],
    ],
  },
  {
    kanji: "火",
    jlptLevel: "N5",
    meaning: "fire",
    kunyomi: ["ひ"],
    onyomi: ["カ"],
    words: [
      { word: "火曜日", reading: "かようび", meaning: "Tuesday" },
      { word: "花火", reading: "はなび", meaning: "fireworks" },
      { word: "火山", reading: "かざん", meaning: "volcano" },
    ],
    examples: [
      { japanese: "火を消してください。", translation: "Please put out the fire." },
      { japanese: "夏に花火を見ます。", translation: "I watch fireworks in summer." },
    ],
    strokePaths: [
      [{ x: 50, y: 16 }, { x: 47, y: 55 }, { x: 50, y: 82 }],
      [{ x: 34, y: 38 }, { x: 18, y: 66 }],
      [{ x: 66, y: 40 }, { x: 82, y: 68 }],
      [{ x: 46, y: 58 }, { x: 26, y: 90 }],
    ],
  },
  {
    kanji: "木",
    jlptLevel: "N5",
    meaning: "tree, wood",
    kunyomi: ["き"],
    onyomi: ["モク", "ボク"],
    words: [
      { word: "木曜日", reading: "もくようび", meaning: "Thursday" },
      { word: "木", reading: "き", meaning: "tree" },
      { word: "木材", reading: "もくざい", meaning: "lumber" },
    ],
    examples: [
      { japanese: "公園に大きい木があります。", translation: "There is a big tree in the park." },
      { japanese: "この机は木で作られています。", translation: "This desk is made of wood." },
    ],
    strokePaths: [
      [{ x: 50, y: 14 }, { x: 50, y: 84 }],
      [{ x: 22, y: 36 }, { x: 78, y: 36 }],
      [{ x: 50, y: 52 }, { x: 20, y: 84 }],
      [{ x: 50, y: 52 }, { x: 80, y: 84 }],
    ],
  },
  {
    kanji: "金",
    jlptLevel: "N5",
    meaning: "gold, money",
    kunyomi: ["かね", "かな"],
    onyomi: ["キン", "コン"],
    words: [
      { word: "金曜日", reading: "きんようび", meaning: "Friday" },
      { word: "お金", reading: "おかね", meaning: "money" },
      { word: "料金", reading: "りょうきん", meaning: "fee" },
    ],
    examples: [
      { japanese: "財布にお金がありません。", translation: "There is no money in my wallet." },
      { japanese: "この本の料金はいくらですか。", translation: "How much is the fee for this book?" },
    ],
    strokePaths: [
      [{ x: 50, y: 12 }, { x: 50, y: 26 }],
      [{ x: 30, y: 26 }, { x: 70, y: 26 }],
      [{ x: 20, y: 42 }, { x: 80, y: 42 }],
      [{ x: 34, y: 42 }, { x: 26, y: 58 }],
      [{ x: 66, y: 42 }, { x: 74, y: 58 }],
      [{ x: 50, y: 42 }, { x: 50, y: 88 }],
      [{ x: 24, y: 64 }, { x: 76, y: 64 }],
      [{ x: 18, y: 84 }, { x: 82, y: 84 }],
    ],
  },
  {
    kanji: "土",
    jlptLevel: "N5",
    meaning: "soil, earth",
    kunyomi: ["つち"],
    onyomi: ["ド", "ト"],
    words: [
      { word: "土曜日", reading: "どようび", meaning: "Saturday" },
      { word: "土地", reading: "とち", meaning: "land" },
      { word: "土産", reading: "みやげ", meaning: "souvenir" },
    ],
    examples: [
      { japanese: "土曜日に友達と会います。", translation: "I will meet my friend on Saturday." },
      { japanese: "この土は野菜にいいです。", translation: "This soil is good for vegetables." },
    ],
    strokePaths: [
      [{ x: 50, y: 16 }, { x: 50, y: 84 }],
      [{ x: 30, y: 40 }, { x: 70, y: 40 }],
      [{ x: 18, y: 84 }, { x: 82, y: 84 }],
    ],
  },
  {
    kanji: "人",
    jlptLevel: "N5",
    meaning: "person",
    kunyomi: ["ひと"],
    onyomi: ["ジン", "ニン"],
    words: [
      { word: "日本人", reading: "にほんじん", meaning: "Japanese person" },
      { word: "大人", reading: "おとな", meaning: "adult" },
      { word: "人気", reading: "にんき", meaning: "popularity" },
    ],
    examples: [
      { japanese: "あの人は私の先生です。", translation: "That person is my teacher." },
      { japanese: "この店はとても人気があります。", translation: "This shop is very popular." },
    ],
    strokePaths: [
      [{ x: 46, y: 18 }, { x: 22, y: 82 }],
      [{ x: 50, y: 18 }, { x: 78, y: 84 }],
    ],
  },
  {
    kanji: "学",
    jlptLevel: "N5",
    meaning: "study, learning",
    kunyomi: ["まな"],
    onyomi: ["ガク"],
    words: [
      { word: "学校", reading: "がっこう", meaning: "school" },
      { word: "学生", reading: "がくせい", meaning: "student" },
      { word: "学ぶ", reading: "まなぶ", meaning: "to learn" },
    ],
    examples: [
      { japanese: "学校で日本語を学びます。", translation: "I learn Japanese at school." },
      { japanese: "彼は大学の学生です。", translation: "He is a university student." },
    ],
    strokePaths: [
      [{ x: 28, y: 18 }, { x: 72, y: 18 }],
      [{ x: 36, y: 18 }, { x: 28, y: 34 }],
      [{ x: 64, y: 18 }, { x: 72, y: 34 }],
      [{ x: 20, y: 38 }, { x: 80, y: 38 }],
      [{ x: 30, y: 50 }, { x: 70, y: 50 }],
      [{ x: 36, y: 50 }, { x: 24, y: 84 }],
      [{ x: 64, y: 50 }, { x: 76, y: 84 }],
      [{ x: 24, y: 84 }, { x: 76, y: 84 }],
    ],
  },
  {
    kanji: "生",
    jlptLevel: "N5",
    meaning: "life, birth, raw",
    kunyomi: ["い", "う", "なま"],
    onyomi: ["セイ", "ショウ"],
    words: [
      { word: "先生", reading: "せんせい", meaning: "teacher" },
      { word: "学生", reading: "がくせい", meaning: "student" },
      { word: "生まれる", reading: "うまれる", meaning: "to be born" },
    ],
    examples: [
      { japanese: "私の先生はとても親切です。", translation: "My teacher is very kind." },
      { japanese: "赤ちゃんが生まれました。", translation: "A baby was born." },
    ],
    strokePaths: [
      [{ x: 50, y: 12 }, { x: 50, y: 86 }],
      [{ x: 24, y: 32 }, { x: 76, y: 32 }],
      [{ x: 30, y: 52 }, { x: 70, y: 52 }],
      [{ x: 16, y: 70 }, { x: 84, y: 70 }],
      [{ x: 26, y: 86 }, { x: 74, y: 86 }],
    ],
  },
  {
    kanji: "行",
    jlptLevel: "N5",
    meaning: "go",
    kunyomi: ["い", "ゆ", "おこな"],
    onyomi: ["コウ", "ギョウ"],
    words: [
      { word: "行く", reading: "いく", meaning: "to go" },
      { word: "銀行", reading: "ぎんこう", meaning: "bank" },
      { word: "旅行", reading: "りょこう", meaning: "travel" },
    ],
    examples: [
      { japanese: "毎朝、学校へ行きます。", translation: "I go to school every morning." },
      { japanese: "来月、京都へ旅行します。", translation: "I will travel to Kyoto next month." },
    ],
    strokePaths: [
      [{ x: 26, y: 16 }, { x: 26, y: 84 }],
      [{ x: 14, y: 34 }, { x: 40, y: 34 }],
      [{ x: 58, y: 16 }, { x: 58, y: 84 }],
      [{ x: 44, y: 44 }, { x: 86, y: 44 }],
      [{ x: 72, y: 44 }, { x: 72, y: 92 }],
      [{ x: 52, y: 70 }, { x: 86, y: 70 }],
    ],
  },
  {
    kanji: "見",
    jlptLevel: "N5",
    meaning: "see",
    kunyomi: ["み"],
    onyomi: ["ケン"],
    words: [
      { word: "見る", reading: "みる", meaning: "to see" },
      { word: "意見", reading: "いけん", meaning: "opinion" },
      { word: "見せる", reading: "みせる", meaning: "to show" },
    ],
    examples: [
      { japanese: "夜にアニメを見ます。", translation: "I watch anime at night." },
      { japanese: "その写真を見せてください。", translation: "Please show me that photo." },
    ],
    strokePaths: [
      [{ x: 18, y: 16 }, { x: 82, y: 16 }],
      [{ x: 18, y: 16 }, { x: 18, y: 56 }],
      [{ x: 82, y: 16 }, { x: 82, y: 56 }],
      [{ x: 18, y: 56 }, { x: 82, y: 56 }],
      [{ x: 34, y: 34 }, { x: 66, y: 34 }],
      [{ x: 50, y: 56 }, { x: 24, y: 86 }],
      [{ x: 50, y: 56 }, { x: 78, y: 88 }],
    ],
  },
  {
    kanji: "読",
    jlptLevel: "N4",
    meaning: "read",
    kunyomi: ["よ"],
    onyomi: ["ドク", "トク"],
    words: [
      { word: "読む", reading: "よむ", meaning: "to read" },
      { word: "読書", reading: "どくしょ", meaning: "reading books" },
      { word: "音読", reading: "おんどく", meaning: "reading aloud" },
    ],
    examples: [
      { japanese: "毎日、新聞を読みます。", translation: "I read the newspaper every day." },
      { japanese: "授業で文章を音読します。", translation: "I read the passage aloud in class." },
    ],
    strokePaths: [
      [{ x: 16, y: 20 }, { x: 34, y: 20 }],
      [{ x: 24, y: 20 }, { x: 24, y: 86 }],
      [{ x: 14, y: 44 }, { x: 34, y: 44 }],
      [{ x: 44, y: 18 }, { x: 84, y: 18 }],
      [{ x: 44, y: 36 }, { x: 84, y: 36 }],
      [{ x: 64, y: 18 }, { x: 64, y: 86 }],
      [{ x: 44, y: 62 }, { x: 84, y: 62 }],
      [{ x: 46, y: 86 }, { x: 82, y: 86 }],
    ],
  },
  {
    kanji: "書",
    jlptLevel: "N4",
    meaning: "write",
    kunyomi: ["か"],
    onyomi: ["ショ"],
    words: [
      { word: "書く", reading: "かく", meaning: "to write" },
      { word: "図書館", reading: "としょかん", meaning: "library" },
      { word: "辞書", reading: "じしょ", meaning: "dictionary" },
    ],
    examples: [
      { japanese: "ノートに漢字を書きます。", translation: "I write kanji in my notebook." },
      { japanese: "わからない言葉は辞書で調べます。", translation: "I look up unknown words in a dictionary." },
    ],
    strokePaths: [
      [{ x: 18, y: 16 }, { x: 82, y: 16 }],
      [{ x: 26, y: 30 }, { x: 74, y: 30 }],
      [{ x: 50, y: 16 }, { x: 50, y: 52 }],
      [{ x: 20, y: 52 }, { x: 80, y: 52 }],
      [{ x: 20, y: 64 }, { x: 80, y: 64 }],
      [{ x: 34, y: 76 }, { x: 66, y: 76 }],
      [{ x: 34, y: 76 }, { x: 24, y: 90 }],
      [{ x: 66, y: 76 }, { x: 76, y: 90 }],
      [{ x: 24, y: 90 }, { x: 76, y: 90 }],
    ],
  },
  {
    kanji: "話",
    jlptLevel: "N4",
    meaning: "speak, talk",
    kunyomi: ["はな", "はなし"],
    onyomi: ["ワ"],
    words: [
      { word: "話す", reading: "はなす", meaning: "to speak" },
      { word: "会話", reading: "かいわ", meaning: "conversation" },
      { word: "電話", reading: "でんわ", meaning: "telephone" },
    ],
    examples: [
      { japanese: "日本語で少し話せます。", translation: "I can speak a little Japanese." },
      { japanese: "友達と電話で話しました。", translation: "I talked with my friend on the phone." },
    ],
    strokePaths: [
      [{ x: 16, y: 22 }, { x: 34, y: 22 }],
      [{ x: 24, y: 22 }, { x: 24, y: 88 }],
      [{ x: 14, y: 48 }, { x: 34, y: 48 }],
      [{ x: 44, y: 18 }, { x: 84, y: 18 }],
      [{ x: 44, y: 34 }, { x: 84, y: 34 }],
      [{ x: 46, y: 50 }, { x: 82, y: 50 }],
      [{ x: 46, y: 66 }, { x: 82, y: 66 }],
      [{ x: 52, y: 34 }, { x: 52, y: 88 }],
      [{ x: 74, y: 34 }, { x: 74, y: 88 }],
      [{ x: 46, y: 88 }, { x: 82, y: 88 }],
    ],
  },
];
