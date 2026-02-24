import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodePreviewProps {
  url: string;
  size?: number;
  className?: string;
}

export const QRCodePreview: React.FC<QRCodePreviewProps> = ({ 
  url, 
  size = 128,
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#065f46',
          light: '#ffffff'
        }
      }).catch(err => {
        console.error('Error generating QR code preview:', err);
      });
    }
  }, [url, size]);

  if (!url) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ borderRadius: '8px' }}
    />
  );
};
