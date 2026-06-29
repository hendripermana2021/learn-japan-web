"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { kanjiLibrary } from "@/data/kanji-library";

type Language = "en" | "id";

const SETTINGS_KEY = "learn-japan-settings-v1";

const copy = {
  en: {
    title: "Kanji Study Lab",
    subtitle: "Learn readings, words, and examples, then practice writing each kanji.",
    backHome: "Back Home",
    pickKanji: "Pick Kanji",
    meaning: "Meaning",
    kunyomi: "Kunyomi",
    onyomi: "Onyomi",
    words: "Words with this kanji",
    examples: "Example sentences",
    writingTitle: "Kanji Writing Practice",
    writingHint: "Draw the same kanji in the canvas, then check similarity.",
    target: "Target",
    guide: "Guide",
    undo: "Undo",
    redo: "Redo",
    clear: "Clear",
    check: "Check Similarity",
    similarity: "Similarity",
    good: "Great shape. Keep going.",
    retry: "Try again. Match stroke balance and proportion.",
    nextKanji: "Next Kanji",
    previousKanji: "Previous Kanji",
    level: "Level",
    allLevels: "All",
    n5: "N5",
    n4: "N4",
    strokeOrder: "Stroke Order",
    playStrokeOrder: "Play",
    replayStrokeOrder: "Replay",
    stopStrokeOrder: "Stop",
    orderHint: "Watch and repeat the stroke order before writing.",
    speed: "Speed",
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
    stepMode: "Step Mode",
    nextStroke: "Next Stroke",
    currentStroke: "Stroke",
    detailedStroke: "Current Stroke (Detailed)",
    on: "On",
    off: "Off",
  },
  id: {
    title: "Lab Belajar Kanji",
    subtitle: "Pelajari bacaan, kosakata, dan contoh, lalu latihan menulis kanji.",
    backHome: "Kembali",
    pickKanji: "Pilih Kanji",
    meaning: "Arti",
    kunyomi: "Kunyomi",
    onyomi: "Onyomi",
    words: "Kata dengan kanji ini",
    examples: "Contoh kalimat",
    writingTitle: "Latihan Menulis Kanji",
    writingHint: "Gambar kanji yang sama di canvas, lalu cek kemiripan.",
    target: "Target",
    guide: "Panduan",
    undo: "Undo",
    redo: "Redo",
    clear: "Hapus",
    check: "Cek Kemiripan",
    similarity: "Kemiripan",
    good: "Bentuknya bagus. Lanjutkan.",
    retry: "Coba lagi. Samakan proporsi dan keseimbangan goresan.",
    nextKanji: "Kanji Berikutnya",
    previousKanji: "Kanji Sebelumnya",
    level: "Level",
    allLevels: "Semua",
    n5: "N5",
    n4: "N4",
    strokeOrder: "Urutan Goresan",
    playStrokeOrder: "Putar",
    replayStrokeOrder: "Ulang",
    stopStrokeOrder: "Hentikan",
    orderHint: "Lihat urutan goresan dulu sebelum menulis.",
    speed: "Kecepatan",
    slow: "Lambat",
    normal: "Normal",
    fast: "Cepat",
    stepMode: "Mode Langkah",
    nextStroke: "Langkah Berikutnya",
    currentStroke: "Goresan",
    detailedStroke: "Goresan Saat Ini (Detail)",
    on: "Nyala",
    off: "Mati",
  },
} as const;

function renderWritingGuideCanvas(
  canvas: HTMLCanvasElement,
  size: number,
  kanjiCharacter: string,
) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const dpr = typeof window === "undefined" ? 1 : Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  context.clearRect(0, 0, size, size);
  drawCenteredGuideKanji(context, size, kanjiCharacter, "rgba(21,115,71,0.16)");
}

