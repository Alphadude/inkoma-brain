import { PDFParse } from 'pdf-parse';
import ApiError from '../utils/ApiError';

export interface ExtractedChapter {
  chapterNumber: number;
  title: string;
  summary: string;
  content: string;
  wordCount: number;
  estimatedReadTime: number;
}

export interface ParsedPdfManuscript {
  detectedTitle: string;
  totalChapters: number;
  totalWordCount: number;
  estimatedTotalReadTime: number;
  detectedPreamble?: string;
  chapters: ExtractedChapter[];
}

/**
 * Regex matching standard chapter headings, act/parts, and named prologues/epilogues.
 */
const CHAPTER_HEADER_REGEX =
  /(?:^|\n)[ \t]*(?:((?:CHAPTER|Chapter|ACT|Act|PART|Part)\s+([0-9IVXLCDM]+|[A-Za-z]+)(?:[ \t]*[:\-–—][ \t]*|\s*\n\s*|[ \t]+)?([^\n]{0,100})?)|((?:PROLOGUE|Prologue|EPILOGUE|Epilogue|PREFACE|Preface|INTRODUCTION|Introduction|INTERLUDE|Interlude)(?:[ \t]*[:\-–—][ \t]*|\s*\n\s*|[ \t]+)?([^\n]{0,100})?))/g;

/**
 * Cleans extracted PDF raw text of page footer artifacts, line feeds, and excessive whitespace.
 */
const cleanRawText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/\n\s*--\s*\d+\s+of\s+\d+\s*--\s*\n/gi, '\n\n') // standard pdf-parse page joiners
    .replace(/\n\s*\d+\s*\n/g, '\n\n'); // standalone page number lines
};

/**
 * Extracts a concise summary from the beginning of chapter content.
 */
const generateSummary = (content: string, maxLen = 300): string => {
  const paragraphs = content
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const firstPara = paragraphs[0] || content.trim();
  if (firstPara.length <= maxLen) {
    return firstPara;
  }

  const truncated = firstPara.substring(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 50 ? truncated.substring(0, lastSpace) : truncated) + '...';
};

/**
 * Infers a clean title for the manuscript from metadata, preamble, or filename.
 */
const inferTitle = (
  metadataTitle: string | undefined,
  preamble: string,
  originalFilename?: string
): string => {
  if (
    metadataTitle &&
    metadataTitle.trim().length > 2 &&
    !metadataTitle.toLowerCase().includes('untitled') &&
    !metadataTitle.toLowerCase().endsWith('.doc') &&
    !metadataTitle.toLowerCase().endsWith('.docx')
  ) {
    return metadataTitle.trim().slice(0, 120);
  }

  // Check the first prominent lines of preamble
  if (preamble) {
    const lines = preamble
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2 && l.length < 100);

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        !lower.startsWith('by ') &&
        !lower.startsWith('copyright') &&
        !lower.startsWith('all rights') &&
        !lower.startsWith('table of contents') &&
        !lower.startsWith('isbn')
      ) {
        return line.slice(0, 120);
      }
    }
  }

  // Fallback to filename
  if (originalFilename) {
    const cleanName = originalFilename
      .replace(/\.pdf$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (cleanName.length > 0) {
      return cleanName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .slice(0, 120);
    }
  }

  return 'Untitled Manuscript';
};

/**
 * Fallback chunker when no explicit chapter headings are detected.
 * Chunks paragraphs into chapters of ~1,800 to 2,500 words.
 */
