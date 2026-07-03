import { useEffect, useRef, useState } from "react";
import { writingCharacters, WritingScript, WritingStat, WritingText } from "./types";
import { EmptyDeckState } from "@/components/Cards/EmptyDeckState";

export function WritingPractice({
  script,
  text,
  writingStats,
  onEvaluate,
  onPass,
}: {
  script: WritingScript;
  text: WritingText;
  writingStats: Record<string, WritingStat>;
  onEvaluate: (characterKey: string, similarity: number, passed: boolean) => void;
  onPass: () => void;
}) {
  const size = 260;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [targetIndex, setTargetIndex] = useState(0);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [passedCurrent, setPassedCurrent] = useState(false);
  const [guideVisible, setGuideVisible] = useState(true);

  const characters = writingCharacters[script] ?? [];
  const target = characters[targetIndex] ?? "";
  const targetKey = `${script}::${target}`;
  const targetStats = target ? writingStats[targetKey] : undefined;

  function getNextIndex(current: number, length: number) {
    if (length <= 1) {
      return 0;
    }

    let next = current;
    while (next === current) {
      next = Math.floor(Math.random() * length);
    }
    return next;
  }

  function getCanvasContext(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    return context;
  }

  function prepareCanvas(canvas: HTMLCanvasElement) {
    setupWritingCanvas(canvas, size);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    prepareCanvas(canvas);
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setSimilarity(null);
    setFeedback("");
    setPassedCurrent(false);
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function drawLine(from: { x: number; y: number }, to: { x: number; y: number }) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = getCanvasContext(canvas);
    if (!context) {
      return;
    }

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = point;
    setSimilarity(null);
    setFeedback("");
    setPassedCurrent(false);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !lastPointRef.current) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    drawLine(lastPointRef.current, point);
    lastPointRef.current = point;
  }

  function endDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function buildTemplateCanvas(character: string, baseCanvas: HTMLCanvasElement) {
    const templateCanvas = document.createElement("canvas");
    templateCanvas.width = baseCanvas.width;
    templateCanvas.height = baseCanvas.height;

    const context = templateCanvas.getContext("2d");
    if (!context) {
      return null;
    }

    const dpr = baseCanvas.width / size;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#111111";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "170px 'Noto Sans JP', 'Yu Gothic UI', 'Yu Gothic', sans-serif";
    context.fillText(character, size / 2, size / 2 + 6);

    return templateCanvas;
  }

  function getDarkMask(imageData: ImageData) {
    const mask = new Uint8Array(imageData.width * imageData.height);

    for (let index = 0; index < mask.length; index += 1) {
      const pixelIndex = index * 4;
      const darkness = imageData.data[pixelIndex] + imageData.data[pixelIndex + 1] + imageData.data[pixelIndex + 2];
      mask[index] = darkness < 700 ? 1 : 0;
    }

    return mask;
  }

  function getMaskBounds(mask: Uint8Array, width: number, height: number) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (mask[y * width + x] === 0) {
          continue;
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  function normalizeCanvasToMask(sourceCanvas: HTMLCanvasElement, comparisonSize = 72, padding = 8) {
    const sourceContext = sourceCanvas.getContext("2d");
    if (!sourceContext) {
      return null;
    }

    const sourceImage = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const sourceMask = getDarkMask(sourceImage);
    const bounds = getMaskBounds(sourceMask, sourceImage.width, sourceImage.height);

    if (!bounds) {
      return null;
    }

    const normalizedCanvas = document.createElement("canvas");
    normalizedCanvas.width = comparisonSize;
    normalizedCanvas.height = comparisonSize;
    const normalizedContext = normalizedCanvas.getContext("2d");
    if (!normalizedContext) {
      return null;
    }

    normalizedContext.fillStyle = "#ffffff";
    normalizedContext.fillRect(0, 0, comparisonSize, comparisonSize);

    const availableSize = comparisonSize - padding * 2;
    const scale = Math.min(availableSize / bounds.width, availableSize / bounds.height);
    const targetWidth = bounds.width * scale;
    const targetHeight = bounds.height * scale;
    const offsetX = (comparisonSize - targetWidth) / 2;
    const offsetY = (comparisonSize - targetHeight) / 2;

    normalizedContext.imageSmoothingEnabled = true;
    normalizedContext.drawImage(
      sourceCanvas,
      bounds.minX,
      bounds.minY,
      bounds.width,
      bounds.height,
      offsetX,
      offsetY,
      targetWidth,
      targetHeight,
    );

    const normalizedImage = normalizedContext.getImageData(0, 0, comparisonSize, comparisonSize);
    return {
      mask: getDarkMask(normalizedImage),
      width: comparisonSize,
      height: comparisonSize,
    };
  }

  function countMaskPixels(mask: Uint8Array) {
    let count = 0;

    for (const value of mask) {
      count += value;
    }

    return count;
  }

  function countMaskMatches(
    sourceMask: Uint8Array,
    targetMask: Uint8Array,
    width: number,
    height: number,
    tolerance: number,
  ) {
    let matches = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (sourceMask[y * width + x] === 0) {
          continue;
        }

        let found = false;
        for (let searchY = Math.max(0, y - tolerance); searchY <= Math.min(height - 1, y + tolerance) && !found; searchY += 1) {
          for (let searchX = Math.max(0, x - tolerance); searchX <= Math.min(width - 1, x + tolerance); searchX += 1) {
            if (targetMask[searchY * width + searchX] === 1) {
              found = true;
              break;
            }
          }
        }

        if (found) {
          matches += 1;
        }
      }
    }

    return matches;
  }

  function countMaskIntersection(sourceMask: Uint8Array, targetMask: Uint8Array) {
    let intersection = 0;

    for (let index = 0; index < sourceMask.length; index += 1) {
      if (sourceMask[index] === 1 && targetMask[index] === 1) {
        intersection += 1;
      }
    }

    return intersection;
  }

  
