// app/api/fetchCandles/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';

const fetchCandles = async (symbol, interval) => {
  try {
    const response = await axios.get(BINANCE_API_URL, {
      params: {
        symbol,
        interval,
        limit: 1000, // Adjust as needed
      },
    });
    console.log('Fetched data from Binance:', response.data); // Log the fetched data
    return response.data;
  } catch (error) {
    console.error('Error fetching data from Binance API:', error.message);
    throw new Error('Failed to fetch data from Binance');
  }
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '15m';
  const filePath = path.resolve('./data', `${symbol}_${interval}.json`);
  const dataDir = path.resolve('./data'); // Define the data directory path

  try {
    // Check if the data directory exists, and create it if not
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory:', dataDir);
    }

    let candles;
    if (fs.existsSync(filePath)) {
      candles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      candles = await fetchCandles(symbol, interval);
      fs.writeFileSync(filePath, JSON.stringify(candles));
      console.log('Saved candles to file:', filePath);
    }
    return NextResponse.json(candles);
  } catch (error) {
    console.error('Error in API route:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