const fallbackWordCountChunking = (text: string): ExtractedChapter[] => {
  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chapters: ExtractedChapter[] = [];
  let currentParagraphs: string[] = [];
  let currentWords = 0;
  let chapterIndex = 1;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).length;
    currentParagraphs.push(para);
    currentWords += words;

    if (currentWords >= 1800) {
      const content = currentParagraphs.join('\n\n');
      const chapWordCount = currentWords;
      chapters.push({
        chapterNumber: chapterIndex,
        title: `Chapter ${chapterIndex}`,
        summary: generateSummary(content),
        content,
        wordCount: chapWordCount,
        estimatedReadTime: Math.max(1, Math.ceil(chapWordCount / 200)),
      });

      chapterIndex++;
      currentParagraphs = [];
      currentWords = 0;
    }
  }

  if (currentParagraphs.length > 0) {
    const content = currentParagraphs.join('\n\n');
    const chapWordCount = currentWords;
    chapters.push({
      chapterNumber: chapterIndex,
      title: `Chapter ${chapterIndex}`,
      summary: generateSummary(content),
      content,
      wordCount: chapWordCount,
      estimatedReadTime: Math.max(1, Math.ceil(chapWordCount / 200)),
    });
  }

  return chapters;
};

/**
 * Core service to parse and structure a PDF book manuscript into chapters.
 */
export const parsePdfManuscript = async (
  buffer: Buffer,
  originalFilename?: string
): Promise<ParsedPdfManuscript> => {
  const parser = new PDFParse({ data: buffer });
  let textResult;
  let infoResult;

  try {
    textResult = await parser.getText();
    infoResult = await parser.getInfo();
  } catch (err: any) {
    throw new ApiError(400, `Failed to parse PDF document: ${err.message || 'Corrupt or invalid PDF'}`);
  } finally {
    await parser.destroy();
  }

  const rawText = textResult?.text || '';
  const cleanedText = cleanRawText(rawText);

  if (cleanedText.trim().length < 50) {
    throw new ApiError(
      400,
      'Unable to extract text from the uploaded PDF. The file may be a scanned image without an OCR text layer or password protected.'
    );
  }

  // Scan for chapter headings
  const matches: { index: number; fullMatch: string; rawHeading: string }[] = [];
  let match: RegExpExecArray | null;
  CHAPTER_HEADER_REGEX.lastIndex = 0;

  while ((match = CHAPTER_HEADER_REGEX.exec(cleanedText)) !== null) {
    matches.push({
      index: match.index,
      fullMatch: match[0],
      rawHeading: match[0].trim(),
    });
  }

  const preamble = matches.length > 0 ? cleanedText.slice(0, matches[0].index).trim() : '';
  const detectedTitle = inferTitle(
    infoResult?.info?.Title as string | undefined,
    preamble,
    originalFilename
  );

  let chapters: ExtractedChapter[] = [];

  // If chapter headings were found
  if (matches.length >= 1) {
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i]!;
      const startIndex = currentMatch.index + currentMatch.fullMatch.length;
      const endIndex = i + 1 < matches.length ? matches[i + 1]!.index : cleanedText.length;

      const rawChapterContent = cleanedText.slice(startIndex, endIndex).trim();
      const cleanHeading = currentMatch.rawHeading.replace(/\s+/g, ' ').slice(0, 120);

      // Chapter title normalization
      let chapterTitle = cleanHeading;
      if (!chapterTitle || chapterTitle.length < 2) {
        chapterTitle = `Chapter ${i + 1}`;
      }

      const wordCount = rawChapterContent ? rawChapterContent.split(/\s+/).length : 0;
      const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

      chapters.push({
        chapterNumber: i + 1,
        title: chapterTitle,
        summary: generateSummary(rawChapterContent),
        content: rawChapterContent,
        wordCount,
        estimatedReadTime,
      });
    }

    // Filter out empty ghost chapters if any
    chapters = chapters.filter((c) => c.content.length > 0);
  }

  // If no chapters were recognized or only 1 match occurred in a very large text, apply fallback chunking
  if (chapters.length === 0 || (chapters.length === 1 && chapters[0]!.wordCount > 3000)) {
    chapters = fallbackWordCountChunking(cleanedText);
  }

  const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const estimatedTotalReadTime = chapters.reduce((sum, ch) => sum + ch.estimatedReadTime, 0);

  return {
    detectedTitle,
    totalChapters: chapters.length,
    totalWordCount,
    estimatedTotalReadTime,
    detectedPreamble: preamble || undefined,
    chapters,
  };
};
