import React from 'react';

function PollResults({ question, results, isStudentView = false, selectedAnswerId = null }) {
    if (!question) {
        return <p>No poll data to display results for.</p>;
    }

    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

    return (
        <div>
            {question && <h3>Question: {question.text}</h3>}
            {Object.keys(results).length === 0 && totalVotes === 0 ? (
                <p>No votes yet.</p>
            ) : (
                <>
                    {question.options.map((option) => {
                        const votes = results[option.id] || 0;
                        const percentage = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(1) : 0;
                        return (
                            <div key={option.id} className="mb-15">
                                <div className="flex-between">
                                    <strong>{option.text}</strong>
                                    <span>{votes} votes ({percentage}%)</span>
                                </div>
                                <div
                                    className={`poll-option-bar ${isStudentView ? (selectedAnswerId === option.id ? 'answer' : '') : 'teacher'}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        );
                    })}
                    <p>Total Votes: <strong>{totalVotes}</strong></p>
                </>
            )}
        </div>
    );
}

export default PollResults;