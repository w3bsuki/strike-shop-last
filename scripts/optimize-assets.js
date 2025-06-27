#!/usr/bin/env node

/**
 * Asset Optimization Script for Strike Shop
 * Optimizes images, implements lazy loading, and generates responsive variants
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const IMAGE_DIR = path.join(__dirname, '..', 'public', 'images');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'optimized');

// Image size variants for responsive loading
const IMAGE_SIZES = [
  { width: 480, suffix: '480w' },
  { width: 768, suffix: '768w' },
  { width: 1280, suffix: '1280w' },
  { width: 1920, suffix: '1920w' }
];

// Placeholder size for blur-up effect
const PLACEHOLDER_SIZE = 64;

async function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  const hasSharp = await checkPackage('sharp');
  if (!hasSharp) {
    console.log('Installing sharp for image optimization...');
    try {
      execSync('npm install --no-save sharp', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to install sharp:', error.message);
      return false;
    }
  }
  
  return true;
}

async function checkPackage(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

async function optimizeImages() {
  const sharp = require('sharp');
  
  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Get all image files
  const files = await fs.readdir(IMAGE_DIR);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.includes('optimized')
  );
  
  const results = [];
  
  for (const file of imageFiles) {
    console.log(`\n🖼️  Processing ${file}...`);
    
    const inputPath = path.join(IMAGE_DIR, file);
    const basename = path.basename(file, path.extname(file));
    
    try {
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;
      
      console.log(`  Original size: ${(originalSize / 1024).toFixed(2)} KB`);
      
      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      
      // Generate WebP versions for each size
      const webpPromises = IMAGE_SIZES.map(async (size) => {
        if (metadata.width >= size.width) {
          const outputPath = path.join(OUTPUT_DIR, `${basename}-${size.suffix}.webp`);
          
          await sharp(inputPath)
            .resize(size.width, null, {
              withoutEnlargement: true,
              fit: 'inside'
            })
            .webp({ quality: 85 })
            .toFile(outputPath);
          
          const stats = await fs.stat(outputPath);
          return { size: size.suffix, format: 'webp', fileSize: stats.size };
        }
        return null;
      });
      
      // Generate AVIF versions (even better compression)
      const avifPromises = IMAGE_SIZES.map(async (size) => {
        if (metadata.width >= size.width) {
          const outputPath = path.join(OUTPUT_DIR, `${basename}-${size.suffix}.avif`);
          
          try {
            await sharp(inputPath)
              .resize(size.width, null, {
                withoutEnlargement: true,
                fit: 'inside'
              })
              .avif({ quality: 80 })
              .toFile(outputPath);
            
            const stats = await fs.stat(outputPath);
            return { size: size.suffix, format: 'avif', fileSize: stats.size };
          } catch (error) {
            // AVIF might not be supported in all environments
            console.log(`  ⚠️  AVIF not supported, skipping...`);
            return null;
          }
        }
        return null;
      });
      
      // Generate placeholder for blur-up effect
      const placeholderPath = path.join(OUTPUT_DIR, `${basename}-placeholder.webp`);
      const placeholderBuffer = await sharp(inputPath)
        .resize(PLACEHOLDER_SIZE, PLACEHOLDER_SIZE, {
          fit: 'inside'
        })
        .webp({ quality: 20 })
        .toBuffer();
      
      await fs.writeFile(placeholderPath, placeholderBuffer);
      
      // Convert placeholder to base64
      const placeholderBase64 = `data:image/webp;base64,${placeholderBuffer.toString('base64')}`;
      
      // Wait for all conversions
      const webpResults = (await Promise.all(webpPromises)).filter(Boolean);
      const avifResults = (await Promise.all(avifPromises)).filter(Boolean);
      
      // Calculate total savings
      const totalOptimizedSize = [...webpResults, ...avifResults]
        .reduce((sum, r) => sum + r.fileSize, 0);
      const avgOptimizedSize = totalOptimizedSize / (webpResults.length + avifResults.length);
      const reduction = ((originalSize - avgOptimizedSize) / originalSize * 100).toFixed(1);
      
      console.log(`  ✅ Average optimized size: ${(avgOptimizedSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
      
      results.push({
        file,
        originalSize,
        optimizedVariants: [...webpResults, ...avifResults],
        placeholderBase64,
        reduction: `${reduction}%`
      });
      
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
      results.push({
        file,
        error: error.message
      });
    }
  }
  
  // Generate image component
  await generateImageComponent(results);
  
  // Generate report
  await generateReport(results);
  
  console.log('\n✨ Asset optimization complete!');
}

async function generateImageComponent(results) {
  const componentContent = `/**
 * Optimized Image Component for Strike Shop
 * Auto-generated - DO NOT EDIT
 */

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

// Image data with optimized variants
export const imageData = ${JSON.stringify(
  results.reduce((acc, result) => {
    if (!result.error) {
      acc[result.file] = {
        placeholder: result.placeholderBase64,
        variants: result.optimizedVariants
      };
    }
    return acc;
  }, {}),
  null,
  2
)};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageInfo = imageData[src.split('/').pop() || ''];
  
  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!imageInfo) return undefined;
    
    const webpVariants = imageInfo.variants
      .filter(v => v.format === 'webp')
      .map(v => \`/images/optimized/\${src.split('/').pop()?.replace(/\\.[^.]+$/, '')}-\${v.size}.webp \${v.size.replace('w', '')}\`)
      .join(', ');
    
    return webpVariants || undefined;
  };
  
  return (
    <div className={\`relative \${className}\`}>
      {/* Blur placeholder */}
      {imageInfo && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-lg scale-110"
          style={{
            backgroundImage: \`url(\${imageInfo.placeholder})\`
          }}
        />
      )}
      
      {/* Main image */}
      <Image
        src={src}
        alt={alt}
        width={width || 1920}
        height={height || 1080}
        priority={priority}
        sizes={sizes}
        className={\`\${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300\`}
        onLoadingComplete={() => setIsLoaded(true)}
        placeholder={imageInfo ? 'blur' : 'empty'}
        blurDataURL={imageInfo?.placeholder}
      />
    </div>
  );
}

// Export preload function for critical images
export function preloadCriticalImages(images: string[]) {
  if (typeof window === 'undefined') return;
  
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.type = 'image/webp';
    document.head.appendChild(link);
  });
}
`;

  const componentPath = path.join(__dirname, '..', 'components', 'ui', 'optimized-image-generated.tsx');
  await fs.writeFile(componentPath, componentContent);
  console.log(`\n✅ Generated optimized image component`);
}

async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    results: results.map(r => ({
      file: r.file,
      originalSize: r.originalSize,
      reduction: r.reduction,
      variants: r.optimizedVariants?.length || 0,
      error: r.error
    })),
    totalFiles: results.length,
    successfulOptimizations: results.filter(r => !r.error).length,
    totalOriginalSize: results
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.originalSize, 0),
    recommendations: [
      'Use the OptimizedImage component instead of next/image directly',
      'Implement lazy loading for below-the-fold images',
      'Consider using CDN for image delivery',
      'Add loading="lazy" attribute to non-critical images',
      'Use appropriate sizes attribute for responsive images'
    ]
  };
  
  const reportPath = path.join(__dirname, '..', 'asset-optimization-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Optimization Summary:');
  console.log(`  Total images processed: ${report.totalFiles}`);
  console.log(`  Successful optimizations: ${report.successfulOptimizations}`);
  console.log(`  Total original size: ${(report.totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n  Report saved to: ${reportPath}`);
}

// Run the optimization
(async () => {
  const depsReady = await checkDependencies();
  if (depsReady) {
    await optimizeImages();
  }
})();