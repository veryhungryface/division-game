import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import './App.css'

type Problem = {
  total: number
  groups: number
  answer: number
  item: string
  story: string
  hint: string
}

const problems: Problem[] = [
  { total: 12, groups: 3, answer: 4, item: '빛조개', story: '빛조개 12개를 탐험대 3팀에게 똑같이 나눠 주세요.', hint: '전체 12개를 3묶음으로 나누면 한 묶음은 4개예요.' },
  { total: 15, groups: 5, answer: 3, item: '열쇠', story: '보물 열쇠 15개를 배 5척에 똑같이 실어 주세요.', hint: '15개를 5묶음으로 나누면 한 묶음에 3개씩 들어가요.' },
  { total: 18, groups: 6, answer: 3, item: '별사탕', story: '별사탕 18개를 친구 6명에게 똑같이 나눠 주세요.', hint: '6명이 같은 수를 받으려면 한 명에게 3개씩이에요.' },
  { total: 20, groups: 4, answer: 5, item: '진주', story: '진주 20개를 상자 4개에 똑같이 담아 주세요.', hint: '20을 4번 똑같이 덜어내면 5씩 남아요.' },
  { total: 24, groups: 6, answer: 4, item: '동전', story: '황금 동전 24개를 지도 6칸에 똑같이 올려 주세요.', hint: '24개를 6묶음으로 나누면 각 묶음은 4개예요.' },
  { total: 28, groups: 7, answer: 4, item: '구슬', story: '마법 구슬 28개를 등대 7곳에 똑같이 보내 주세요.', hint: '28을 7묶음으로 나누면 한 곳에 4개씩 가요.' },
]

function makeEmptyGroups(count: number) {
  return Array.from({ length: count }, () => 0)
}

function quizOptions(answer: number, seed: number) {
  const set = new Set([answer, Math.max(1, answer - 1), answer + 1])
  while (set.size < 3) set.add(answer + set.size)
  return [...set].sort((a, b) => ((a * 13 + seed * 7) % 5) - ((b * 13 + seed * 7) % 5))
}

