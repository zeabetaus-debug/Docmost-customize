import { toPng } from "html-to-image";

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

export async function exportDiagramAsPng(
  container: HTMLElement,
  filename: string,
) {
  const dataUrl = await toPng(container, {
    cacheBust: true,
    backgroundColor: "#1f1f1f",
    pixelRatio: 2,
  });

  triggerDownload(dataUrl, filename);
}

export function exportDiagramAsSvg(container: HTMLElement, filename: string) {
  const svgElement = container.querySelector("svg");
  if (!svgElement) {
    throw new Error("No SVG diagram available to export.");
  }

  const svgMarkup = svgElement.outerHTML;
  const blob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  try {
    triggerDownload(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}
