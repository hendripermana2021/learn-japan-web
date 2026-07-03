import { GrammarQuestion } from "@/data/grammar-questions";
import { useMemo, useRef, useState } from "react";


type Language = "en" | "id";

type PuzzleTokenSource = "bank" | "slot";

type PuzzleDropTarget =
  | { kind: "slot"; index: number }
  | { kind: "bank" };

type SelectedPuzzleToken = {
  source: PuzzleTokenSource;
  index: number;
  token: string;
};

type ActivePuzzleDrag = SelectedPuzzleToken & {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  hasMoved: boolean;
  overTarget: PuzzleDropTarget | null;
};


export function GrammarPuzzle({
  question,
  questionIndex,
  onSolved,
  language,
}: {
    
  question: GrammarQuestion;
  questionIndex: number;
  onSolved: (questionId: string) => void;
  language: Language;
}) {
  const solution = useMemo(() => getPuzzleSolution(question), [question]);
  const [slots, setSlots] = useState<Array<string | null>>(
    Array.from({ length: solution.length }, () => null),
  );
  const [bank, setBank] = useState<string[]>(buildPuzzleBank(question, questionIndex));
  const [checked, setChecked] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SelectedPuzzleToken | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActivePuzzleDrag | null>(null);
  const activeDragRef = useRef<ActivePuzzleDrag | null>(null);
  const suppressTokenClickRef = useRef(false);

  const allSlotsFilled = slots.length === solution.length && slots.every((part) => part !== null);
  const isCorrect = checked && allSlotsFilled && slots.every((part, index) => part === solution[index]);

  function getToken(source: PuzzleTokenSource, index: number) {
    if (source === "bank") {
      return bank[index] ?? null;
    }

    return slots[index] ?? null;
  }

  function getDropTargetFromPoint(clientX: number, clientY: number): PuzzleDropTarget | null {
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const target = element?.closest("[data-drop-target]") as HTMLElement | null;

    if (!target) {
      return null;
    }

    if (target.dataset.dropTarget === "bank") {
      return { kind: "bank" };
    }

    const index = Number(target.dataset.slotIndex);
    if (Number.isNaN(index)) {
      return null;
    }

    return { kind: "slot", index };
  }

  function setDragState(nextDrag: ActivePuzzleDrag | null) {
    activeDragRef.current = nextDrag;
    setActiveDrag(nextDrag);
  }

  function toggleSelectedToken(source: PuzzleTokenSource, index: number) {
    if (suppressTokenClickRef.current) {
      suppressTokenClickRef.current = false;
      return;
    }

    const token = getToken(source, index);
    if (!token) {
      return;
    }

    setSelectedToken((current) => {
      if (current && current.source === source && current.index === index) {
        return null;
      }

      return { source, index, token };
    });
  }

  function moveToken(source: PuzzleTokenSource, index: number, target: PuzzleDropTarget) {
    if (target.kind === "bank") {
      if (source !== "slot") {
        return;
      }

      const token = slots[index];
      if (!token) {
        return;
      }

      const nextSlots = [...slots];
      nextSlots[index] = null;
      setSlots(nextSlots);
      setBank((current) => [...current, token]);
      setChecked(false);
      return;
    }

    if (source === "bank") {
      const token = bank[index];
      if (!token) {
        return;
      }

      const nextBank = [...bank];
      nextBank.splice(index, 1);

      const nextSlots = [...slots];
      const displaced = nextSlots[target.index];
      nextSlots[target.index] = token;

      if (displaced) {
        nextBank.push(displaced);
      }

      setBank(nextBank);
      setSlots(nextSlots);
      setChecked(false);
      return;
    }

    const token = slots[index];
    if (!token) {
      return;
    }

    if (index === target.index) {
      return;
    }

    const nextSlots = [...slots];
    const displaced = nextSlots[target.index];
    nextSlots[target.index] = token;
    nextSlots[index] = displaced ?? null;
    setSlots(nextSlots);
    setChecked(false);
  }

  function startPointerDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    source: PuzzleTokenSource,
    index: number,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const token = getToken(source, index);
    if (!token) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedToken(null);

    const nextDrag = {
      source,
      index,
      token,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      hasMoved: false,
      overTarget: getDropTargetFromPoint(event.clientX, event.clientY),
    } satisfies ActivePuzzleDrag;

    setDragState(nextDrag);
  }

  function updatePointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    setActiveDrag((current) => {
      if (!current || current.pointerId !== event.pointerId) {
        return current;
      }

      const moved =
        current.hasMoved ||
        Math.abs(event.clientX - current.startX) > 6 ||
        Math.abs(event.clientY - current.startY) > 6;

      const nextDrag = {
        ...current,
        x: event.clientX,
        y: event.clientY,
        hasMoved: moved,
        overTarget: getDropTargetFromPoint(event.clientX, event.clientY),
      };

      activeDragRef.current = nextDrag;
      return nextDrag;
    });
  }

  function endPointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const currentDrag = activeDragRef.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const dropTarget = getDropTargetFromPoint(event.clientX, event.clientY);
    const shouldMove = currentDrag.hasMoved && dropTarget !== null;

    if (shouldMove && dropTarget) {
      suppressTokenClickRef.current = true;
      moveToken(currentDrag.source, currentDrag.index, dropTarget);
      setSelectedToken(null);
    }

    setDragState(null);
  }

  function cancelPointerDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const currentDrag = activeDragRef.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragState(null);
  }

  function placeSelectedToken(target: PuzzleDropTarget) {
    if (!selectedToken) {
      return;
    }

    moveToken(selectedToken.source, selectedToken.index, target);
    setSelectedToken(null);
  }

  function checkStructure() {
    if (!allSlotsFilled) {
      return;
    }

    const allCorrect = slots.every((part, index) => part === solution[index]);
    setChecked(true);
    if (allCorrect) {
      onSolved(question.id);
    }
  }

  function resetPuzzle() {
    setSlots(Array.from({ length: solution.length }, () => null));
    setBank(buildPuzzleBank(question, questionIndex));
    setChecked(false);
    setSelectedToken(null);
    setDragState(null);
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-(--ink-soft)">
        {language === "id"
          ? "Seret potongan kata, atau tap satu kata lalu tap slot tujuan. Setelah selesai, cek strukturnya."
          : "Drag the word pieces, or tap one word then tap the target slot. Once done, check the structure."}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {slots.map((part, slotIndex) => {
          const slotCorrect = part !== null && part === solution[slotIndex];
          const slotHovered =
            activeDrag?.overTarget?.kind === "slot" && activeDrag.overTarget.index === slotIndex;
          const slotSelected =
            selectedToken?.source === "slot" && selectedToken.index === slotIndex;
          const slotState = checked
            ? slotCorrect
              ? "border-emerald-600 bg-emerald-100"
              : part
                ? "border-rose-600 bg-rose-100"
                : "border-(--border-strong) bg-(--surface-panel)"
              : "border-(--border-strong) bg-(--surface-panel)";

          return (
            <div
              key={`slot-${slotIndex}`}
              data-drop-target="slot"
              data-slot-index={slotIndex}
              onClick={() => placeSelectedToken({ kind: "slot", index: slotIndex })}
              className={`min-h-12 rounded-xl border px-3 py-3 text-sm text-foreground transition-all duration-200 ease-out ${slotState} ${slotHovered ? "-translate-y-0.5 border-(--brand) shadow-[0_16px_32px_-24px_rgba(21,115,71,0.9)]" : ""} ${slotSelected ? "ring-2 ring-(--brand)/30" : ""}`}
            >
              {part ? (
                <button
                  type="button"
                  onClick={() => toggleSelectedToken("slot", slotIndex)}
                  onPointerDown={(event) => startPointerDrag(event, "slot", slotIndex)}
                  onPointerMove={updatePointerDrag}
                  onPointerUp={endPointerDrag}
                  onPointerCancel={cancelPointerDrag}
                  className={`touch-none select-none rounded-md bg-(--surface-panel-tint) px-2 py-1 font-medium transition-all duration-200 ease-out ${
                    activeDrag?.source === "slot" && activeDrag.index === slotIndex
                      ? "scale-95 opacity-35"
                      : "cursor-grab shadow-[0_8px_20px_-18px_rgba(0,0,0,0.85)] active:scale-95"
                  } ${slotSelected ? "ring-2 ring-(--brand)/30" : ""}`}
                >
                  {part}
                </button>
              ) : (
                <span className="text-(--ink-soft) transition-colors duration-200">
                  {language === "id" ? "Taruh di sini" : "Drop here"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        data-drop-target="bank"
        onClick={() => placeSelectedToken({ kind: "bank" })}
        className={`rounded-xl border border-dashed border-(--foreground)/25 bg-(--surface-panel-soft) p-3 transition-all duration-200 ease-out ${activeDrag?.overTarget?.kind === "bank" ? "border-(--brand) shadow-[0_16px_32px_-24px_rgba(21,115,71,0.9)]" : ""}`}
      >
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-(--ink-soft) uppercase">
          {language === "id" ? "Bank Kata" : "Word Bank"}
        </p>
        {bank.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {bank.map((piece, pieceIndex) => {
              const pieceSelected =
                selectedToken?.source === "bank" && selectedToken.index === pieceIndex;

              return (
                <button
                  key={`piece-${piece}-${pieceIndex}`}
                  type="button"
                  onClick={() => toggleSelectedToken("bank", pieceIndex)}
                  onPointerDown={(event) => startPointerDrag(event, "bank", pieceIndex)}
                  onPointerMove={updatePointerDrag}
                  onPointerUp={endPointerDrag}
                  onPointerCancel={cancelPointerDrag}
                  className={`touch-none select-none rounded-lg border border-(--border-strong) bg-(--surface-panel-strong) px-2 py-1 text-sm text-foreground transition-all duration-200 ease-out ${
                    activeDrag?.source === "bank" && activeDrag.index === pieceIndex
                      ? "scale-95 opacity-35"
                      : "cursor-grab shadow-[0_10px_24px_-20px_rgba(0,0,0,0.9)] hover:-translate-y-0.5 active:scale-95"
                  } ${pieceSelected ? "ring-2 ring-(--brand)/30 border-(--brand)/40" : ""}`}
                >
                  {piece}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-(--ink-soft)">
            {language === "id" ? "Semua potongan sudah dipakai." : "All pieces have been used."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={checkStructure}
          disabled={!allSlotsFilled}
          className="rounded-lg border border-(--foreground)/20 px-3 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {language === "id" ? "Cek Struktur" : "Check Structure"}
        </button>
        <button
          type="button"
          onClick={resetPuzzle}
          className="rounded-lg border border-(--foreground)/20 px-3 py-1 text-sm text-foreground"
        >
          {language === "id" ? "Reset Puzzle" : "Reset Puzzle"}
        </button>
      </div>

      {checked ? (
        <div className="mt-4 rounded-xl border border-(--border-subtle) bg-(--surface-panel-tint) px-3 py-3 text-sm text-(--ink-soft)">
          <p className="font-semibold text-foreground">
            {isCorrect
              ? language === "id"
                ? "Struktur benar. Bagus!"
                : "Correct structure. Nice work!"
              : language === "id"
                ? "Masih ada urutan yang salah. Coba perbaiki potongan merah."
                : "Some parts are still out of order. Fix the red pieces."}
          </p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      ) : null}

      {activeDrag ? (
        <div
          className="pointer-events-none fixed top-0 left-0 z-50"
          style={{
            transform: `translate(${activeDrag.x - 18}px, ${activeDrag.y - 18}px)`,
          }}
        >
          <div className="rounded-lg border border-(--brand)/30 bg-(--surface-panel-strong) px-3 py-2 text-sm font-semibold text-foreground shadow-[0_18px_40px_-20px_rgba(0,0,0,0.85)] opacity-95">
            {activeDrag.token}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getPuzzleSolution(question: GrammarQuestion) {
  return question.puzzle
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function buildPuzzleBank(question: GrammarQuestion, questionIndex: number) {
  const parts = [...getPuzzleSolution(question)];
  if (parts.length <= 1) {
    return parts;
  }

  const rotateBy = questionIndex % parts.length;
  const rotated = parts.slice(rotateBy).concat(parts.slice(0, rotateBy));
  return questionIndex % 2 === 0 ? rotated : rotated.reverse();
}