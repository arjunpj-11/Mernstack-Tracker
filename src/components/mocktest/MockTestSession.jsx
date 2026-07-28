import { useEffect, useState } from 'react'
import QuestionCard from './QuestionCard'
import MockTestResult from './MockTestResult'

export default function MockTestSession({ questions, onBack }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(questions.length * 90)
  const [timeUsed, setTimeUsed] = useState(0)

  useEffect(() => {
    if (finished || timeLeft === 0) return

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
      setTimeUsed((u) => Math.min(u + 1, questions.length * 90))
      if (timeLeft === 1) setFinished(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [finished, questions.length, timeLeft])

  const handleAnswer = (optIndex) => {
    setAnswers((prev) => ({ ...prev, [current]: optIndex }))
    setShowResult(true)
  }

  const handleNext = () => {
    setShowResult(false)
    if (current < questions.length - 1) {
      setCurrent(current + 1)
    } else {
      handleFinish()
    }
  }

  const handleFinish = () => setFinished(true)

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const isLowTime = timeLeft < 60

  if (finished) {
    return (
      <MockTestResult
        questions={questions}
        answers={questions.map((_, index) => answers[index])}
        timeUsed={timeUsed}
        onRetry={() => {
          setCurrent(0)
          setAnswers({})
          setShowResult(false)
          setFinished(false)
          setTimeLeft(questions.length * 90)
          setTimeUsed(0)
        }}
        onHome={onBack}
      />
    )
  }

  return (
    <div className="mock-session">
      <div className="mock-session-header">
        <div className="mock-progress-info">
          Question {current + 1} / {questions.length} ·{' '}
          {Object.keys(answers).length} answered
        </div>
        <div className={`mock-timer ${isLowTime ? 'danger' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <button className="mock-nav-btn danger" onClick={handleFinish}>
          Finish Early
        </button>
      </div>

      <div className="prog-bar" style={{ marginBottom: 20 }}>
        <div
          className="prog-bar-fill"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={questions[current]}
        index={current}
        total={questions.length}
        answer={answers[current]}
        onAnswer={handleAnswer}
        showResult={showResult}
      />

      <div className="mock-nav-btns">
        <button
          className="mock-nav-btn secondary"
          onClick={() => {
            setShowResult(false)
            setCurrent(Math.max(0, current - 1))
          }}
          disabled={current === 0}
        >
          ← Previous
        </button>
        <button className="mock-nav-btn primary" onClick={handleNext}>
          {current === questions.length - 1 ? 'Finish →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