function App() {
  const [problemIndex, setProblemIndex] = useState(0)
  const [groups, setGroups] = useState(() => makeEmptyGroups(problems[0].groups))
  const [selectedGroup, setSelectedGroup] = useState(0)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [message, setMessage] = useState('보물을 끌어서 원하는 팀 상자에 넣어 보세요.')

  const problem = problems[problemIndex]
  const placed = groups.reduce((sum, value) => sum + value, 0)
  const remaining = problem.total - placed
  const progress = Math.round((placed / problem.total) * 100)
  const isEven = remaining === 0 && groups.every((value) => value === problem.answer)
  const hasOverflow = groups.some((value) => value > problem.answer)
  const options = useMemo(() => quizOptions(problem.answer, problemIndex), [problem.answer, problemIndex])

  const updateGroup = (index: number, delta: number) => {
    setGroups((current) => current.map((value, groupIndex) => groupIndex === index ? Math.max(0, value + delta) : value))
  }

  const addTreasure = (index = selectedGroup, viaDrop = false) => {
    if (remaining <= 0) {
      setMessage('모든 보물이 상자에 들어갔어요. 공평한지 확인해 볼까요?')
      return
    }
    updateGroup(index, 1)
    setSelectedGroup(index)
    setChecked(false)
    setQuizDone(false)
    setSelectedAnswer(null)
    const nextValue = groups[index] + 1
    if (nextValue > problem.answer) setMessage(`${index + 1}팀 상자가 목표보다 많아요. 하나 되돌려 균형을 맞춰 보세요.`)
    else if (remaining === 1) setMessage('마지막 보물까지 들어갔어요. 이제 정답 확인을 눌러 보세요!')
    else setMessage(viaDrop ? `${index + 1}팀 상자에 쏙! 계속 공평하게 나눠 보세요.` : `${index + 1}팀에 1개 전달! 드래그해서 넣어도 좋아요.`)
  }

  const removeTreasure = (index = selectedGroup) => {
    updateGroup(index, -1)
    setChecked(false)
    setQuizDone(false)
    setSelectedAnswer(null)
    setMessage('좋아요. 상자에서 하나 꺼내며 다시 균형을 맞출 수 있어요.')
  }

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', 'treasure')
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (event: DragEvent<HTMLElement>, index: number) => {
    event.preventDefault()
    setDropTarget(null)
    addTreasure(index, true)
  }

  const check = () => {
    const wasChecked = checked
    setChecked(true)
    if (isEven) {
      setMessage(`완벽해요! ${problem.total} ÷ ${problem.groups} = ${problem.answer}. 각 상자에 ${problem.answer}개씩 들어갔어요.`)
      if (!wasChecked) {
        setScore((value) => value + 120 + streak * 20)
        setStreak((value) => value + 1)
      }
    } else if (hasOverflow) {
      setMessage('한 상자가 조금 많이 받았어요. 상자별 개수를 비교해 보세요.')
      setStreak(0)
    } else if (remaining > 0) {
      setMessage(`아직 ${remaining}개가 남았어요. 남은 보물도 상자에 넣어 주세요.`)
    } else {
      setMessage('모두 넣었지만 상자마다 개수가 달라요. 한 상자씩 개수를 맞춰 보세요.')
      setStreak(0)
    }
  }

  const answerQuiz = (choice: number) => {
    setSelectedAnswer(choice)
    if (choice === problem.answer) {
      setQuizDone(true)
      setMessage('개념 확인까지 성공! 다음 섬으로 이동할 수 있어요.')
      setScore((value) => value + 80)
    } else {
      setMessage('정답은 한 상자에 들어간 보물 수예요. 팀 상자의 개수를 다시 확인해 보세요.')
    }
  }

  const nextProblem = () => {
    const next = (problemIndex + 1) % problems.length
    setProblemIndex(next)
    setGroups(makeEmptyGroups(problems[next].groups))
    setSelectedGroup(0)
    setDropTarget(null)
    setQuizDone(false)
    setSelectedAnswer(null)
    setChecked(false)
    setMessage('새로운 섬에 도착했어요. 이번에도 보물을 공평하게 나눠 봐요!')
  }

  return (
    <main className="app-shell">
      <div className="background-layer" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="top-nav" aria-label="게임 상태">
        <div className="brand-lockup">
          <span className="brand-mark">÷</span>
          <div>
            <strong>나눗셈 보물섬</strong>
            <small>{problem.story}</small>
          </div>
        </div>
        <div className="nav-stats">
          <span>점수 <b>{score.toLocaleString()}</b></span>
          <span>연속 <b>{streak}</b></span>
          <span>미션 <b>{problemIndex + 1}/{problems.length}</b></span>
        </div>
      </nav>

      <section className="mission-brief glass-card">
        <div>
          <span className="product-badge">Drag & Divide</span>
          <h1>{problem.total} ÷ {problem.groups} = ?</h1>
        </div>
        <p>{message}</p>
        <div className="brief-actions">
          <button onClick={check} className="primary-action">정답 확인</button>
          <button onClick={() => removeTreasure()} className="ghost-action">선택 상자 1개 꺼내기</button>
        </div>
      </section>

      <section className="mission-grid">
        <aside className="mission-card glass-card">
          <div className="card-kicker">진행 상황</div>
          <div className="progress-block" aria-label="나누기 진행률">
            <div className="progress-top"><span>상자에 넣은 보물</span><b>{placed}/{problem.total}</b></div>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="formula-chip">목표: 각 상자 {problem.answer}개씩</div>
          <div className="mascot-note">
            <img src="/assets/division-game/mascot-cutout.png" alt="나눗셈 탐험가" />
            <span>보물을 끌어 상자 위에 놓으면 들어가요.</span>
          </div>
        </aside>

        <section className="game-stage glass-card">
          <div className="stage-header">
            <div>
              <span className="card-kicker">Treasure Dock</span>
              <h2>남은 보물 {remaining}개</h2>
            </div>
            <span className="drag-guide">드래그 → 상자에 놓기</span>
          </div>

          <div className="treasure-bank" aria-label="남은 보물">
            {Array.from({ length: problem.total }).map((_, index) => (
              <button
                key={index}
                className={`treasure ${index < remaining ? '' : 'is-placed'}`}
                onClick={() => addTreasure()}
                draggable={index < remaining}
                onDragStart={handleDragStart}
                disabled={index >= remaining}
                aria-label={`${problem.item} 하나를 끌어서 나누기`}
                title="상자로 끌어 넣어 보세요"
              >
                <img src="/assets/division-game/treasure-cutout.png" alt="" />
              </button>
            ))}
          </div>

          <div className="teams-wrap">
            {groups.map((count, index) => {
              const balanced = count === problem.answer
              const over = count > problem.answer
              return (
                <article
                  key={index}
                  className={`team-card ${selectedGroup === index ? 'selected' : ''} ${dropTarget === index ? 'drop-ready' : ''} ${balanced ? 'balanced' : ''} ${over ? 'over' : ''}`}
                  onDragOver={(event) => { event.preventDefault(); setDropTarget(index) }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(event) => handleDrop(event, index)}
                >
                  <button className="team-main" onClick={() => setSelectedGroup(index)}>
                    <span>{index + 1}팀 상자</span>
                    <strong>{count}<em>개</em></strong>
                    <small>{balanced ? '균형 완료' : over ? '조금 많아요' : '여기에 넣기'}</small>
                  </button>
                  <button className="chest-drop" onClick={() => addTreasure(index)} aria-label={`${index + 1}팀 상자에 보물 넣기`}>
                    <img src="/assets/division-game/chest-cutout.png" alt="" />
                    <span>드롭존</span>
                  </button>
                  <div className="team-gems">
                    {Array.from({ length: Math.max(count, problem.answer) }).map((_, gemIndex) => (
                      <img key={gemIndex} className={gemIndex < count ? 'filled' : ''} src="/assets/division-game/treasure-cutout.png" alt="" />
                    ))}
                  </div>
                  <div className="team-controls">
                    <button onClick={() => addTreasure(index)}>+1</button>
                    <button onClick={() => removeTreasure(index)}>-1</button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="learning-panel glass-card">
          <div className="card-kicker">Concept Check</div>
          <h2>같은 묶음으로 나누기</h2>
          <p>나눗셈은 전체를 같은 수의 묶음으로 나누고, 한 묶음에 몇 개가 들어가는지 찾는 방법이에요.</p>
          <div className="equation-card">
            <span>{problem.total}</span>
            <em>÷</em>
            <span>{problem.groups}</span>
            <em>=</em>
            <strong>{isEven ? problem.answer : '?'}</strong>
          </div>
          {checked && isEven && (
            <div className="quiz-module">
              <h3>한 상자에 들어간 보물은 몇 개일까요?</h3>
              <div className="quiz-options">
                {options.map((option) => (
                  <button
                    key={option}
                    className={selectedAnswer === option ? (option === problem.answer ? 'correct' : 'wrong') : ''}
                    onClick={() => answerQuiz(option)}
                  >
                    {option === problem.answer && quizDone ? '✓ ' : ''}{option}개
                  </button>
                ))}
              </div>
              <p className="hint-text">{problem.hint}</p>
            </div>
          )}
          {quizDone && (
            <div className="reward-strip">
              <img src="/assets/division-game/reward-cutout.png" alt="성공 보상" />
              <span>보상 획득!</span>
            </div>
          )}
          <button className="next-mission" onClick={nextProblem} disabled={!quizDone}>다음 미션으로 이동</button>
        </aside>
      </section>
    </main>
  )
}

export default App
