/**
 * ASCII Art Utilities for Terminal Design System
 * Supports both Latin and Cyrillic characters
 */

// ASCII Box Drawing Characters
export const box = {
  // Single line
  horizontal: '─',
  vertical: '│',
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  cross: '┼',
  teeUp: '┴',
  teeDown: '┬',
  teeLeft: '┤',
  teeRight: '├',
  
  // Double line
  doubleHorizontal: '═',
  doubleVertical: '║',
  doubleTopLeft: '╔',
  doubleTopRight: '╗',
  doubleBottomLeft: '╚',
  doubleBottomRight: '╝',
  
  // Simple ASCII
  simpleHorizontal: '-',
  simpleVertical: '|',
  simpleCorner: '+',
} as const;

// Terminal Symbols
export const terminal = {
  prompt: '$',
  cursor: '█',
  cursorBlink: '▮',
  arrow: '→',
  bulletPoint: '▸',
  checkmark: '✓',
  cross: '✗',
  star: '★',
  emptyStar: '☆',
  heart: '♥',
  emptyHeart: '♡',
} as const;

// Loading Spinners
export const spinners = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  lines: ['|', '/', '-', '\\'],
  simpleDots: ['.', '..', '...'],
  arrows: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  braille: ['⡿', '⣟', '⣯', '⣷', '⣾', '⣽', '⣻', '⢿'],
} as const;

// ASCII Art Borders
export function createBorder(width: number, height: number, style: 'single' | 'double' | 'simple' = 'single'): string[] {
  const b = style === 'double' ? {
    h: box.doubleHorizontal,
    v: box.doubleVertical,
    tl: box.doubleTopLeft,
    tr: box.doubleTopRight,
    bl: box.doubleBottomLeft,
    br: box.doubleBottomRight,
  } : style === 'simple' ? {
    h: box.simpleHorizontal,
    v: box.simpleVertical,
    tl: box.simpleCorner,
    tr: box.simpleCorner,
    bl: box.simpleCorner,
    br: box.simpleCorner,
  } : {
    h: box.horizontal,
    v: box.vertical,
    tl: box.topLeft,
    tr: box.topRight,
    bl: box.bottomLeft,
    br: box.bottomRight,
  };

  const lines: string[] = [];
  
  // Top border
  lines.push(b.tl + b.h.repeat(width - 2) + b.tr);
  
  // Middle lines
  for (let i = 0; i < height - 2; i++) {
    lines.push(b.v + ' '.repeat(width - 2) + b.v);
  }
  
  // Bottom border
  lines.push(b.bl + b.h.repeat(width - 2) + b.br);
  
  return lines;
}

// Create ASCII Title with Border
export function createTitle(text: string, style: 'single' | 'double' | 'simple' = 'single'): string[] {
  const padding = 2;
  const width = text.length + (padding * 2) + 2;
  const border = createBorder(width, 3, style);
  
  // Insert text in the middle line
  const middleLine = border[1];
  const textStart = Math.floor((width - text.length) / 2);
  border[1] = (middleLine || '').substring(0, textStart) + text + (middleLine || '').substring(textStart + text.length);
  
  return border;
}

// ASCII Progress Bar
export function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

// ASCII Loading Animation Frame
export function getLoadingFrame(frame: number, type: keyof typeof spinners = 'lines'): string {
  const spinner = spinners[type];
  return spinner[frame % spinner.length] || '';
}

// Convert text to ASCII art style (simple version)
export function toAsciiStyle(text: string): string {
  // This is a simple version - for true ASCII art text, you'd need a full font map
  return text
    .toUpperCase()
    .split('')
    .map(char => {
      // Add some style to certain characters
      switch (char) {
        case 'A': return '∆';
        case 'O': return '◯';
        case 'I': return '|';
        case 'S': return '§';
        case 'E': return '∃';
        default: return char;
      }
    })
    .join('');
}

// Cyrillic ASCII Art Support
export function createCyrillicBorder(text: string): string[] {
  // Special handling for Cyrillic text in ASCII borders
  const textBytes = new TextEncoder().encode(text);
  const byteLength = textBytes.length;
  const padding = 4;
  const width = Math.max(byteLength + padding, text.length + padding);
  
  return createTitle(text, 'single');
}

// Terminal Commands
export function createCommand(command: string, output?: string[]): string[] {
  const lines: string[] = [`$ ${command}`];
  if (output) {
    lines.push(...output);
  }
  lines.push('$ _');
  return lines;
}

// Matrix Rain Character Generator
export function getMatrixChar(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?';
  const cyrillicChars = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const allChars = chars + cyrillicChars;
  return allChars[Math.floor(Math.random() * allChars.length)] || 'X';
}

// ASCII Table Generator
export function createTable(headers: string[], rows: string[][]): string[] {
  const colWidths = headers.map((h, i) => 
    Math.max(h.length, ...rows.map(r => r[i]?.length || 0))
  );
  
  const lines: string[] = [];
  
  // Top border
  lines.push('┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐');
  
  // Headers
  lines.push('│ ' + headers.map((h, i) => h.padEnd(colWidths[i] || 0)).join(' │ ') + ' │');
  
  // Header separator
  lines.push('├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤');
  
  // Rows
  rows.forEach(row => {
    lines.push('│ ' + row.map((cell, i) => cell.padEnd(colWidths[i] || 0)).join(' │ ') + ' │');
  });
  
  // Bottom border
  lines.push('└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘');
  
  return lines;
}

// ASCII Logo Generator (simple version)
export function createLogo(): string[] {
  return [
    ' ██████╗████████╗██████╗ ██╗██╗  ██╗███████╗',
    '██╔════╝╚══██╔══╝██╔══██╗██║██║ ██╔╝██╔════╝',
    '╚█████╗    ██║   ██████╔╝██║█████═╝ █████╗  ',
    ' ╚═══██╗   ██║   ██╔══██╗██║██╔═██╗ ██╔══╝  ',
    '██████╔╝   ██║   ██║  ██║██║██║ ╚██╗███████╗',
    '╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝',
  ];
}