"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import dynamic from 'next/dynamic';
import HC_stock from 'highcharts/modules/stock';
import '../globals.css';

HC_stock(Highcharts); // Initialize the stock module

const HighchartsReact = dynamic(() => import('highcharts-react-official'), {
  ssr: false // Disable SSR for HighchartsReact
});

export default function GamePage({ settings }) {
  const [candles, setCandles] = useState([]);
  const [allCandles, setAllCandles] = useState([]);
  const [prediction, setPrediction] = useState({ direction: 'Green', percentage: 0.00 }); // Default to Green
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [timeFrame, setTimeFrame] = useState('');
  const [timeUp, setTimeUp] = useState(false);
  const [newCandle, setNewCandle] = useState(null); // State to store the new candle
  const [chartOptions, setChartOptions] = useState(null); // State to store chart options
  const [countdown, setCountdown] = useState(30); // Countdown timer for the game
  const [gameOver, setGameOver] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null); // Store the interval so it can be cleared
  const [rounds, setRounds] = useState([]); // Track each round's performance
  const [correctDirections, setCorrectDirections] = useState(0); // Track the number of correct predictions
  const [maxDelta, setMaxDelta] = useState(10); // Default to 10% if we haven't calculated yet

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showPerformanceSummary, setShowPerformanceSummary] = useState(false);

  // Add this function to get a random timeframe
  const getRandomTimeframe = () => {
    const randomIndex = Math.floor(Math.random() * settings.timeframes.length);
    return settings.timeframes[randomIndex];
  };

  useEffect(() => {
    fetchCandleData(settings.ticker, getRandomTimeframe(), settings.candleHistory);
    startCountdown();
    fetchLeaderboard(); // Fetch leaderboard data on initial render
  }, [settings]);

  useEffect(() => {
    if (countdown <= 0 && !gameOver) {
      handleGameOver();
    }
  }, [countdown, gameOver]);

  const calculateMaxDelta = (candleData) => {
    let maxDelta = 0;
    for (let i = 1; i < candleData.length; i++) {
      const prevClose = parseFloat(candleData[i-1][4]);
      const currentClose = parseFloat(candleData[i][4]);
      const delta = Math.abs((currentClose - prevClose) / prevClose * 100);
      if (delta > maxDelta) {
        maxDelta = delta;
      }
    }
    return Math.ceil(maxDelta); // Round up to the nearest integer
  };

  const fetchCandleData = async (ticker, timeframe, history) => {
    setTimeFrame(timeframe);
    try {
      const res = await axios.get(`/api/fetchCandles?ticker=${ticker}&interval=${timeframe}&limit=${history + 1}`);
      const totalCandles = res.data.length;

      // Ensure there are enough candles to slice
      if (totalCandles >= history + 1) {
        const randomStartIndex = Math.floor(Math.random() * (totalCandles - history - 1));
        const randomOffsetCandles = res.data.slice(randomStartIndex, randomStartIndex + history + 1);
        setAllCandles(randomOffsetCandles);
        setCandles(randomOffsetCandles.slice(0, history)); // Set the first 'history' candles
        setNewCandle(randomOffsetCandles[history]); // Store the (history + 1)th candle for later use
        setChartOptions(createChartOptions(randomOffsetCandles.slice(0, history)));
        
        // Calculate and set the max delta
        const calculatedMaxDelta = calculateMaxDelta(randomOffsetCandles);
        setMaxDelta(calculatedMaxDelta);
      } else {
        setCandles(res.data.slice(0, history)); // Set all candles if less than 'history'
        setAllCandles(res.data);
        setNewCandle(null); // No new candle if less than 'history'
        setChartOptions(createChartOptions(res.data.slice(0, history)));
      }
    } catch (error) {
      console.error('Error fetching candle data:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('/api/leaderboard');
      setLeaderboard(res.data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const submitScore = async () => {
    if (!playerName || scoreSubmitted) return;
  
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          score,
          rounds,
        }),
      });
  
      const data = await response.json();
  
      if (data.message === 'Score submitted successfully') {
        setScoreSubmitted(true);
        setShowLeaderboard(true);
        setLeaderboard(data.leaderboard); // Update the local leaderboard state
      } else {
        console.error('Failed to submit score:', data.error);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const createChartOptions = (candleData) => ({
    chart: {
        backgroundColor: null // Remove the white background
    },
    title: {
        text: `${settings.ticker}/USD`
    },
    series: [{
        type: 'candlestick',
        name: settings.ticker,
        data: candleData.map(candle => [
            candle[0],
            parseFloat(candle[1]),
            parseFloat(candle[2]),
            parseFloat(candle[3]),
            parseFloat(candle[4])
        ])
    }],
    xAxis: {
        type: 'datetime',
        gridLineWidth: 0 // Remove grid lines
    },
    yAxis: {
        gridLineWidth: 0 // Remove grid lines
    },
    time: {
        useUTC: true // Adjust based on your data's timezone
    }
});

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handlePrediction = async () => {
    if (newCandle) {
      const lastCandle = candles[candles.length - 1];
      const actualDirection = parseFloat(newCandle[4]) > parseFloat(lastCandle[4]) ? 'Green' : 'Red';
      const actualPercentage = ((parseFloat(newCandle[4]) - parseFloat(lastCandle[4])) / parseFloat(lastCandle[4])) * 100;

      let pointsGained = 0;

      // Check if the direction prediction is correct
      if (actualDirection.toLowerCase() === prediction.direction.toLowerCase()) {
        pointsGained += 100; // Base points for correct direction

        // Calculate accuracy and bonus points
        const accuracy = Math.abs(prediction.percentage - Math.abs(actualPercentage));
        const bonusPoints = 200 * Math.exp(-3 * accuracy);
        
        pointsGained += bonusPoints;
      } else {
        pointsGained -= 50; // Lose 50 points for incorrect prediction
      }

      // Update round score
      setRoundScore(pointsGained);

      setScore(score + pointsGained);

      // Track round
      setRounds((prevRounds) => [
        ...prevRounds,
        { 
          prediction, 
          actual: { direction: actualDirection, percentage: actualPercentage }, 
          score: pointsGained,
        }
      ]);

      // Update chart and candles
      setCandles((prevCandles) => [...prevCandles, newCandle]);
      setChartOptions(createChartOptions([...candles, newCandle]));
      setNewCandle(null);

      await sleep(1500);

      // Adjust countdown based on new score
      setCountdown((prev) => prev + pointsGained / 50);
      
      // Fetch new candle data
      fetchCandleData(settings.ticker, getRandomTimeframe(), settings.candleHistory);

      if (countdown <= 0) {
        handleGameOver();
      }
    }
  };

  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        const newCountdown = prev - 1;
        if (newCountdown <= 0) {
          clearInterval(interval);
          handleGameOver();
        }
        return newCountdown;
      });
    }, 1000);

    setCountdownInterval(interval); // Store the interval ID for later clearing
  };

  const handleGameOver = async () => {
    setGameOver(true);
    clearInterval(countdownInterval);
    // You can add any additional game over logic here
  };

  const startNewGame = () => {
    setScore(0);
    setRoundScore(0);
    setGameOver(false);
    setCountdown(30);
    fetchCandleData(settings.ticker, getRandomTimeframe(), settings.candleHistory);
    startCountdown(); // Start a new countdown when a new game starts
  };

  return (
      <div>
        <h1 className="text-center text-xl font-bold">Fractal Trainer v1</h1>
        {gameOver ? (
    <div className="text-center">
      <p className="text-lg">Game Over! Your Final Score: {score.toFixed(2)}</p>
      <input 
        className="border p-2 m-2"
        type="text" 
        placeholder="Enter your name" 
        value={playerName} 
        onChange={(e) => setPlayerName(e.target.value)} 
        disabled={scoreSubmitted} // Disable input after submission
      />
      <button 
        className="btn bg-blue-500" 
        onClick={submitScore}
        disabled={scoreSubmitted} // Disable the button after submission
      >
        Submit Score to Leaderboard
      </button>
      <button className="btn bg-blue-500" onClick={() => setShowLeaderboard(!showLeaderboard)}>
        {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
      </button>
      {showLeaderboard && (
        <div className="leaderboard">
          <h3 className="text-lg font-bold">Leaderboard</h3>
          <ul>
            {leaderboard.map((entry, index) => (
              <li key={index}>{entry.name}: {entry.score}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Summary of each round's performance */}
      <h3 className="text-lg font-bold mt-4">
        <button 
          onClick={() => setShowPerformanceSummary(!showPerformanceSummary)}
          className="flex items-center justify-center w-full"
        >
          Performance Summary
          <span className="ml-2">
            {showPerformanceSummary ? '▲' : '▼'}
          </span>
        </button>
      </h3>
      {showPerformanceSummary && (
        <ul className="performance-summary">
          {rounds.map((round, index) => {
            const { actual, prediction, score } = round;
            const percentageColor = actual.percentage >= 0 ? 'text-green-500' : 'text-red-500';
            return (
              <li key={index} className="mb-2">
                <span className="font-semibold">Round {index + 1}:</span>{' '}
                <span className={percentageColor}>
                  {actual.percentage.toFixed(2)}%
                </span>
                <br />
                Prediction: {prediction.percentage.toFixed(2)}% 
                Points: {score.toFixed(2)}
              </li>
            );
          })}
        </ul>
      )}

      <button 
        className="btn bg-green-500 hover:bg-green-900 text-gray-800 transition duration-300 ease-in-out" 
        onClick={() => window.location.reload()} // This will refresh the page, returning to the home screen
      >
        Back to Home
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
            <p className="text-lg">Score: {score.toFixed(2)}</p>
            <p className="text-lg">Countdown: {countdown.toFixed(2)} seconds</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex">
              <label className="mr-3">
                <input className="mr-2"
                  type="radio"
                  value="Green"
                  checked={prediction.direction === 'Green'}
                  onChange={(e) => setPrediction({ ...prediction, direction: e.target.value })}
                />
                 Long 
              </label>
              <label className="ml-3">
                <input className="mr-2"
                  type="radio"
                  value="Red"
                  checked={prediction.direction === 'Red'}
                  onChange={(e) => setPrediction({ ...prediction, direction: e.target.value })}
                />
                 Short 
              </label>
            </div>
            <div className="slider-container">
              <input
                className="border p-2 m-2 w-1/2"
                type="range"
                min="0"
                max={maxDelta}
                step="0.01"
                value={prediction.percentage}
                onChange={(e) => setPrediction({ ...prediction, percentage: parseFloat(e.target.value) })}
              />
              <div className="text-lg">{prediction.percentage.toFixed(2)}%</div>
            </div>
            <button className="btn bg-blue-500 mb-4" onClick={handlePrediction} disabled={timeUp || gameOver}>
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
