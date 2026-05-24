import { useMemo, useState } from 'react'
import './App.css'

type Problem = {
  total: number
  groups: number
  answer: number
  story: string
}

const problems: Problem[] = [
  { total: 12, groups: 3, answer: 4, story: '반짝 조개 12개를 탐험대 3팀에게 똑같이 나눠 주세요.' },
  { total: 15, groups: 5, answer: 3, story: '보물 열쇠 15개를 배 5척에 똑같이 실어 주세요.' },
  { total: 18, groups: 6, answer: 3, story: '별사탕 18개를 친구 6명에게 똑같이 나눠 주세요.' },
  { total: 20, groups: 4, answer: 5, story: '진주 20개를 상자 4개에 똑같이 담아 주세요.' },
  { total: 24, groups: 6, answer: 4, story: '황금 동전 24개를 지도 6칸에 똑같이 올려 주세요.' },
  { total: 28, groups: 7, answer: 4, story: '마법 구슬 28개를 등대 7곳에 똑같이 보내 주세요.' },
]

const quizOptions = (answer: number) => {
  const candidates = [answer, Math.max(1, answer - 1), answer + 1]
  return candidates.sort((a, b) => ((a * 17 + b * 7) % 3) - 1)
}

function makeEmptyGroups(count: number) {
  return Array.from({ length: count }, () => 0)
}

function App() {
  const [problemIndex, setProblemIndex] = useState(0)
  const [groups, setGroups] = useState(() => makeEmptyGroups(problems[0].groups))
  const [selectedGroup, setSelectedGroup] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [message, setMessage] = useState('보석을 한 개씩 눌러 팀에 나눠 주세요!')

  const problem = problems[problemIndex]
  const placed = groups.reduce((sum, value) => sum + value, 0)
  const remaining = problem.total - placed
  const isEven = remaining === 0 && groups.every((value) => value === problem.answer)
  const hasOverflow = groups.some((value) => value > problem.answer)
  const options = useMemo(() => quizOptions(problem.answer), [problem.answer])

  const resetForProblem = (nextIndex: number) => {
    const next = problems[nextIndex]
    setProblemIndex(nextIndex)
    setGroups(makeEmptyGroups(next.groups))
    setSelectedGroup(0)
    setQuizDone(false)
    setMessage('새 미션 시작! 보석을 똑같이 나눠 보세요.')
  }

  const addGem = () => {
    if (remaining <= 0) {
      setMessage('모든 보석을 놓았어요. 팀마다 같은지 확인해 볼까요?')
      return
    }

    setGroups((current) => current.map((value, index) => (index === selectedGroup ? value + 1 : value)))
    const nextValue = groups[selectedGroup] + 1
    if (nextValue > problem.answer) {
      setMessage('앗, 이 팀이 조금 많아요. 되돌리기 버튼으로 맞춰 봐요.')
    } else {
      setMessage('좋아요! 다른 팀도 같은 수가 되도록 나눠 주세요.')
    }
  }

  const removeGem = (index: number) => {
    setGroups((current) => current.map((value, groupIndex) => (groupIndex === index ? Math.max(0, value - 1) : value)))
    setMessage('괜찮아요. 하나씩 조절하면 정확히 나눌 수 있어요.')
  }

  const check = () => {
    if (isEven) {
      setMessage(`정답! ${problem.total} ÷ ${problem.groups} = ${problem.answer}. 각 팀이 ${problem.answer}개씩 받았어요.`)
      setScore((value) => value + 10)
      setStreak((value) => value + 1)
    } else if (hasOverflow) {
      setMessage('어떤 팀은 너무 많아요. 모두 같은 수가 되도록 다시 맞춰 봐요.')
      setStreak(0)
    } else {
      setMessage('아직 똑같이 나누는 중이에요. 남은 보석을 계속 놓아 주세요.')
    }
  }

  const answerQuiz = (choice: number) => {
    if (choice === problem.answer) {
      setQuizDone(true)
      setMessage('퀴즈까지 성공! 다음 섬으로 떠날 준비 완료!')
      setScore((value) => value + 5)
    } else {
      setMessage('거의 다 왔어요. 팀 하나가 받은 보석 수를 다시 떠올려 봐요.')
    }
  }

  const nextProblem = () => resetForProblem((problemIndex + 1) % problems.length)

  return (
    <main className="game-shell">
      <div className="scene-bg" />
      <section className="hero-panel">
        <div className="title-block">
          <p className="eyebrow">초등 나눗셈 게임</p>
          <h1>나눗셈 보물섬</h1>
          <p className="mission">{problem.story}</p>
        </div>
        <div className="score-board" aria-label="점수판">
          <span>점수 <b>{score}</b></span>
          <span>연속 성공 <b>{streak}</b></span>
        </div>
      </section>

      <section className="play-board">
        <aside className="guide-card">
          <img src="/assets/division-game/mascot.png" alt="나눗셈 탐험대 마스코트" />
          <div>
            <h2>{problem.total} ÷ {problem.groups} = ?</h2>
            <p>{message}</p>
          </div>
          {isEven && quizDone && <img className="reward" src="/assets/division-game/reward.png" alt="성공 보상 배지" />}
        </aside>

        <div className="activity-card">
          <div className="gem-bank">
            <div>
              <span className="label">남은 보석</span>
              <strong>{remaining}</strong>
            </div>
            <div className="gems" aria-label="남은 보석 표시">
              {Array.from({ length: problem.total }).map((_, index) => (
                <button
                  key={index}
                  className={`gem ${index < remaining ? '' : 'placed'}`}
                  onClick={addGem}
                  disabled={index >= remaining}
                  aria-label="보석 하나 나누기"
                >
                  ◆
                </button>
              ))}
            </div>
          </div>

          <div className="team-grid">
            {groups.map((count, index) => (
              <button
                key={index}
                className={`team ${selectedGroup === index ? 'selected' : ''} ${count === problem.answer ? 'balanced' : ''}`}
                onClick={() => setSelectedGroup(index)}
              >
                <span>{index + 1}팀</span>
                <strong>{count}개</strong>
                <div className="mini-gems">
                  {Array.from({ length: count }).map((_, gemIndex) => <i key={gemIndex}>◆</i>)}
                </div>
              </button>
            ))}
          </div>

          <div className="controls">
            <button onClick={addGem}>선택한 팀에 1개 놓기</button>
            <button className="secondary" onClick={() => removeGem(selectedGroup)}>1개 되돌리기</button>
            <button className="check" onClick={check}>똑같이 나눴는지 확인</button>
          </div>
        </div>

        <aside className="concept-card">
          <h2>나눗셈 생각법</h2>
          <p>나눗셈은 전체를 같은 묶음으로 나눌 때, 한 묶음에 몇 개씩 들어가는지 찾는 방법이에요.</p>
          <div className="formula">{problem.total} ÷ {problem.groups} = <b>{isEven ? problem.answer : '?'}</b></div>

          {isEven && (
            <div className="quiz-card">
              <h3>확인 퀴즈</h3>
              <p>한 팀이 받은 보석은 몇 개일까요?</p>
              <div className="quiz-options">
                {options.map((option) => (
                  <button key={option} onClick={() => answerQuiz(option)}>{option}개</button>
                ))}
              </div>
            </div>
          )}

          <button className="next" onClick={nextProblem} disabled={!quizDone}>다음 미션</button>
        </aside>
      </section>
    </main>
  )
}

export default App
