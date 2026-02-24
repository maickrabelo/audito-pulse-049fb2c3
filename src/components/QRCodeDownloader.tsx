import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDownloaderProps {
  url: string;
  filename: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const QRCodeDownloader: React.FC<QRCodeDownloaderProps> = ({ 
  url, 
  filename, 
  variant = 'outline',
  size = 'default',
  className 
}) => {
  const { toast } = useToast();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#065f46',
          light: '#ffffff'
        }
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "QR Code baixado",
            description: "O QR Code foi baixado com sucesso!",
          });
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: "Não foi possível gerar o QR Code.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleDownload}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      Baixar QR Code
    </Button>
  );
};
