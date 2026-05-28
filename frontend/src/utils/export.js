import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Filter function to hide UI overlays, controls, and minimaps in exports.
 */
const cleanUiFilter = (node) => {
  if (node.classList) {
    if (
      node.classList.contains('react-flow__minimap') ||
      node.classList.contains('react-flow__controls') ||
      node.classList.contains('react-flow__panel')
    ) {
      return false;
    }
  }
  return true;
};

/**
 * Captures the React Flow viewport and downloads it as a PNG image.
 */
export async function exportToPng(el, options = {}) {
  if (!el) {
    console.error("No element provided to export.");
    return;
  }
  
  try {
    const dataUrl = await toPng(el, {
      backgroundColor: '#111827', // Match our dark theme
      pixelRatio: 2, // 2x multiplier for crisp Retina resolution at 100% scale capture
      skipFonts: true, // Skip scanning and base64-inlining external fonts (saves 2-4 seconds)
      ...options,
      style: {
        'text-rendering': 'geometricPrecision',
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale',
        ...(options.style || {})
      }
    });
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'django-erd-schema.png';
    a.click();
  } catch (error) {
    console.error("Failed to export PNG:", error);
  }
}

/**
 * Captures the React Flow viewport and downloads it as a PDF document.
 */
export async function exportToPdf(el, options = {}) {
  if (!el) {
    console.error("No element provided to export.");
    return;
  }
  
  try {
    // Using JPEG instead of PNG for PDF export results in a 90% - 95% reduction in file size (e.g. 500KB instead of 10MB)
    // while maintaining razor-sharp text clarity by using 0.95 compression quality.
    const dataUrl = await toJpeg(el, {
      backgroundColor: '#111827',
      pixelRatio: 2,
      skipFonts: true,
      quality: 0.95, // Ultra-high JPEG quality to keep text perfectly sharp
      ...options,
      style: {
        'text-rendering': 'geometricPrecision',
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale',
        ...(options.style || {})
      }
    });
    
    // Create an image to inspect real-world pixel dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    // Dynamically choose page orientation and fit the diagram inside a standard A4 page layout.
    // Standard A4 is fully compatible with all mobile PDF viewers (allowing smooth pinch-to-zoom) and standard printers.
    const isLandscape = img.width > img.height;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    
    // Get standard A4 page dimensions in points (pt)
    const pageWidth = isLandscape ? 841.89 : 595.28;
    const pageHeight = isLandscape ? 595.28 : 841.89;
    
    // Calculate scale factor to center and fit the image perfectly inside A4 bounds while maintaining aspect ratio
    const imageRatio = img.width / img.height;
    const pageRatio = pageWidth / pageHeight;
    
    let renderWidth, renderHeight;
    let x = 0;
    let y = 0;
    
    if (imageRatio > pageRatio) {
      // Wider diagram: fit to page width
      renderWidth = pageWidth;
      renderHeight = pageWidth / imageRatio;
      y = (pageHeight - renderHeight) / 2; // Center vertically
    } else {
      // Taller diagram: fit to page height
      renderWidth = pageHeight * imageRatio;
      renderHeight = pageHeight;
      x = (pageWidth - renderWidth) / 2; // Center horizontally
    }
    
    // Fill the entire A4 canvas with our premium solid dark theme background color to ensure seamless styling
    pdf.setFillColor('#111827');
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    pdf.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);
    
    // Configure the PDF viewer to open in "Fit Page" mode automatically, displaying the entire diagram borderlessly
    pdf.setDisplayMode('fullpage', 'single');
    
    pdf.save('django-erd-schema.pdf');
  } catch (error) {
    console.error("Failed to export PDF:", error);
  }
}
