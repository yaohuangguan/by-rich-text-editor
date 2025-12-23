export interface CompressOptions {
  /**
   * Output quality from 0 to 1
   * @default 0.7
   */
  quality?: number;
  /**
   * Maximum width of the output image
   * @default 1000
   */
  maxWidth?: number;
  /**
   * Output MIME type
   * @default 'image/jpeg'
   */
  type?: string;
}

/**
 * Compresses an image file and returns a Base64 string.
 */
export const compressImage = async (file: File, options: CompressOptions = {}): Promise<string> => {
  const { quality = 0.7, maxWidth = 1000, type = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions if width is greater than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export to data URL
        const dataUrl = canvas.toDataURL(type, quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => reject(new Error('Failed to load image for compression.'));
    };
    
    reader.onerror = (err) => reject(new Error('Failed to read file.'));
  });
};