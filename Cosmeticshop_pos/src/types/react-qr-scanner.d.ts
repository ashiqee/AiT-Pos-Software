// types/react-qr-scanner.d.ts
declare module 'react-qr-scanner' {
  import { ComponentType } from 'react';

  interface QrScannerProps {
    onResult: (result: { text: string } | null) => void;
    onError: (error: any) => void;
    constraints?: MediaTrackConstraints;
    containerStyle?: React.CSSProperties;
    videoStyle?: React.CSSProperties;
  }

  const QrScanner: ComponentType<QrScannerProps>;
  export default QrScanner;
}