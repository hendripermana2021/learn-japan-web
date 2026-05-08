import type { VocabularyLevel } from "@/data/jlpt-n5";

export type JlptExamQuestion = {
  id: string;
  level: VocabularyLevel;
  before: string;
  target: string;
  after: string;
  reading: string;
  choices: [string, string, string, string];
  translation: string;
  explanation: string;
};

export const jlptExamQuestions: JlptExamQuestion[] = [
  { id: "n5-1", level: "N5", before: "毎朝、", target: "学校", after: "へ行きます。", reading: "がっこう", choices: ["がっこう", "がこう", "がくこう", "がっこ"], translation: "I go to school every morning.", explanation: "学校 is read がっこう." },
  { id: "n5-2", level: "N5", before: "田中さんは", target: "図書館", after: "にいます。", reading: "としょかん", choices: ["としょかん", "としょうかん", "ずしょかん", "としょけん"], translation: "Mr. Tanaka is in the library.", explanation: "図書館 is read としょかん." },
  { id: "n5-3", level: "N5", before: "来週、友達と", target: "映画", after: "を見ます。", reading: "えいが", choices: ["えいが", "えがい", "えいか", "えか"], translation: "Next week, I will watch a movie with my friend.", explanation: "映画 is read えいが." },
  { id: "n5-4", level: "N5", before: "父は", target: "電車", after: "で会社へ行きます。", reading: "でんしゃ", choices: ["でんしゃ", "てんしゃ", "でんじゃ", "てんじゃ"], translation: "My father goes to the office by train.", explanation: "電車 is read でんしゃ." },
  { id: "n5-5", level: "N5", before: "明日の", target: "天気", after: "はどうですか。", reading: "てんき", choices: ["てんき", "でんき", "ていき", "てんぎ"], translation: "How is tomorrow's weather?", explanation: "天気 is read てんき." },
  { id: "n5-6", level: "N5", before: "母は", target: "病院", after: "で働いています。", reading: "びょういん", choices: ["びょういん", "びょいん", "びょうえん", "びょうにん"], translation: "My mother works at a hospital.", explanation: "病院 is read びょういん." },
  { id: "n5-7", level: "N5", before: "冷たい", target: "飲み物", after: "がほしいです。", reading: "のみもの", choices: ["のみもの", "のむもの", "のみもん", "のもの"], translation: "I want a cold drink.", explanation: "飲み物 is read のみもの." },
  { id: "n5-8", level: "N5", before: "先生に", target: "手紙", after: "を渡しました。", reading: "てがみ", choices: ["てがみ", "しゅがみ", "てかみ", "てがも"], translation: "I handed a letter to the teacher.", explanation: "手紙 is read てがみ." },
  { id: "n5-9", level: "N5", before: "この", target: "問題", after: "は少し難しいです。", reading: "もんだい", choices: ["もんだい", "もだい", "もんたい", "もんだ"], translation: "This question is a little difficult.", explanation: "問題 is read もんだい." },
  { id: "n5-10", level: "N5", before: "駅の前で", target: "友達", after: "に会いました。", reading: "ともだち", choices: ["ともだち", "ともたち", "ともだじ", "ともたじ"], translation: "I met my friend in front of the station.", explanation: "友達 is read ともだち." },
  { id: "n4-1", level: "N4", before: "午後三時から", target: "会議", after: "があります。", reading: "かいぎ", choices: ["かいぎ", "かいき", "がいぎ", "かえぎ"], translation: "There is a meeting from 3 p.m.", explanation: "会議 is read かいぎ." },
  { id: "n4-2", level: "N4", before: "レストランを", target: "予約", after: "しました。", reading: "よやく", choices: ["よやく", "よょく", "よかく", "ようやく"], translation: "I made a reservation at the restaurant.", explanation: "予約 is read よやく." },
  { id: "n4-3", level: "N4", before: "旅行の", target: "準備", after: "をしています。", reading: "じゅんび", choices: ["じゅんび", "じゅび", "じゅんぴ", "じゅんみ"], translation: "I am preparing for the trip.", explanation: "準備 is read じゅんび." },
  { id: "n4-4", level: "N4", before: "兄は車の", target: "運転", after: "が上手です。", reading: "うんてん", choices: ["うんてん", "うてん", "うんでん", "うんで"], translation: "My older brother is good at driving.", explanation: "運転 is read うんてん." },
  { id: "n4-5", level: "N4", before: "日本の", target: "文化", after: "に興味があります。", reading: "ぶんか", choices: ["ぶんか", "ぶんが", "ぶんこ", "ぶんけ"], translation: "I am interested in Japanese culture.", explanation: "文化 is read ぶんか." },
  { id: "n4-6", level: "N4", before: "あの人は営業部の", target: "部長", after: "です。", reading: "ぶちょう", choices: ["ぶちょう", "へちょう", "ぶしょう", "ぶじょう"], translation: "That person is the department manager of sales.", explanation: "部長 is read ぶちょう." },
  { id: "n4-7", level: "N4", before: "一階の", target: "受付", after: "で名前を書いてください。", reading: "うけつけ", choices: ["うけつけ", "うけづけ", "うけつげ", "うけつき"], translation: "Please write your name at the reception on the first floor.", explanation: "受付 is read うけつけ." },
  { id: "n4-8", level: "N4", before: "先生の", target: "説明", after: "はとても分かりやすいです。", reading: "せつめい", choices: ["せつめい", "せつみょう", "ぜつめい", "せつまい"], translation: "The teacher's explanation is very easy to understand.", explanation: "説明 is read せつめい." },
  { id: "n4-9", level: "N4", before: "薬を飲んだので、もう", target: "安心", after: "です。", reading: "あんしん", choices: ["あんしん", "あんじん", "あしん", "あんせん"], translation: "I took the medicine, so I feel relieved now.", explanation: "安心 is read あんしん." },
  { id: "n4-10", level: "N4", before: "来年、大学を", target: "卒業", after: "します。", reading: "そつぎょう", choices: ["そつぎょう", "そっぎょう", "そつきょう", "そつぎょ"], translation: "I will graduate from university next year.", explanation: "卒業 is read そつぎょう." },
];