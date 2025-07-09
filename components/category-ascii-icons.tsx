export const asciiIcons: Record<string, string[]> = {
  // T-Shirt
  'T-SHIRTS': [
    '    ___    ',
    '   /   \\   ',
    '  |     |  ',
    '  |     |  ',
    '  |_____|  ',
  ],
  
  // Hoodie
  'HOODIES': [
    '   _____   ',
    '  /     \\  ',
    ' | () () | ',
    ' |   _   | ',
    ' |_______|',
  ],
  
  // Pants/Jeans
  'PANTS': [
    '   |   |   ',
    '   |   |   ',
    '   |   |   ',
    '  /|   |\\  ',
    ' / |   | \\ ',
  ],
  
  'JEANS': [
    '   |   |   ',
    '   |   |   ',
    '   |   |   ',
    '  /|   |\\  ',
    ' / |   | \\ ',
  ],
  
  // Shoes/Sneakers
  'SHOES': [
    '    ____   ',
    '   /    \\_ ',
    '  /      _|',
    ' |______|  ',
    '           ',
  ],
  
  'SNEAKERS': [
    '    ____   ',
    '   /    \\_ ',
    '  /  oo  _|',
    ' |______|  ',
    '           ',
  ],
  
  // Jacket
  'JACKETS': [
    '   /\\_/\\   ',
    '  |     |  ',
    '  |  =  |  ',
    '  |     |  ',
    '  |_____|  ',
  ],
  
  // Dress
  'DRESSES': [
    '    ___    ',
    '   / | \\   ',
    '  |  |  |  ',
    '  |  |  |  ',
    '  \\___/   ',
  ],
  
  // Accessories/Hat
  'ACCESSORIES': [
    '   _____   ',
    '  |_____|  ',
    '     |     ',
    '           ',
    '           ',
  ],
  
  'HATS': [
    '   _____   ',
    '  |_____|  ',
    '     |     ',
    '           ',
    '           ',
  ],
  
  // Bag
  'BAGS': [
    '   ___     ',
    '  /   \\    ',
    ' |  □  |   ',
    ' |     |   ',
    ' |_____|   ',
  ],
  
  // Watch
  'WATCHES': [
    '   ___     ',
    '  [   ]    ',
    '  [( )]    ',
    '  [___]    ',
    '           ',
  ],
  
  // Sunglasses
  'SUNGLASSES': [
    '           ',
    '  ___-___  ',
    ' (o)-(o)   ',
    '           ',
    '           ',
  ],
  
  // Shorts
  'SHORTS': [
    '   |   |   ',
    '   |   |   ',
    '  /|   |\\  ',
    '           ',
    '           ',
  ],
  
  // Skirt
  'SKIRTS': [
    '    ___    ',
    '   |   |   ',
    '  /     \\  ',
    ' /_______\\ ',
    '           ',
  ],
  
  // Default/Sale
  'SALE': [
    '  $$$$$    ',
    ' $     $   ',
    '  $$$$$    ',
    ' $     $   ',
    '  $$$$$    ',
  ],
  
  'NEW': [
    '    ★      ',
    '   ★★★     ',
    '  ★★★★★    ',
    '   ★★★     ',
    '    ★      ',
  ],
  
  // Men/Women/Kids generic
  'MEN': [
    '    O      ',
    '   /|\\     ',
    '    |      ',
    '   / \\     ',
    '  /   \\    ',
  ],
  
  'WOMEN': [
    '    O      ',
    '   /|\\     ',
    '   / \\     ',
    '  /   \\    ',
    ' /     \\   ',
  ],
  
  'KIDS': [
    '    o      ',
    '   /|\\     ',
    '    |      ',
    '   / \\     ',
    '           ',
  ],
  
  // Default fallback
  'DEFAULT': [
    '   ???     ',
    '  ?   ?    ',
    '    ?      ',
    '    .      ',
    '           ',
  ],
};

export function getAsciiIcon(categoryName: string): string[] {
  const upperName = categoryName.toUpperCase();
  
  // Direct match
  if (asciiIcons[upperName]) {
    return asciiIcons[upperName];
  }
  
  // Partial match
  for (const [key, icon] of Object.entries(asciiIcons)) {
    if (upperName.includes(key) || key.includes(upperName)) {
      return icon;
    }
  }
  
  // Category-based fallbacks
  if (upperName.includes('SHIRT')) return asciiIcons['T-SHIRTS'] || [];
  if (upperName.includes('HOOD')) return asciiIcons['HOODIES'] || [];
  if (upperName.includes('PANT') || upperName.includes('TROUSER')) return asciiIcons['PANTS'] || [];
  if (upperName.includes('SHOE') || upperName.includes('BOOT')) return asciiIcons['SHOES'] || [];
  if (upperName.includes('JACK') || upperName.includes('COAT')) return asciiIcons['JACKETS'] || [];
  if (upperName.includes('DRESS')) return asciiIcons['DRESSES'] || [];
  if (upperName.includes('BAG')) return asciiIcons['BAGS'] || [];
  if (upperName.includes('WATCH')) return asciiIcons['WATCHES'] || [];
  if (upperName.includes('SHORT')) return asciiIcons['SHORTS'] || [];
  if (upperName.includes('SKIRT')) return asciiIcons['SKIRTS'] || [];
  if (upperName.includes('GLASS')) return asciiIcons['SUNGLASSES'] || [];
  if (upperName.includes('HAT') || upperName.includes('CAP')) return asciiIcons['HATS'] || [];
  
  return asciiIcons['DEFAULT'] || [];
}

// Component to render ASCII art with proper spacing
export function AsciiIcon({ 
  lines, 
  className = "" 
}: { 
  lines: string[], 
  className?: string 
}) {
  return (
    <pre className={`font-mono text-xs leading-none select-none ${className}`}>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </pre>
  );
}