import Image from 'next/image';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCode({ url, size = 128, className }: QRCodeProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&bgcolor=1A1B26&color=FFD700&qzone=1`;

  return (
    <div className={className}>
      <Image
        src={qrUrl}
        width={size}
        height={size}
        alt="QR Code"
        className="rounded-md"
      />
    </div>
  );
}
