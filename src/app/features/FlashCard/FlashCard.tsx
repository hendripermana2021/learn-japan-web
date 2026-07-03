// import { RATINGS } from "@/app/CONSTANTS";
// import { EmptyDeckState } from "@/components/Cards/EmptyDeckState";
// import { VocabularyCard } from "@/data/jlpt-n5";

// interface ReviewCardProps {
//   activeCard: VocabularyCard | null;
//   safeCardIndex: number;
//   filteredCards: VocabularyCard[];

//   showMeaning: boolean;
//   favorites: string[];

//   text: FlashcardText;
//   language: Language;
//   categoryLabels: typeof categoryLabels;
//   ratingLabels: typeof ratingLabels;

//   cardFlashClass?: string;

//   toggleFavorite: (card: VocabularyCard) => void;
//   getCardId: (card: VocabularyCard) => string;
//   rateCard: (rating: Rating) => void;
// }

// export function ReviewCard({
//   activeCard,
//   safeCardIndex,
//   filteredCards,
//   showMeaning,
//   favorites,
//   text,
//   language,
//   categoryLabels,
//   ratingLabels,
//   cardFlashClass,
//   toggleFavorite,
//   getCardId,
//   rateCard,
// }: ReviewCardProps) {
//   return (
//     <article
//       className={`rounded-3xl border border-(--border-subtle) bg-(--paper) p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6 ${cardFlashClass}`}
//     >
//       <div className="mb-4 flex items-center justify-between">
//         <h2 className="text-xl font-semibold text-foreground">
//           {text.reviewTitle}
//         </h2>

//         <p className="text-xl text-(--ink-soft)">
//           {text.card} {safeCardIndex + 1}/{filteredCards.length}
//         </p>
//       </div>

//       {activeCard ? (
//         <>
//           <div className="mb-4 flex justify-end">
//             <button
//               type="button"
//               onClick={() => toggleFavorite(activeCard)}
//               className="rounded-full border border-(--border-strong) bg-(--surface-panel) px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
//             >
//               {favorites.includes(getCardId(activeCard))
//                 ? text.unfavorite
//                 : text.favorite}
//             </button>
//           </div>

//           <FlashcardContent
//             card={activeCard}
//             language={language}
//             showMeaning={showMeaning}
//             categoryLabels={categoryLabels}
//             text={text}
//           />

//           <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
//             {RATINGS.map((rating) => (
//               <button
//                 key={rating}
//                 type="button"
//                 onClick={() => rateCard(rating)}
//                 className="rounded-xl bg-(--interactive-bg) px-3 py-2 text-sm font-semibold text-(--interactive-foreground) transition hover:brightness-110"
//               >
//                 {ratingLabels[language][rating]}
//               </button>
//             ))}
//           </div>
//         </>
//       ) : (
//         <EmptyDeckState
//           title={text.noMatchingCards}
//           message={text.noReviewMatches}
//         />
//       )}
//     </article>
//   );
// }