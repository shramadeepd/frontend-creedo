import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import PollResults from '../components/PollResults';

function TeacherDashboard() {
    const socket = useSocket();
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState([{ text: '' }, { text: '' }]);
    const [pollDuration, setPollDuration] = useState(60); // Default 60 seconds
    const [pollResults, setPollResults] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [isQuestionActive, setIsQuestionActive] = useState(false);
    const [connectedStudents, setConnectedStudents] = useState([]); // {id: socketId, name: studentName}
    const [teacherError, setTeacherError] = useState('');
    const [teacherMessage, setTeacherMessage] = useState('');

    useEffect(() => {
        if (!socket) return;

        // Listener for new question from self (for UI update) or if reconnecting
        socket.on('teacher:askQuestion', (questionData) => {
            setCurrentQuestion(questionData);
            setIsQuestionActive(true);
            setPollResults(questionData.options.reduce((acc, opt) => ({ ...acc, [opt.id]: 0 }), {})); // Reset results for new question
            setQuestionText(''); // Clear form
            setOptions([{ text: '' }, { text: '' }]); // Reset options
            setTeacherError('');
            setTeacherMessage('Question is now live!');
        });

        socket.on('poll:resultsUpdate', (results, activeStatus) => {
            setPollResults(results);
            setIsQuestionActive(activeStatus);
        });

        socket.on('poll:questionClosed', (finalResults, closedQuestion) => {
            setPollResults(finalResults);
            setCurrentQuestion(closedQuestion); // Keep question data to display results
            setIsQuestionActive(false);
            setTeacherMessage('Poll has closed!');
        });

        socket.on('teacher:updateStudentList', (students) => {
            setConnectedStudents(students);
        });

        socket.on('teacher:error', (message) => {
            setTeacherError(message);
            setTeacherMessage('');
        });

        // Clean up listeners
        return () => {
            socket.off('teacher:askQuestion');
            socket.off('poll:resultsUpdate');
            socket.off('poll:questionClosed');
            socket.off('teacher:updateStudentList');
            socket.off('teacher:error');
        };
    }, [socket]); // Re-run if socket instance changes

    const handleAddOption = () => {
        setOptions([...options, { text: '' }]);
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const handleRemoveOption = (index) => {
        if (options.length > 2) { // Ensure at least two options remain
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const askQuestion = () => {
        const validOptions = options
            .filter(opt => opt.text.trim() !== '');

        if (questionText.trim() === '' || validOptions.length < 2) {
            setTeacherError('Please enter a question and at least two non-empty options.');
            setTeacherMessage('');
            return;
        }
        if (pollDuration < 10 || pollDuration > 300) { // Example range
            setTeacherError('Poll duration must be between 10 and 300 seconds.');
            setTeacherMessage('');
            return;
        }

        socket.emit('teacher:askQuestion', {
            text: questionText.trim(),
            options: validOptions,
            timer: pollDuration
        });
    };

    const kickStudent = (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to kick ${studentName}?`)) {
            socket.emit('teacher:kickStudent', studentId);
            setTeacherMessage(`Kicked ${studentName}.`);
        }
    };

    return (
        <div className="bento-grid">
            <div className="bento-box">
                <h2>Ask a New Question</h2>
                {teacherError && <p className="message error">{teacherError}</p>}
                {teacherMessage && <p className="message info">{teacherMessage}</p>}

                {!isQuestionActive ? (
                    <div>
                        <input
                            type="text"
                            placeholder="Enter your question"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            className="mb-15"
                        />
                        {options.map((option, index) => (
                            <div key={index} className="flex-row mb-15">
                                <input
                                    type="text"
                                    placeholder={`Option ${index + 1}`}
                                    value={option.text}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    style={{ flexGrow: 1, marginRight: '10px' }}
                                />
                                {options.length > 2 && (
                                    <button onClick={() => handleRemoveOption(index)} style={{ background: 'var(--error-color)' }}>Remove</button>
                                )}
                            </div>
                        ))}
                        <button onClick={handleAddOption} className="mr-10">Add Option</button>

                        <div className="flex-row mb-15" style={{marginTop: '20px'}}>
                            <label htmlFor="pollDuration" className="mr-10" style={{whiteSpace: 'nowrap'}}>Poll Duration (seconds):</label>
                            <input
                                type="number"
                                id="pollDuration"
                                value={pollDuration}
                                onChange={(e) => setPollDuration(Math.max(10, parseInt(e.target.value) || 0))} // Min 10s
                                min="10"
                                max="300" // Example max 5 mins
                                style={{ width: '80px', textAlign: 'center', marginBottom: '0' }}
                            />
                        </div>

                        <button onClick={askQuestion} disabled={isQuestionActive}>Ask Question</button>
                    </div>
                ) : (
                    <p className="message info">A question is currently active. Please wait for it to finish before asking a new one.</p>
                )}
            </div>

            <div className="bento-box">
                <h2>Live Polling Results</h2>
                {currentQuestion && isQuestionActive && <p className="message info">Current question is active.</p>}
                {currentQuestion && !isQuestionActive && <p className="message info">Poll has closed.</p>}

                {currentQuestion ? (
                    <PollResults question={currentQuestion} results={pollResults} isStudentView={false} />
                ) : (
                    <p>No active question yet. Ask one from the panel on the left!</p>
                )}
            </div>

            <div className="bento-box" style={{ flexBasis: '100%' }}> {/* Full width for student list */}
                <h2>Connected Students ({connectedStudents.length})</h2>
                {connectedStudents.length === 0 ? (
                    <p>No students connected yet.</p>
                ) : (
                    <ul>
                        {connectedStudents.map((student) => (
                            <li key={student.id} className="flex-between mb-5">
                                {student.name}
                                <button onClick={() => kickStudent(student.id, student.name)} style={{ background: 'var(--error-color)', padding: '5px 10px', fontSize: '0.85rem' }}>Kick</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default TeacherDashboard;