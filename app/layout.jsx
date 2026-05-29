import './globals.css';
import './fonts.css';

export const metadata = {
  title: 'Yena Prompt Magazine',
  description: 'A visual prompt archive and remix lab.'
};

export default function RootLayout({ children }) {
  return (
    <html lang='ko'>
      <body>{children}</body>
    </html>
  );
}