function drawCenteredGuideKanji(
  context: CanvasRenderingContext2D,
  size: number,
  kanjiCharacter: string,
  color: string,
) {
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "600 180px 'Noto Sans JP', 'Yu Gothic UI', 'Yu Gothic', sans-serif";
  context.fillText(kanjiCharacter, size / 2, size / 2 + 6);
}

function setupCanvas(canvas: HTMLCanvasElement, size: number) {
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
  context.strokeStyle = "#111111";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 12;
}

function getDarkMask(imageData: ImageData) {
  const mask = new Uint8Array(imageData.width * imageData.height);

  for (let index = 0; index < mask.length; index += 1) {
    const pixelIndex = index * 4;
    const darkness =
      imageData.data[pixelIndex] + imageData.data[pixelIndex + 1] + imageData.data[pixelIndex + 2];
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
      for (
        let searchY = Math.max(0, y - tolerance);
        searchY <= Math.min(height - 1, y + tolerance) && !found;
        searchY += 1
      ) {
        for (
          let searchX = Math.max(0, x - tolerance);
          searchX <= Math.min(width - 1, x + tolerance);
          searchX += 1
        ) {
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

function getMaskCentroid(mask: Uint8Array, width: number) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index] === 0) {
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    sumX += x;
    sumY += y;
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return {
    x: sumX / count,
    y: sumY / count,
  };
}

function estimateAverageNearestDistance(
  sourceMask: Uint8Array,
  targetMask: Uint8Array,
  width: number,
  height: number,
  maxRadius: number,
) {
  let totalDistance = 0;
  let countedPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (sourceMask[y * width + x] === 0) {
        continue;
      }

      countedPixels += 1;
      if (targetMask[y * width + x] === 1) {
        continue;
      }

      let nearest = maxRadius;
      let found = false;

      for (let radius = 1; radius <= maxRadius; radius += 1) {
        const minX = Math.max(0, x - radius);
        const maxX = Math.min(width - 1, x + radius);
        const minY = Math.max(0, y - radius);
        const maxY = Math.min(height - 1, y + radius);

        for (let searchY = minY; searchY <= maxY; searchY += 1) {
          for (let searchX = minX; searchX <= maxX; searchX += 1) {
            if (targetMask[searchY * width + searchX] === 0) {
              continue;
            }

            const distance = Math.hypot(searchX - x, searchY - y);
            if (distance <= radius) {
              nearest = Math.min(nearest, distance);
              found = true;
            }
          }
        }

        if (found) {
          break;
        }
      }

      totalDistance += nearest;
    }
  }

  if (countedPixels === 0) {
    return 0;
  }

  return totalDistance / countedPixels;
}

function shiftMask(
  mask: Uint8Array,
  width: number,
  height: number,
  shiftX: number,
  shiftY: number,
) {
  const shifted = new Uint8Array(mask.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = y * width + x;
      if (mask[sourceIndex] === 0) {
        continue;
      }

      const targetX = x + shiftX;
      const targetY = y + shiftY;
      if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) {
        continue;
      }

      shifted[targetY * width + targetX] = 1;
    }
  }

  return shifted;
}

