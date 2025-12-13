import React, { useState, useEffect, useRef } from 'react';

const SmartTimer = ({ isInside, activeZoneName, onSaveSession }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds
    const [startTime, setStartTime] = useState(null);
    const [isPaused, setIsPaused] = useState(false);

    const intervalRef = useRef(null);

    // Auto-Pause / Resume Logic
    useEffect(() => {
        if (!isRunning) return;

        if (isInside) {
            if (isPaused) {
                // Resume
                setIsPaused(false);
            }
        } else {
            if (!isPaused) {
                // Pause
                setIsPaused(true);
            }
        }
    }, [isInside, isRunning, isPaused]);

    // Timer Interval
    useEffect(() => {
        if (isRunning && !isPaused) {
            intervalRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isRunning, isPaused]);

    const handleStart = () => {
        if (!activeZoneName) {
            alert("Please select a safe zone first!");
            return;
        }
        setIsRunning(true);
        setStartTime(new Date().toISOString());
        setElapsedTime(0);
        setIsPaused(!isInside); // Start paused if outside
    };

    const handleStop = async () => {
        setIsRunning(false);
        clearInterval(intervalRef.current);

        const endTime = new Date().toISOString();
        const sessionData = {
            zoneName: activeZoneName,
            startTime,
            endTime,
            duration: elapsedTime,
            date: new Date().toLocaleDateString('en-GB') // DD/MM/YYYY format roughly
        };

        // Save to backend
        try {
            const response = await fetch('/api/history', {

                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });
            if (response.ok) {
                alert(`Session Saved! Duration: ${formatTime(elapsedTime)}`);
                if (onSaveSession) onSaveSession();
            } else {
                const errData = await response.json();
                alert(`Failed to save session: ${errData.error || response.statusText}`);
            }

        } catch (error) {
            console.error("Error saving session:", error);
            alert("Error saving session (Backend might be offline).");
        }

        setElapsedTime(0);
        setStartTime(null);
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    if (!isRunning) {
        return (
            <button
                onClick={handleStart}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded shadow-lg w-full"
            >
                Start Timer
            </button>
        );
    }

    return (
        <div className="bg-gray-800 p-4 rounded shadow-lg text-center w-full">
            <div className="text-3xl font-mono font-bold mb-2 text-white">
                {formatTime(elapsedTime)}
            </div>
            <div className={`text-xs font-bold mb-3 uppercase ${isPaused ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                {isPaused ? 'Paused (Outside Zone)' : 'Running (Inside Zone)'}
            </div>
            <button
                onClick={handleStop}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-4 rounded w-full text-sm"
            >
                Stop & Save
            </button>
        </div>
    );
};

export default SmartTimer;
