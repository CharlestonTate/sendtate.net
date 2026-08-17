#!/usr/bin/env node
// Compresses/resizes everything in /images (used directly by index.html) into /images-optimized.
// Run this after adding or replacing a photo in /images: node scripts/build-images.js
'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', 'images');
const outDir = path.join(__dirname, '..', 'images-optimized');
const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

fs.mkdirSync(outDir, { recursive: true });

const files = fs.existsSync(imagesDir)
  ? fs.readdirSync(imagesDir).filter((file) => extensions.has(path.extname(file).toLowerCase()))
  : [];

async function run() {
  for (const file of files) {
    const srcPath = path.join(imagesDir, file);
    const outName = path.parse(file).name + '.webp';
    const outPath = path.join(outDir, outName);

    try {
      await sharp(srcPath)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(outPath);
      console.log(`Optimized ${file} -> images-optimized/${outName}`);
    } catch (err) {
      console.warn(`Could not optimize ${file}: ${err.message}`);
    }
  }
}

run();
