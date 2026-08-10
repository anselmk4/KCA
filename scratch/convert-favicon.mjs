import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const sourceIcon = path.join(projectRoot, 'public', 'icon.png');
const sourceOg = path.join(projectRoot, 'public', 'og-image.png');

async function convert() {
  try {
    // Convert icon to proper PNG and resize for favicon (32x32)
    await sharp(sourceIcon)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(projectRoot, 'src', 'app', 'favicon-32.png'));

    // icon.png for Next.js App Router (192x192)
    await sharp(sourceIcon)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(projectRoot, 'src', 'app', 'icon.png'));

    // apple-icon.png (180x180)
    await sharp(sourceIcon)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(projectRoot, 'src', 'app', 'apple-icon.png'));

    // Also create a proper public/icon.png
    await sharp(sourceIcon)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(projectRoot, 'public', 'icon-512.png'));

    // Convert OG image to proper PNG (1200x630)
    await sharp(sourceOg)
      .resize(1200, 630, { fit: 'cover' })
      .png()
      .toFile(path.join(projectRoot, 'public', 'og-image-final.png'));

    // Create favicon.ico replacement as PNG (Next.js supports this)
    // Actually create a proper ICO by using 32x32 PNG
    const favicon32 = await sharp(sourceIcon)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();

    // Write as favicon.ico replacement in src/app
    const fs = await import('fs');
    // Remove old favicon.ico
    const oldFavicon = path.join(projectRoot, 'src', 'app', 'favicon.ico');
    if (fs.existsSync(oldFavicon)) {
      fs.unlinkSync(oldFavicon);
      console.log('Removed old favicon.ico');
    }

    console.log('All icons generated successfully!');
    console.log('- src/app/icon.png (192x192)');
    console.log('- src/app/apple-icon.png (180x180)');
    console.log('- public/icon-512.png (512x512)');
    console.log('- public/og-image-final.png (1200x630)');
  } catch (err) {
    console.error('Error:', err.message);
    // Try alternative: read as raw and re-encode
    console.log('Trying alternative approach...');
    
    const fs = await import('fs');
    
    // Read the source and try to re-encode
    try {
      const buffer = fs.readFileSync(sourceIcon);
      
      await sharp(buffer, { failOn: 'none' })
        .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(projectRoot, 'src', 'app', 'icon.png'));
      
      await sharp(buffer, { failOn: 'none' })
        .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(projectRoot, 'src', 'app', 'apple-icon.png'));

      await sharp(buffer, { failOn: 'none' })
        .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(projectRoot, 'public', 'icon-512.png'));

      const ogBuffer = fs.readFileSync(sourceOg);
      await sharp(ogBuffer, { failOn: 'none' })
        .resize(1200, 630, { fit: 'cover' })
        .png()
        .toFile(path.join(projectRoot, 'public', 'og-image-final.png'));

      // Remove old favicon.ico
      const oldFavicon = path.join(projectRoot, 'src', 'app', 'favicon.ico');
      if (fs.existsSync(oldFavicon)) {
        fs.unlinkSync(oldFavicon);
        console.log('Removed old favicon.ico');
      }

      console.log('Alternative approach succeeded!');
      console.log('- src/app/icon.png (192x192)');
      console.log('- src/app/apple-icon.png (180x180)');
      console.log('- public/icon-512.png (512x512)');
      console.log('- public/og-image-final.png (1200x630)');
    } catch (err2) {
      console.error('Alternative also failed:', err2.message);
    }
  }
}

convert();