export default function KanjiPage() {
  const [language, setLanguage] = useState<Language>("id");
  const [levelFilter, setLevelFilter] = useState<"all" | "N5" | "N4">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [guideVisible, setGuideVisible] = useState(true);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);

  const size = 280;
  const text = copy[language];
  const filteredKanji = useMemo(() => {
    if (levelFilter === "all") {
      return kanjiLibrary;
    }

    return kanjiLibrary.filter((item) => item.jlptLevel === levelFilter);
  }, [levelFilter]);
  const safeIndex = Math.min(selectedIndex, Math.max(filteredKanji.length - 1, 0));
  const entry = filteredKanji[safeIndex] ?? kanjiLibrary[0];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const rawSettings = localStorage.getItem(SETTINGS_KEY);
        if (!rawSettings) {
          return;
        }

        const parsed = JSON.parse(rawSettings) as { language?: Language };
        if (parsed.language === "en" || parsed.language === "id") {
          setLanguage(parsed.language);
        }
      } catch {
        // Ignore malformed local settings.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setupCanvas(canvas, size);
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [snapshot];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, [safeIndex]);

  useEffect(() => {
    if (!guideVisible) {
      return;
    }

    const guideCanvas = guideCanvasRef.current;
    if (!guideCanvas || !entry) {
      return;
    }

    renderWritingGuideCanvas(guideCanvas, size, entry.kanji);
  }, [entry, size, guideVisible]);

  function clearDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setupCanvas(canvas, size);
    const context = canvas.getContext("2d");
    if (context) {
      const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [snapshot];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
    setSimilarity(null);
    setFeedback("");
  }

  function updateHistoryState() {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current >= 0 && historyIndexRef.current < historyRef.current.length - 1);
  }

  function pushCanvasHistorySnapshot() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(snapshot);
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    updateHistoryState();
  }

  function restoreHistorySnapshot(index: number) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const snapshot = historyRef.current[index];
    if (!snapshot) {
      return;
    }

    context.putImageData(snapshot, 0, 0);
    historyIndexRef.current = index;
    updateHistoryState();
    setSimilarity(null);
    setFeedback("");
  }

  function undoDrawing() {
    if (historyIndexRef.current <= 0) {
      return;
    }

    restoreHistorySnapshot(historyIndexRef.current - 1);
  }

  function redoDrawing() {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }

    restoreHistorySnapshot(historyIndexRef.current + 1);
  }

  function pickKanji(index: number) {
    setSelectedIndex(index);
    setSimilarity(null);
    setFeedback("");
  }

  function updateLevelFilter(filter: "all" | "N5" | "N4") {
    setLevelFilter(filter);
    setSelectedIndex(0);
    setSimilarity(null);
    setFeedback("");
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

    const context = canvas.getContext("2d");
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
    const wasDrawing = isDrawingRef.current;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;

    if (wasDrawing) {
      pushCanvasHistorySnapshot();
    }
  }

  function evaluateDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || !entry) {
      return;
    }

    const templateCanvas = document.createElement("canvas");
    templateCanvas.width = canvas.width;
    templateCanvas.height = canvas.height;

    const templateContext = templateCanvas.getContext("2d");
    if (!templateContext) {
      return;
    }

    const dpr = canvas.width / size;
    templateContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    templateContext.fillStyle = "#ffffff";
    templateContext.fillRect(0, 0, size, size);
    drawCenteredGuideKanji(templateContext, size, entry.kanji, "#111111");

    const normalizedUser = normalizeCanvasToMask(canvas);
    const normalizedTemplate = normalizeCanvasToMask(templateCanvas);

    if (!normalizedUser || !normalizedTemplate) {
      setSimilarity(0);
      setFeedback(text.retry);
      return;
    }

    const userInk = countMaskPixels(normalizedUser.mask);
    const templateInk = countMaskPixels(normalizedTemplate.mask);

    if (userInk < 80 || templateInk === 0) {
      setSimilarity(0);
      setFeedback(text.retry);
      return;
    }

    const ratio = userInk / templateInk;
    const sizeFactor = ratio < 0.45 ? ratio / 0.45 : ratio > 2.2 ? 2.2 / ratio : 1;

    const userCentroid = getMaskCentroid(normalizedUser.mask, normalizedUser.width);
    const templateCentroid = getMaskCentroid(normalizedTemplate.mask, normalizedTemplate.width);

    const scoreCandidate = (candidateMask: Uint8Array, centroidDistance: number) => {
      const tolerantIntersection = countMaskMatches(
        candidateMask,
        normalizedTemplate.mask,
        normalizedUser.width,
        normalizedUser.height,
        3,
      );
      const tolerantRecallIntersection = countMaskMatches(
        normalizedTemplate.mask,
        candidateMask,
        normalizedUser.width,
        normalizedUser.height,
        3,
      );
      const strictIntersection = countMaskIntersection(candidateMask, normalizedTemplate.mask);

      const precision = tolerantIntersection / userInk;
      const recall = tolerantRecallIntersection / templateInk;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
      const iou = strictIntersection / Math.max(userInk + templateInk - strictIntersection, 1);

      const overflowInk = Math.max(0, userInk - tolerantIntersection);
      const overflowRate = overflowInk / Math.max(userInk, 1);
      const overflowFactor = Math.max(0.78, 1 - overflowRate * 0.45);

      const avgDistance = estimateAverageNearestDistance(
        candidateMask,
        normalizedTemplate.mask,
        normalizedUser.width,
        normalizedUser.height,
        10,
      );
      const distanceFactor = Math.max(0, Math.min(1, 1 - avgDistance / 6.2));

      const centroidFactor = Math.max(0.82, Math.min(1, 1 - centroidDistance / 24));
      const shapeScore = f1 * 0.46 + iou * 0.24 + recall * 0.2 + precision * 0.1;
      const combinedScore = shapeScore * 0.68 + distanceFactor * 0.32;
      const consistencyBoost = precision >= 0.62 && recall >= 0.62 ? 1.08 : 1;
      const score = Math.max(
        0,
        Math.min(1, combinedScore * sizeFactor * centroidFactor * overflowFactor * consistencyBoost),
      );

      return { score, precision, recall };
    };

    const rawCentroidDistance =
      userCentroid && templateCentroid
        ? Math.hypot(userCentroid.x - templateCentroid.x, userCentroid.y - templateCentroid.y)
        : 0;
    const baseCandidate = scoreCandidate(normalizedUser.mask, rawCentroidDistance);

    let alignedCandidate = baseCandidate;
    if (userCentroid && templateCentroid) {
      const shiftX = Math.round(templateCentroid.x - userCentroid.x);
      const shiftY = Math.round(templateCentroid.y - userCentroid.y);
      if (shiftX !== 0 || shiftY !== 0) {
        const alignedMask = shiftMask(
          normalizedUser.mask,
          normalizedUser.width,
          normalizedUser.height,
          shiftX,
          shiftY,
        );
        alignedCandidate = scoreCandidate(alignedMask, 0);
      }
    }

    const best = alignedCandidate.score > baseCandidate.score ? alignedCandidate : baseCandidate;
    const score = best.score;
    const isPass = score >= 0.48 && best.recall >= 0.4 && best.precision >= 0.38;

    setSimilarity(score);
    setFeedback(isPass ? text.good : text.retry);
  }

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8">
      <header className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">{text.title}</h1>
            <p className="mt-2 text-sm text-(--ink-soft)">{text.subtitle}</p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[var(--brand)]/30 bg-(--surface-panel) px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--brand)] uppercase"
          >
            {text.backHome}
          </Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">{text.pickKanji}</h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-(--ink-soft)">{text.level}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateLevelFilter("all")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${levelFilter === "all" ? "border-[var(--brand)] bg-(--brand-soft) text-[var(--brand)]" : "border-[var(--border-subtle)] text-(--ink-soft)"}`}
            >
              {text.allLevels}
            </button>
            <button
              type="button"
              onClick={() => updateLevelFilter("N5")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${levelFilter === "N5" ? "border-[var(--brand)] bg-(--brand-soft) text-[var(--brand)]" : "border-[var(--border-subtle)] text-(--ink-soft)"}`}
            >
              {text.n5}
            </button>
            <button
              type="button"
              onClick={() => updateLevelFilter("N4")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${levelFilter === "N4" ? "border-[var(--brand)] bg-(--brand-soft) text-[var(--brand)]" : "border-[var(--border-subtle)] text-(--ink-soft)"}`}
            >
              {text.n4}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
            {filteredKanji.map((item, index) => {
              const selected = index === safeIndex;
              return (
                <button
                  key={item.kanji}
                  type="button"
                  onClick={() => pickKanji(index)}
                  className={`rounded-xl border px-3 py-2 text-2xl font-semibold transition ${selected ? "border-[var(--brand)] bg-(--brand-soft) text-[var(--brand)]" : "border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] text-foreground"}`}
                >
                  {item.kanji}
                </button>
              );
            })}
          </div>
        </aside>

        <article className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--paper)] p-4 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.5)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-6xl font-semibold text-foreground">{entry.kanji}</p>
              <p className="mt-2 text-sm text-(--ink-soft)">{text.meaning}: {entry.meaning}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pickKanji((safeIndex - 1 + filteredKanji.length) % filteredKanji.length)}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-foreground"
              >
                {text.previousKanji}
              </button>
              <button
                type="button"
                onClick={() => pickKanji((safeIndex + 1) % filteredKanji.length)}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-foreground"
              >
                {text.nextKanji}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.kunyomi}</p>
              <p className="mt-2 text-sm text-foreground">{entry.kunyomi.join(" / ")}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.onyomi}</p>
              <p className="mt-2 text-sm text-foreground">{entry.onyomi.join(" / ")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.words}</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {entry.words.map((word) => (
                  <li key={`${entry.kanji}-${word.word}`} className="rounded-xl bg-(--surface-panel) px-3 py-2">
                    <p className="font-semibold">{word.word} ({word.reading})</p>
                    <p className="text-(--ink-soft)">{word.meaning}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.examples}</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {entry.examples.map((example) => (
                  <li key={`${entry.kanji}-${example.japanese}`} className="rounded-xl bg-(--surface-panel) px-3 py-2">
                    <p className="font-medium">{example.japanese}</p>
                    <p className="text-(--ink-soft)">{example.translation}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-soft)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{text.writingTitle}</p>
            <p className="mt-2 text-sm text-(--ink-soft)">{text.writingHint}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-(--brand)/20 bg-(--brand-soft) px-3 py-4 text-center">
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--brand)] uppercase">{text.target}</p>
                <p className="mt-2 text-6xl font-semibold text-foreground">{entry.kanji}</p>
              </div>

              <div className="relative w-fit overflow-hidden rounded-2xl">
                {guideVisible ? (
                  <div className="pointer-events-none absolute inset-0 z-30 rounded-2xl">
                    <canvas ref={guideCanvasRef} className="absolute inset-0 block h-full w-full" />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setGuideVisible((current) => !current)}
                  className="absolute right-2 top-2 z-40 rounded-md border border-[var(--foreground)]/20 bg-white/90 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm"
                >
                  {text.guide}: {guideVisible ? text.on : text.off}
                </button>

                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrawing}
                  onPointerCancel={endDrawing}
                  className="relative z-20 touch-none rounded-2xl border-2 border-[var(--border-strong)] bg-white shadow-[0_20px_40px_-30px_rgba(0,0,0,0.75)]"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={undoDrawing}
                disabled={!canUndo}
                aria-label={text.undo}
                title={text.undo}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-45"
              >
                ↶
              </button>
              <button
                type="button"
                onClick={redoDrawing}
                disabled={!canRedo}
                aria-label={text.redo}
                title={text.redo}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-45"
              >
                ↷
              </button>
              <button
                type="button"
                onClick={clearDrawing}
                className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1 text-sm text-foreground"
              >
                {text.clear}
              </button>
              <button
                type="button"
                onClick={evaluateDrawing}
                className="rounded-lg bg-[var(--interactive-bg)] px-3 py-1 text-sm font-semibold text-[var(--interactive-foreground)] transition hover:brightness-110"
              >
                {text.check}
              </button>
            </div>

            {similarity !== null ? (
              <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel-tint)] px-3 py-3 text-sm text-(--ink-soft)">
                <p className="font-semibold text-foreground">{text.similarity}: {Math.round(similarity * 100)}%</p>
                <p className="mt-1">{feedback}</p>
              </div>
            ) : null}
          </section>
        </article>
      </section>
    </main>
  );
}
