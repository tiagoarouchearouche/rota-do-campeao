"use client";

import { useState } from "react";
import { buildWhatsAppShareUrl } from "@/lib/shareState";

type ShareButtonsProps = {
  shareUrl: string;
  teamName: string;
  competitionName: string;
  summaryLines: string[];
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const wrapped: string[] = [];
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      wrapped.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) wrapped.push(line);
  return wrapped;
}

function downloadSummaryImage(teamName: string, competitionName: string, lines: string[]) {
  const width = 800;
  const padding = 40;
  const contentWidth = width - padding * 2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // First measurement pass to size the canvas to the wrapped content.
  ctx.font = "17px sans-serif";
  const [impactLine, ...bodyLines] = lines;
  const wrappedImpact = impactLine ? wrapLines(ctx, impactLine, contentWidth - 32) : [];
  const wrappedBody = bodyLines.flatMap((line) => wrapLines(ctx, line, contentWidth));

  const impactBoxHeight = wrappedImpact.length * 26 + 32;
  const height = 200 + impactBoxHeight + wrappedBody.length * 26 + 60;
  canvas.width = width;
  canvas.height = height;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#064e3b");
  gradient.addColorStop(1, "#022c22");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Brand pill
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(padding, 28, 210, 34);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("🏆 Rota do Campeão", padding + 14, 51);

  // Team + competition
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(teamName, padding, 130);
  ctx.fillStyle = "#a7f3d0";
  ctx.font = "18px sans-serif";
  ctx.fillText(competitionName, padding, 160);

  let cursorY = 200;

  if (wrappedImpact.length > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(padding, cursorY, contentWidth, impactBoxHeight);
    ctx.fillStyle = "#34d399";
    ctx.fillRect(padding, cursorY, 4, impactBoxHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    wrappedImpact.forEach((line, index) => {
      ctx.fillText(line, padding + 20, cursorY + 30 + index * 26);
    });
    cursorY += impactBoxHeight + 20;
  }

  ctx.fillStyle = "#e5e7eb";
  ctx.font = "16px sans-serif";
  wrappedBody.forEach((line, index) => {
    ctx.fillText(line, padding, cursorY + index * 26);
  });
  cursorY += wrappedBody.length * 26 + 30;

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(padding, cursorY);
  ctx.lineTo(width - padding, cursorY);
  ctx.stroke();

  ctx.fillStyle = "#a7f3d0";
  ctx.font = "13px sans-serif";
  const generatedAt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  ctx.fillText(`Simulado em ${generatedAt} · Rota do Campeão`, padding, cursorY + 26);

  const link = document.createElement("a");
  link.download = "rota-do-campeao.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function ShareButtons({ shareUrl, teamName, competitionName, summaryLines }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (permissão negada, contexto não seguro) — usuário pode copiar o link manualmente
    }
  }

  const whatsappUrl = buildWhatsAppShareUrl(
    shareUrl,
    `Veja a rota do ${teamName} na ${competitionName} no Rota do Campeão:`
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        🔗 {copied ? "Link copiado!" : "Copiar link"}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        💬 WhatsApp
      </a>
      <button
        type="button"
        onClick={() => downloadSummaryImage(teamName, competitionName, summaryLines)}
        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        🖼️ Baixar imagem
      </button>
    </div>
  );
}
