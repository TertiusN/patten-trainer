"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import dynamic from 'next/dynamic';
import HC_stock from 'highcharts/modules/stock';
import './globals.css';

HC_stock(Highcharts); // Initialize the stock module

const HighchartsReact = dynamic(() => import('highcharts-react-official'), {
  ssr: false // Disable SSR for HighchartsReact
});

const TIME_FRAMES = ['15m', '4h', '1d'];

export default function Home() {
  const [candles, setCandles] = useState([]);
  const [allCandles, setAllCandles] = useState([]);
  const [prediction, setPrediction] = useState({ direction: 'Green', percentage: 0 }); // Default to Green
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [timeFrame, setTimeFrame] = useState('');
  const [timeUp, setTimeUp] = useState(false);
  const [newCandle, setNewCandle] = useState(null); // State to store the new candle
  const [chartOptions, setChartOptions] = useState(null); // State to store chart options
  const [countdown, setCountdown] = useState(30); // Countdown timer for the game
  const [gameOver, setGameOver] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null); // Store the interval so it can be cleared

  useEffect(() => {
    fetchCandleData();
    startCountdown();
  }, []);

  useEffect(() => {
    if (countdown <= 0 && !gameOver) {
      setGameOver(true);
      clearInterval(countdownInterval); // Stop the timer when the game is over
    }
  }, [countdown, gameOver, countdownInterval]);

  const fetchCandleData = async () => {
    const tf = TIME_FRAMES[Math.floor(Math.random() * TIME_FRAMES.length)];
    setTimeFrame(tf);
    try {
      const res = await axios.get(`/api/fetchCandles?interval=${tf}`);
      const totalCandles = res.data.length;

      // Ensure there are enough candles to slice
      if (totalCandles >= 26) {
        const randomStartIndex = Math.floor(Math.random() * (totalCandles - 26));
        const randomOffsetCandles = res.data.slice(randomStartIndex, randomStartIndex + 26);
        setAllCandles(randomOffsetCandles);
        setCandles(randomOffsetCandles.slice(0, 25)); // Set the first 25 candles
        setNewCandle(randomOffsetCandles[25]); // Store the 26th candle for later use
        setChartOptions(createChartOptions(randomOffsetCandles.slice(0, 25)));
      } else {
        setCandles(res.data.slice(0, 25)); // Set all candles if less than 26
        setAllCandles(res.data);
        setNewCandle(null); // No new candle if less than 26
        setChartOptions(createChartOptions(res.data.slice(0, 25)));
      }
    } catch (error) {
      console.error('Error fetching candle data:', error);
    }
  };

  const createChartOptions = (candleData) => ({
    title: {
      text: 'Bitcoin Candlestick Chart'
    },
    series: [{
      type: 'candlestick',
      name: 'Bitcoin',
      data: candleData.map(candle => [
        candle[0],
        parseFloat(candle[1]),
        parseFloat(candle[2]),
        parseFloat(candle[3]),
        parseFloat(candle[4])
      ])
    }],
    xAxis: {
      type: 'datetime'
    },
    time: {
      useUTC: true // Adjust based on your data's timezone
    }
  });

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handlePrediction = async () => {  // Make the function async to use await
    if (newCandle) { // Only calculate if a new candle is available
      const lastCandle = candles[candles.length - 1];
      const direction = parseFloat(newCandle[4]) > parseFloat(lastCandle[4]) ? 'Green' : 'Red';
      const percentage = ((parseFloat(newCandle[4]) - parseFloat(lastCandle[4])) / parseFloat(lastCandle[4])) * 100;
      let currentScore = 0;
  
      if (direction.toLowerCase() === prediction.direction.toLowerCase()) {
        currentScore += 100;
        const accuracy = 100 - Math.abs(percentage - prediction.percentage);
        currentScore += accuracy > 0 ? accuracy : 0;
      }
  
      setRoundScore(currentScore);
      setScore((prev) => prev + currentScore);
      setCandles((prevCandles) => [...prevCandles, newCandle]); // Add the new candle to the displayed candles
  
      // Update chart options to include the new candle
      setChartOptions(createChartOptions([...candles, newCandle]));
      setNewCandle(null); // Reset newCandle after submission
  
      // Extend the countdown timer
      setCountdown(prev => prev + currentScore / 20);
  
      // Sleep for 3 seconds before fetching new candle data
      await sleep(1500);
  
      fetchCandleData();
  
      if (countdown <= 0) {
        setGameOver(true);
        clearInterval(countdownInterval);
      }
    }
  };

  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCountdown = prev - 1;
        if (newCountdown <= 0) {
          clearInterval(interval);
          setGameOver(true);
        }
        return newCountdown;
      });
    }, 1000);

    setCountdownInterval(interval); // Store the interval ID for later clearing
  };

  const startNewGame = () => {
    setScore(0);
    setRoundScore(0);
    setGameOver(false);
    setCountdown(30);
    fetchCandleData();
    startCountdown(); // Start a new countdown when a new game starts
  };
// Function to map the slider value for desired precision
const mapSliderValue = (value) => {
  return value;
};

const handleSliderChange = (event) => {
  const rawValue = parseFloat(event.target.value);
  const mappedValue = mapSliderValue(rawValue);
  setPrediction({ ...prediction, percentage: mappedValue });
};

return (
  <div>
    <h1 className="text-center text-xl font-bold">BTC - Pattern Trainer</h1>
    {gameOver ? (
      <div className="text-center">
        <p className="text-lg">Game Over! Your Final Score: {score}</p>
        <button className="bg-green-500 text-white p-2 m-2" onClick={startNewGame}>
          Start New Game
        </button>
      </div>
    ) : (
      <>
        <p className="text-center">Time Frame: {timeFrame}</p>
        {chartOptions && (
          <div className="chart-container">
            <HighchartsReact 
              className="chart" 
              highcharts={Highcharts} 
              options={chartOptions} 
            />
          </div>
        )}

        <div className="text-center">
          <p className="text-lg">Score: {score}</p>
          <p className="text-lg">Countdown: {countdown} seconds</p>
        </div>
        
        <div className="text-center">
          <div className="inline-flex">
            <label className="mr-2">
              <input
                type="radio"
                value="Green"
                checked={prediction.direction === 'Green'}
                onChange={(e) => setPrediction({ ...prediction, direction: e.target.value })}
              />
              Green
            </label>
            <label className="ml-2">
              <input
                type="radio"
                value="Red"
                checked={prediction.direction === 'Red'}
                onChange={(e) => setPrediction({ ...prediction, direction: e.target.value })}
              />
              Red
            </label>
          </div>
          <div className="slider-container">
            <input
              className="border p-2 m-2 w-1/2"
              type="range"
              min="0"
              max="100"
              value={prediction.percentage}
              onChange={handleSliderChange} // Use the new function here
            />
            <div className="text-lg">{prediction.percentage}%</div>  {/* Display current percentage */}
          </div>
          <button className="bg-blue-500 text-white p-2 m-2" onClick={handlePrediction} disabled={timeUp || gameOver}>
            Submit
          </button>
        </div>
      </>
    )}
  </div>
);
  
}
