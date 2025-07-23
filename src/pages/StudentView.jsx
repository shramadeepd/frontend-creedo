import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import PollResults from '../components/PollResults';

function StudentView() {
    const socket = useSocket();
    const [studentName, setStudentName] = useState('');
    const [nameSubmitted, setNameSubmitted] = useState(false);
    const [nameError, setNameError] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [pollResults, setPollResults] = useState({});
    const [isQuestionActive, setIsQuestionActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // For countdown
    const [showResults, setShowResults] = useState(false);
    const [studentError, setStudentError] = useState('');
    const [studentMessage, setStudentMessage] = useState('');

    const timerIntervalRef = useRef(null); // Ref to hold the interval ID

    // Effect for name submission and socket connection
    useEffect(() => {
        const storedName = sessionStorage.getItem('studentName');
        if (storedName) {
            setStudentName(storedName);
            setNameSubmitted(true);
            if (socket) {
                socket.emit('student:join', storedName);
            }
        }
    }, [socket]); // Only run when socket changes (i.e., when it becomes available)

    // Effect for handling socket events
    useEffect(() => {
        if (!socket) return;

        socket.on('student:nameTaken', (message) => {
            setNameError(message);
            sessionStorage.removeItem('studentName'); // Clear storage if name is taken/invalid
            setNameSubmitted(false); // Allow re-entry of name
            setStudentMessage('');
        });

        socket.on('teacher:askQuestion', (questionData) => {
            setCurrentQuestion(questionData);
            setSelectedAnswer(null); // Reset selection for new question
            setHasAnswered(false);   // Reset answer status for new question
            setShowResults(false);   // Hide results for new question
            setIsQuestionActive(true);
            setTimeLeft(questionData.timer); // Set timer based on teacher's config
            setStudentError('');
            setStudentMessage('A new question has been asked!');

            // Start client-side timer
            clearInterval(timerIntervalRef.current); // Clear any existing timer
            timerIntervalRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerIntervalRef.current);
                        setIsQuestionActive(false); // Question is now inactive for this student
                        if (!hasAnswered) { // If student didn't answer within time
                            setShowResults(true); // Show results
                            setStudentMessage('Time is up!');
                        }
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        });

        socket.on('poll:resultsUpdate', (results, activeStatus) => {
            setPollResults(results);
            setIsQuestionActive(activeStatus);
            // Only show results if already answered or question is no longer active
            if (hasAnswered || !activeStatus) {
                 setShowResults(true);
            }
        });

        socket.on('poll:questionClosed', (finalResults, closedQuestion) => {
            clearInterval(timerIntervalRef.current); // Ensure timer stops
            setPollResults(finalResults);
            setCurrentQuestion(closedQuestion); // Keep context of the closed question
            setShowResults(true);
            setIsQuestionActive(false);
            setTimeLeft(0);
            setStudentMessage('The poll has closed!');
        });

        socket.on('poll:noActiveQuestion', () => {
            setCurrentQuestion(null);
            setShowResults(false);
            setIsQuestionActive(false);
            setTimeLeft(0);
            setStudentMessage('Waiting for the teacher to ask a question...');
        });

        socket.on('poll:noAnswerYet', () => {
             // This means a student joined an active poll but hasn't answered yet, so don't show results
             setShowResults(false);
             setHasAnswered(false);
             setStudentMessage('A question is active. Please submit your answer!');
        });


        socket.on('poll:error', (message) => {
            setStudentError(message);
            setStudentMessage('');
        });

        socket.on('student:kicked', (message) => {
            alert(message);
            sessionStorage.removeItem('studentName');
            window.location.reload(); // Force refresh to reset state and ask for name again
        });

        return () => {
            clearInterval(timerIntervalRef.current); // Cleanup on unmount
            socket.off('student:nameTaken');
            socket.off('teacher:askQuestion');
            socket.off('poll:resultsUpdate');
            socket.off('poll:questionClosed');
            socket.off('poll:noActiveQuestion');
            socket.off('poll:noAnswerYet');
            socket.off('poll:error');
            socket.off('student:kicked');
        };
    }, [socket, hasAnswered]); // Re-run effect if `hasAnswered` state changes to update timer logic


    const handleNameSubmit = () => {
        if (studentName.trim()) {
            sessionStorage.setItem('studentName', studentName.trim());
            setNameSubmitted(true);
            setNameError('');
            setStudentMessage('');
            socket.emit('student:join', studentName.trim());
        } else {
            setNameError('Please enter a name.');
        }
    };

    const submitAnswer = () => {
        if (selectedAnswer && currentQuestion && !hasAnswered && isQuestionActive && timeLeft > 0) {
            socket.emit('student:submitAnswer', selectedAnswer);
            setHasAnswered(true);
            setShowResults(true); // Show results immediately after answering
            setStudentError('');
            setStudentMessage('Answer submitted!');
            clearInterval(timerIntervalRef.current); // Stop timer once answered
        } else if (!selectedAnswer) {
            setStudentError('Please select an answer.');
        } else if (hasAnswered) {
             setStudentError('You have already submitted an answer.');
        } else if (!isQuestionActive || timeLeft <= 0) {
             setStudentError('The poll is no longer active or time has run out.');
        }
    };

    return (
        <div className="bento-box" style={{ maxWidth: '600px', marginTop: '5vh' }}>
            <h1>Student View</h1>

            {!nameSubmitted ? (
                <div>
                    <h2>Enter Your Name to Join</h2>
                    {nameError && <p className="message error">{nameError}</p>}
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleNameSubmit();
                        }}
                        className="mb-15"
                    />
                    <button onClick={handleNameSubmit}>Join Quiz</button>
                </div>
            ) : (
                <div>
                    <h2>Hello, {studentName}!</h2>
                    {studentError && <p className="message error">{studentError}</p>}
                    {studentMessage && <p className="message info">{studentMessage}</p>}

                    {currentQuestion && isQuestionActive && !hasAnswered && timeLeft > 0 ? (
                        <div className="mb-15">
                            <h3>Question: {currentQuestion.text}</h3>
                            <p>Time Left: <strong>{timeLeft}</strong> seconds</p>
                            <div className="mb-15">
                                {currentQuestion.options.map((option) => (
                                    <div key={option.id} className="mb-10 flex-row">
                                        <input
                                            type="radio"
                                            id={option.id}
                                            name="answer"
                                            value={option.id}
                                            checked={selectedAnswer === option.id}
                                            onChange={() => setSelectedAnswer(option.id)}
                                        />
                                        <label htmlFor={option.id}>{option.text}</label>
                                    </div>
                                ))}
                            </div>
                            <button onClick={submitAnswer} disabled={!selectedAnswer}>Submit Answer</button>
                        </div>
                    ) : (
                        // Display results or waiting message based on state
                        showResults && currentQuestion ? (
                            <PollResults
                                question={currentQuestion}
                                results={pollResults}
                                isStudentView={true}
                                selectedAnswerId={selectedAnswer}
                            />
                        ) : (
                            <p className="message info">
                                {nameSubmitted && !currentQuestion && "Waiting for the teacher to ask a question..."}
                                {nameSubmitted && currentQuestion && (hasAnswered || timeLeft <= 0) && "Poll closed. Showing results..."}
                            </p>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default StudentView;