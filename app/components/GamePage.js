"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import dynamic from 'next/dynamic';
import HC_stock from 'highcharts/modules/stock';
import '../globals.css';
import { DosSlider } from './DosCustom';

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
  const [showShareButton, setShowShareButton] = useState(false);

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
        // Check if the player made it to the leaderboard
        const madeLeaderboard = data.leaderboard.some(entry => entry.name === playerName);
        setShowShareButton(madeLeaderboard);
      } else {
        console.error('Failed to submit score:', data.error);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const shareOnTwitter = () => {
    const tweetText = `New Fractal Trainer High Score - ${score.toFixed(2)} #FRACTAL #TRAINER - https://fractal-trainer.vercel.app`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
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
        ]),
        color: 'teal', // Color for the falling candles
        upColor: 'teal', // Color for the rising candles
        lineColor: 'teal', // Outline color
        dataGrouping: {
            approximation: 'average'
        }
    }],
    xAxis: {
        type: 'datetime',
        gridLineWidth: 0, // Remove grid lines
    },
    yAxis: {
        gridLineWidth: 0, // Remove grid lines
        title: {
            text: 'Price', // Add title for the y-axis
            style: {
                color: 'yellow', // Set y-axis title color to pink
                fontSize: '15px'
            }
        }
    },
    legend: {
        itemStyle: {
                color: 'yellow', // Set y-axis title color to pink
                fontSize: '15px'
        }
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
    <div className="container mx-auto max-w-2xl font-vt323">
      <h1 className="text-4xl font-bold mb-4 text-center">Fractal Trainer v1.0</h1>
      
      {gameOver ? (
        <div className="text-center border-2 border-white p-4">
          <p className="text-2xl mb-4">Game Over! Final Score: {score.toFixed(2)}</p>
          <input 
            className="dos-input mb-2 w-full"
            type="text" 
            placeholder="Enter your name" 
            value={playerName} 
            onChange={(e) => setPlayerName(e.target.value)} 
            disabled={scoreSubmitted}
          />
          <button 
            className="dos-button mr-2"
            onClick={submitScore}
            disabled={scoreSubmitted}
          >
            Submit Score
          </button>
          <button 
            className="dos-button"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
          </button>
          
          {showLeaderboard && (
            <div className="mt-4 border-2 border-white p-4">
              <h3 className="text-2xl font-bold mb-2">Leaderboard</h3>
              <ul>
                {leaderboard.map((entry, index) => (
                  <li key={index}>{entry.name}: {entry.score}</li>
                ))}
              </ul>
              {showShareButton && (
                <button 
                  className="dos-button mt-4"
                  onClick={shareOnTwitter}
                >
                  Share on Twitter
                </button>
              )}
            </div>
          )}
          
          <h3 className="text-2xl font-bold mt-4">
            <button 
              onClick={() => setShowPerformanceSummary(!showPerformanceSummary)}
              className="dos-button w-full"
            >
              Performance Summary {showPerformanceSummary ? '▲' : '▼'}
            </button>
          </h3>
          {showPerformanceSummary && (
            <ul className="mt-2 border-2 border-white p-4 text-left">
              {rounds.map((round, index) => (
                <li key={index} className="mb-2">
                  Round {index + 1}: {round.actual.percentage.toFixed(2)}%
                  <br />
                  Prediction: {round.prediction.percentage.toFixed(2)}% 
                  <br />
                  Points: {round.score.toFixed(2)}
                </li>
              ))}
            </ul>
          )}

          <button 
            className="dos-button mt-4"
            onClick={() => window.location.reload()}
          >
            Back to Home
          </button>
        </div>
      ) : (
        <>
          <p className="text-center mb-2">Time Frame: {timeFrame}</p>
          {chartOptions && (
            <div className="chart-container border-2 border-white p-4 mb-4">
              <HighchartsReact 
                highcharts={Highcharts} 
                options={{
                  ...chartOptions,
                  chart: {
                    ...chartOptions.chart,
                    backgroundColor: '#000080',
                    style: {
                      fontFamily: "'VT323', monospace"
                    }
                  },
                  title: {
                    style: {
                      color: '#ffffff',
                      fontSize: '20px'
                    }
                  },
                  xAxis: {
                    ...chartOptions.xAxis,
                    labels: { style: { color: '#ffffff' } },
                    lineColor: '#ffffff',
                  },
                  yAxis: {
                    ...chartOptions.yAxis,
                    labels: { style: { color: '#ffffff' } },
                    gridLineColor: '#ffffff',
                  },
                  series: chartOptions.series.map(series => ({
                    ...series,
                    color: '#ffffff'
                  }))
                }}
              />
            </div>
          )}

          <div className="text-center mb-4 grid grid-cols-2 gap-4">
            <p className="text-xl col-span-2">Score: {score.toFixed(2)}</p>
            <p className="text-xl col-span-2">Countdown: {countdown.toFixed(2)} seconds</p>
          </div>
          
          <div className="text-center border-2 border-white p-4">
            <div className="inline-flex mb-4">
              <button
                className={`mr-6 ${prediction.direction === 'Green' ? 'bg-white text-[#000080]' : ''}`}
                onClick={() => setPrediction({ ...prediction, direction: 'Green' })}
              >
                LONG
              </button>
              <button
                className={`${prediction.direction === 'Red' ? 'bg-white text-[#000080]' : ''}`}
                onClick={() => setPrediction({ ...prediction, direction: 'Red' })}
              >
                SHORT
              </button>
            </div>
            <div className="mb-4">
              <DosSlider
                value={prediction.percentage}
                onChange={(value) => setPrediction({ ...prediction, percentage: value })}
                min={0}
                max={maxDelta}
                step={0.01}
              />
              <div className="text-lg mt-2">{prediction.percentage.toFixed(2)}%</div>
            </div>
            <button 
              className="dos-button"
              onClick={handlePrediction} 
              disabled={timeUp || gameOver}
            >
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
