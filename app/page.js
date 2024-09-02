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
  const [rounds, setRounds] = useState([]); // Track each round's performance
  const [correctDirections, setCorrectDirections] = useState(0); // Track the number of correct predictions

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  useEffect(() => {
    fetchCandleData();
    startCountdown();
    fetchLeaderboard(); // Fetch leaderboard data on initial render
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
      await axios.post('/api/leaderboard', { name: playerName, score });
      setScoreSubmitted(true); // Disable further submissions
      setShowLeaderboard(true); // Automatically show leaderboard after submission
      fetchLeaderboard(); // Refresh leaderboard after submitting the score
    } catch (error) {
      console.error('Error submitting score:', error);
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

  const handlePrediction = async () => {
    if (newCandle) {
      const lastCandle = candles[candles.length - 1];
      const direction = parseFloat(newCandle[4]) > parseFloat(lastCandle[4]) ? 'Green' : 'Red';
      const percentage = ((parseFloat(newCandle[4]) - parseFloat(lastCandle[4])) / parseFloat(lastCandle[4])) * 100;
      let currentScore = 0;
  
      if (direction.toLowerCase() === prediction.direction.toLowerCase()) {
        currentScore += 100;
        const accuracy = 100 - Math.abs(percentage - prediction.percentage);
        currentScore += accuracy > 0 ? accuracy : 0;
        setCorrectDirections((prev) => prev + 1); // Increment correct directions if correct
      }
  
      setRoundScore(currentScore);
      setScore((prev) => prev + currentScore);
      setRounds((prevRounds) => [...prevRounds, { prediction, actual: { direction, percentage }, score: currentScore }]); // Track round
  
      setCandles((prevCandles) => [...prevCandles, newCandle]); // Add the new candle to the displayed candles
      setChartOptions(createChartOptions([...candles, newCandle]));
      setNewCandle(null);
  
      setCountdown(prev => prev + currentScore / 20);
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
      <input 
        className="border p-2 m-2"
        type="text" 
        placeholder="Enter your name" 
        value={playerName} 
        onChange={(e) => setPlayerName(e.target.value)} 
        disabled={scoreSubmitted} // Disable input after submission
      />
      <button 
        className="bg-blue-500 text-grey p-2 m-2" 
        onClick={submitScore}
        disabled={scoreSubmitted} // Disable the button after submission
      >
        Submit Score to Leaderboard
      </button>
      <button className="bg-gray-500 text-white p-2 m-2" onClick={() => setShowLeaderboard(!showLeaderboard)}>
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

      <button 
        className="bg-gray-500 text-white p-2 m-2" 
        onClick={startNewGame}
      >
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
