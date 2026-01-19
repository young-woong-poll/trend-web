#!/usr/bin/env node
/**
 * 통합 이미지 최적화 스크립트
 * 지정된 경로의 이미지를 최적화합니다.
 *
 * 사용법:
 *   pnpm optimize <경로>
 *   pnpm optimize public/og-image1.png
 *   pnpm optimize public/images
 *   pnpm optimize (기본값: public)
 *
 * WebP 변환:
 *   pnpm optimize <경로> --webp
 *   pnpm optimize public/hero.png --webp (hero.webp 생성)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
  imageExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  // 일반 이미지 설정
  general: {
    maxWidth: 1920,
    jpegQuality: 85,
    pngCompressionLevel: 9,
    webpQuality: 85,
  },
  // OG 이미지 설정
  og: {
    width: 1200,
    height: 630,
    qualityOptions: [80, 75, 70, 65, 60],
    targetSize: 300 * 1024, // 300KB
  },
  excludePaths: ['mockServiceWorker.js'],
};

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 이미지 파일인지 확인
 */
function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONFIG.imageExtensions.includes(ext);
}

/**
 * 제외 대상인지 확인
 */
function shouldExclude(filePath) {
  return CONFIG.excludePaths.some((exclude) => filePath.includes(exclude));
}

/**
 * OG 이미지인지 확인 (파일명 기반)
 */
function isOGImage(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename.toLowerCase().includes('og-');
}

/**
 * OG 이미지 최적화
 */
async function optimizeOGImage(filePath) {
  console.log('🎯 OG 이미지로 감지됨 - 특수 최적화 적용\n');

  const originalStats = fs.statSync(filePath);
  const originalSize = originalStats.size;
  const ext = path.extname(filePath);
  const outputPath = filePath.replace(ext, '.jpg');

  console.log(`📏 원본 크기: ${formatBytes(originalSize)}`);
  console.log(
    `🎯 목표: ${CONFIG.og.width}x${CONFIG.og.height}, ${formatBytes(CONFIG.og.targetSize)} 이하\n`
  );

  // 여러 품질로 압축 시도
  const results = [];
  for (const quality of CONFIG.og.qualityOptions) {
    const tempPath = outputPath.replace('.jpg', `-q${quality}.jpg`);

    await sharp(filePath)
      .resize(CONFIG.og.width, CONFIG.og.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      })
      .toFile(tempPath);

    const stats = fs.statSync(tempPath);
    results.push({ path: tempPath, size: stats.size, quality });
  }

  // 목표 크기 이하인 최고 품질 선택
  const bestResult = results
    .filter((r) => r.size <= CONFIG.og.targetSize)
    .sort((a, b) => b.quality - a.quality)[0];

  if (bestResult) {
    fs.copyFileSync(bestResult.path, outputPath);
    results.forEach((r) => fs.unlinkSync(r.path));

    const savedBytes = originalSize - bestResult.size;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

    console.log(`  ✅ 최적화 성공!`);
    console.log(`  📦 품질: ${bestResult.quality}%`);
    console.log(`  📏 크기: ${formatBytes(bestResult.size)}`);
    console.log(`  💾 절약: ${formatBytes(savedBytes)} (${savedPercent}% 감소)`);
    console.log(`  📁 저장: ${path.relative(process.cwd(), outputPath)}\n`);

    if (ext !== '.jpg') {
      console.log(`💡 원본 ${ext} 파일을 삭제하고 .jpg를 사용하세요:`);
      console.log(`   rm ${path.relative(process.cwd(), filePath)}`);
      console.log(`   (constants.ts에서 경로도 업데이트)\n`);
    }

    return {
      filePath: outputPath,
      originalSize,
      optimizedSize: bestResult.size,
      savedBytes,
      savedPercent,
    };
  } else {
    // 가장 작은 파일 저장
    const smallestResult = results[results.length - 1];
    fs.copyFileSync(smallestResult.path, outputPath);
    results.forEach((r) => fs.unlinkSync(r.path));

    console.log(`  ⚠️  목표 크기 미달성`);
    console.log(
      `  📦 최소 크기: ${formatBytes(smallestResult.size)} (품질 ${smallestResult.quality}%)`
    );
    console.log(`  📁 저장: ${path.relative(process.cwd(), outputPath)}\n`);

    return null;
  }
}

/**
 * WebP로 변환
 */
