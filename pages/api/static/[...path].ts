import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: filePath } = req.query;
  
  if (!filePath || typeof filePath === 'string') {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const fullPath = path.join(process.cwd(), 'public', ...filePath);

  try {
    const fileBuffer = fs.readFileSync(fullPath);
    
    // MIME tipini belirle
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    // Headers ayarla
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Dosyayı gönder
    return res.send(fileBuffer);
  } catch (error) {
    console.error('Dosya okuma hatası:', error);
    return res.status(404).json({ error: 'File not found' });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
} 