function setupWritingCanvas(canvas: HTMLCanvasElement, size: number) {
  const dpr = typeof window === "undefined" ? 1 : Math.max(window.devicePixelRatio || 1, 1);
  const internalSize = Math.floor(size * dpr);
  canvas.width = internalSize;
  canvas.height = internalSize;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#111111";
  context.lineWidth = 10;
}

  function evaluateDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || !target) {
      return;
    }

    const userContext = getCanvasContext(canvas);
    if (!userContext) {
      return;
    }

    const templateCanvas = buildTemplateCanvas(target, canvas);
    if (!templateCanvas) {
      return;
    }

    const templateContext = templateCanvas.getContext("2d");
    if (!templateContext) {
      return;
    }

    const normalizedUser = normalizeCanvasToMask(canvas);
    const normalizedTemplate = normalizeCanvasToMask(templateCanvas);

    if (!normalizedUser || !normalizedTemplate) {
      setSimilarity(0);
      setFeedback(text.writingRetry);
      onEvaluate(targetKey, 0, false);
      return;
    }

    const userInk = countMaskPixels(normalizedUser.mask);
    const templateInk = countMaskPixels(normalizedTemplate.mask);
    const tolerantIntersection = countMaskMatches(
      normalizedUser.mask,
      normalizedTemplate.mask,
      normalizedUser.width,
      normalizedUser.height,
      2,
    );
    const tolerantRecallIntersection = countMaskMatches(
      normalizedTemplate.mask,
      normalizedUser.mask,
      normalizedUser.width,
      normalizedUser.height,
      2,
    );
    const strictIntersection = countMaskIntersection(normalizedUser.mask, normalizedTemplate.mask);

    if (userInk < 80 || templateInk === 0) {
      setSimilarity(0);
      setFeedback(text.writingRetry);
      onEvaluate(targetKey, 0, false);
      return;
    }

    const precision = tolerantIntersection / userInk;
    const recall = tolerantRecallIntersection / templateInk;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const ratio = userInk / templateInk;
    const sizeFactor = ratio < 0.55 ? ratio / 0.55 : ratio > 1.8 ? 1.8 / ratio : 1;
    const iou = strictIntersection / Math.max(userInk + templateInk - strictIntersection, 1);
    const score = Math.max(0, Math.min(1, (f1 * 0.72 + iou * 0.28) * sizeFactor));
    const isPass = score >= 0.5 && recall >= 0.44;

    setSimilarity(score);
    setFeedback(isPass ? text.writingPass : text.writingRetry);
    onEvaluate(targetKey, score, isPass);

    if (isPass && !passedCurrent) {
      onPass();
      setPassedCurrent(true);
    }
  }

  function nextCharacter() {
    const weakCandidates = characters
      .map((character, index) => {
        const stat = writingStats[`${script}::${character}`];
        const accuracy = stat ? stat.passes / Math.max(stat.attempts, 1) : 0;

        return {
          character,
          index,
          attempts: stat?.attempts ?? 0,
          accuracy,
        };
      })
      .sort((left, right) => {
        if (left.accuracy !== right.accuracy) {
          return left.accuracy - right.accuracy;
        }

        if (right.attempts !== left.attempts) {
          return right.attempts - left.attempts;
        }

        return left.index - right.index;
      });

    const focusPool = weakCandidates.slice(0, Math.max(3, Math.ceil(weakCandidates.length * 0.4)));
    const alternativePool = focusPool.filter((entry) => entry.index !== targetIndex);

    if (alternativePool.length > 0) {
      const next = alternativePool[Math.floor(Math.random() * alternativePool.length)];
      setTargetIndex(next.index);
    } else {
      setTargetIndex((current) => getNextIndex(current, characters.length));
    }

    clearCanvas();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    prepareCanvas(canvas);
  }, [prepareCanvas]);

  if (characters.length === 0) {
    return <EmptyDeckState title={text.noMatchingCards} message={text.noWritingMatches} />;
  }

  return (
    <div>
      <p className="mb-3 text-sm text-(--ink-soft)">{text.writingInstruction}</p>
      <div className="mb-3 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-(--brand)/20 bg-(--brand-soft) px-3 py-4 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-(--brand) uppercase">{text.writingTarget}</p>
          <p className="mt-2 text-6xl leading-none font-semibold text-foreground">{target}</p>
          {targetStats ? (
            <p className="mt-3 text-xs text-(--ink-soft)">
              {Math.round((targetStats.passes / Math.max(targetStats.attempts, 1)) * 100)}% {text.writingAccuracy}
            </p>
          ) : null}
        </div>
        <div className="relative w-fit overflow-hidden rounded-2xl">
          {guideVisible ? (
            <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(21,115,71,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,115,71,0.12)_1px,transparent_1px)] bg-size-[24px_24px]" />
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-(--brand)/20" />
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-(--brand)/20" />
              <div className="absolute inset-0 flex items-center justify-center text-[170px] font-semibold text-(--brand)/12">
                {target}
              </div>
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrawing}
            onPointerCancel={endDrawing}
            className="relative z-20 touch-none rounded-2xl border-2 border-(--border-strong) bg-white shadow-[0_20px_40px_-30px_rgba(0,0,0,0.75)]"
          />
        </div>
      </div>

      <p className="mb-3 text-xs text-(--ink-soft)">{text.writingHint}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGuideVisible((current) => !current)}
          className="rounded-lg border border-(--foreground)/20 px-3 py-1 text-sm text-foreground"
        >
          {text.writingGuide}: {guideVisible ? "On" : "Off"}
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-lg border border-(--foreground)/20 px-3 py-1 text-sm text-foreground"
        >
          {text.writingClear}
        </button>
        <button
          type="button"
          onClick={evaluateDrawing}
          className="rounded-lg bg-(--interactive-bg) px-3 py-1 text-sm font-semibold text-(--interactive-foreground) transition hover:brightness-110"
        >
          {text.writingCheck}
        </button>
        <button
          type="button"
          onClick={nextCharacter}
          disabled={similarity === null}
          className="rounded-lg border border-(--foreground)/20 px-3 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text.writingNext}
        </button>
      </div>

      {similarity !== null ? (
        <div className="mt-3 rounded-xl border border-(--border-subtle) bg-(--surface-panel-tint) px-3 py-3 text-sm text-(--ink-soft)">
          <p className="font-semibold text-foreground">
            {text.writingSimilarity}: {Math.round(similarity * 100)}%
          </p>
          <p className="mt-1">{feedback}</p>
        </div>
      ) : null}
    </div>
  );
}