async function convertToWebP(filePath, convertWebP) {
  if (!isImageFile(filePath) || shouldExclude(filePath)) {
    return null;
  }

  try {
    const ext = path.extname(filePath);
    const originalStats = fs.statSync(filePath);
    const originalSize = originalStats.size;
    const webpPath = filePath.replace(ext, '.webp');

    // 이미지 메타데이터
    const metadata = await sharp(filePath).metadata();
    let sharpInstance = sharp(filePath);

    // 리사이즈
    if (metadata.width && metadata.width > CONFIG.general.maxWidth) {
      sharpInstance = sharpInstance.resize(CONFIG.general.maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // WebP로 변환
    await sharpInstance
      .webp({
        quality: CONFIG.general.webpQuality,
      })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    const webpSize = webpStats.size;
    const savedBytes = originalSize - webpSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

    return {
      filePath: webpPath,
      originalPath: filePath,
      originalSize,
      optimizedSize: webpSize,
      savedBytes,
      savedPercent,
    };
  } catch (error) {
    console.error(`❌ 실패: ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 일반 이미지 최적화
 */
async function optimizeGeneralImage(filePath, convertWebP = false) {
  if (!isImageFile(filePath) || shouldExclude(filePath)) {
    return null;
  }

  // WebP 변환 모드
  if (convertWebP) {
    return convertToWebP(filePath, convertWebP);
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const originalStats = fs.statSync(filePath);
    const originalSize = originalStats.size;
    const tempPath = filePath.replace(ext, `-optimized${ext}`);

    // 이미지 메타데이터
    const metadata = await sharp(filePath).metadata();
    let sharpInstance = sharp(filePath);

    // 리사이즈
    if (metadata.width && metadata.width > CONFIG.general.maxWidth) {
      sharpInstance = sharpInstance.resize(CONFIG.general.maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // 포맷별 압축
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality: CONFIG.general.jpegQuality,
          progressive: true,
          mozjpeg: true,
        });
        break;
      case '.png':
        sharpInstance = sharpInstance.png({
          compressionLevel: CONFIG.general.pngCompressionLevel,
          progressive: true,
        });
        break;
      case '.webp':
        sharpInstance = sharpInstance.webp({
          quality: CONFIG.general.webpQuality,
        });
        break;
    }

    await sharpInstance.toFile(tempPath);

    const optimizedStats = fs.statSync(tempPath);
    const optimizedSize = optimizedStats.size;

    // 최적화된 이미지가 더 작으면 교체
    if (optimizedSize < originalSize) {
      fs.renameSync(tempPath, filePath);
      const savedBytes = originalSize - optimizedSize;
      const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

      return {
        filePath,
        originalSize,
        optimizedSize,
        savedBytes,
        savedPercent,
      };
    } else {
      fs.unlinkSync(tempPath);
      return null;
    }
  } catch (error) {
    console.error(`❌ 실패: ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 디렉토리 재귀 처리
 */
async function processDirectory(dirPath, convertWebP = false) {
  const results = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        const subResults = await processDirectory(fullPath, convertWebP);
        results.push(...subResults);
      } else if (stats.isFile() && isImageFile(fullPath) && !shouldExclude(fullPath)) {
        const result = convertWebP
          ? await convertToWebP(fullPath)
          : isOGImage(fullPath)
            ? await optimizeOGImage(fullPath)
            : await optimizeGeneralImage(fullPath);

        if (result) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`❌ 오류: ${dirPath}:`, error.message);
  }

  return results;
}

/**
 * 단일 파일 처리
 */
async function processSingleFile(filePath, convertWebP = false) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }

  if (!isImageFile(filePath)) {
    console.error(`❌ 이미지 파일이 아닙니다: ${filePath}`);
    console.log('   지원 형식: .jpg, .jpeg, .png, .webp');
    process.exit(1);
  }

  const mode = convertWebP ? 'WebP 변환' : '최적화';
  console.log(`🖼️  이미지 ${mode}: ${path.relative(process.cwd(), filePath)}\n`);

  const result = convertWebP
    ? await convertToWebP(filePath)
    : isOGImage(filePath)
      ? await optimizeOGImage(filePath)
      : await optimizeGeneralImage(filePath);

  if (result) {
    return [result];
  } else {
    console.log('ℹ️  이미 최적화되어 있거나 최적화가 필요하지 않습니다.\n');
    return [];
  }
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const convertWebP = args.includes('--webp');
  const targetPath = args.find((arg) => !arg.startsWith('--')) || 'public';
  const absolutePath = path.resolve(targetPath);

  const mode = convertWebP ? 'WebP 변환' : '최적화';
  console.log(`🖼️  이미지 ${mode} 시작...\n`);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ 경로를 찾을 수 없습니다: ${targetPath}`);
    process.exit(1);
  }

  const startTime = Date.now();
  let results = [];

  const stats = fs.statSync(absolutePath);
  if (stats.isFile()) {
    results = await processSingleFile(absolutePath, convertWebP);
  } else if (stats.isDirectory()) {
    console.log(`📁 대상 폴더: ${path.relative(process.cwd(), absolutePath)}\n`);
    results = await processDirectory(absolutePath, convertWebP);
  }

  // 결과 출력
  console.log(`\n✅ ${mode} 완료!\n`);

  if (results.length === 0) {
    console.log(`ℹ️  ${mode}할 이미지가 없습니다.`);
  } else if (stats.isDirectory()) {
    console.log(`📊 ${mode} 결과:\n`);
    results.forEach(({ filePath, originalPath, originalSize, optimizedSize, savedPercent }) => {
      const relativePath = path.relative(process.cwd(), filePath);
      if (convertWebP && originalPath) {
        const originalRelPath = path.relative(process.cwd(), originalPath);
        console.log(`  ✓ ${originalRelPath} → ${relativePath}`);
      } else {
        console.log(`  ✓ ${relativePath}`);
      }
      console.log(
        `    ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savedPercent}% 감소)`
      );
    });

    const totalSaved = results.reduce((sum, r) => sum + r.savedBytes, 0);
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalPercent = ((totalSaved / totalOriginal) * 100).toFixed(1);

    console.log(`\n📉 총 ${formatBytes(totalSaved)} 절약 (${totalPercent}% 감소)`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  소요 시간: ${duration}초`);
}

// 스크립트 실행
main().catch((error) => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});
