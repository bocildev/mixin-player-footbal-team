import { defineStore } from 'pinia'
import type { BadmintonMatch, BadmintonSession, BadmintonGameType, BadmintonPlayer } from '~/types/badminton'
import { validatePlayerName } from '~/utils/validation'
import { shuffleArray } from '~/utils/randomization'

export const useBadmintonStore = defineStore('badminton', () => {
  const players = ref<BadmintonPlayer[]>([])
  const gameType = ref<BadmintonGameType>('ganda')
  const courtCount = ref<number>(1)

  // Session mode: 'manual' = user sets session count directly, 'durasi' = auto-calc from time
  const sessionMode = ref<'manual' | 'durasi'>('manual')
  const manualSessionCount = ref<number>(4)
  const totalDurasiMenit = ref<number>(120)  // total mabar duration in minutes
  const durasiPerSesi = ref<number>(15)       // minutes per game/session

  const sessionCount = computed(() => {
    if (sessionMode.value === 'durasi') {
      return Math.max(1, Math.floor(totalDurasiMenit.value / durasiPerSesi.value))
    }
    return manualSessionCount.value
  })

  const generatedRundown = ref<BadmintonSession[]>([])
  const error = ref<string | null>(null)

  // New toggle to enforce gender-balanced matches
  const enforceGenderBalance = ref<boolean>(false)

  const hasPlayers = computed(() => players.value.length > 0)
  const hasRundown = computed(() => generatedRundown.value.length > 0)

  const playersPerMatch = computed(() => gameType.value === 'ganda' ? 4 : 2)

  const canGenerate = computed(() => {
    return players.value.length >= playersPerMatch.value
  })

  function addPlayer(name: string, gender: 'M' | 'F'): boolean {
    const validation = validatePlayerName(name)
    if (!validation.isValid) {
      error.value = validation.errorMessage ?? null
      return false
    }
    const trimmed = name.trim()
    if (players.value.some(p => p.name === trimmed)) {
      error.value = 'Nama pemain sudah ada'
      return false
    }
    players.value.push({ name: trimmed, gender })
    error.value = null
    return true
  }

  function removePlayer(index: number): void {
    if (index >= 0 && index < players.value.length) {
      players.value.splice(index, 1)
    }
  }

  function clearAll(): void {
    players.value = []
    generatedRundown.value = []
    error.value = null
  }

  function generateRundown(): void {
    const pPerMatch = playersPerMatch.value
    if (players.value.length < pPerMatch) {
      error.value = `Butuh minimal ${pPerMatch} pemain untuk format ${gameType.value}`
      return
    }

    const sessions: BadmintonSession[] = []
    
    // Play counts tracking
    const playCounts: Record<string, number> = {}
    // Consecutive wait counts tracking
    const waitCounts: Record<string, number> = {}

    // Partnership and Opponent history matrices to optimize variety
    const partnerHistory: Record<string, Record<string, number>> = {}
    const opponentHistory: Record<string, Record<string, number>> = {}

    // Initialize tracking structures
    for (const player of players.value) {
      playCounts[player] = 0
      waitCounts[player] = 0
      partnerHistory[player] = {}
      opponentHistory[player] = {}
      for (const other of players.value) {
        partnerHistory[player][other] = 0
        opponentHistory[player][other] = 0
      }
    }

    for (let s = 0; s < sessionCount.value; s++) {
      const maxPossibleCourts = Math.floor(players.value.length / pPerMatch)
      const activeCourts = Math.min(courtCount.value, maxPossibleCourts)

      if (activeCourts === 0) break

      const totalPlayersNeeded = activeCourts * pPerMatch

      // Use a Monte Carlo trial approach to find the player selection AND court matchups with the lowest cost
      let bestMatches: BadmintonMatch[] = []
      let bestWaitingList: string[] = []
      let minSessionCost = Infinity

      const trials = 600
      for (let t = 0; t < trials; t++) {
        const testSelected = shuffleArray(players.value)
        const active = testSelected.slice(0, totalPlayersNeeded)
        const waiting = testSelected.slice(totalPlayersNeeded)

        // 1. Play count fairness cost
        const tempPlayCounts = { ...playCounts }
        for (const p of active) {
          tempPlayCounts[p]++
        }
        const counts = Object.values(tempPlayCounts)
        const maxPlay = Math.max(...counts)
        const minPlay = Math.min(...counts)
        const playDiff = maxPlay - minPlay
        
        // Strict penalty for play count difference to guarantee equality
        let playCost = 0
        if (playDiff > 1) {
          playCost = playDiff * 50000
        }

        // 2. Wait limit cost - penalize consecutive sitting out exponentially
        let waitCost = 0
        for (const p of waiting) {
          const newWait = waitCounts[p] + 1
          waitCost += Math.pow(newWait, 3) * 2000
        }

        // 3. Matchup history cost
        let historyCost = 0
        const currentMatches: BadmintonMatch[] = []

        // Shuffle active players to test different court groupings
        const shuffledActive = shuffleArray(active)

        for (let c = 0; c < activeCourts; c++) {
          const courtPlayers = shuffledActive.slice(c * pPerMatch, (c + 1) * pPerMatch)

          if (gameType.value === 'ganda') {
            const p0 = courtPlayers[0]
            const p1 = courtPlayers[1]
            const p2 = courtPlayers[2]
            const p3 = courtPlayers[3]

            // Evaluate all 3 possible splits for Doubles
            const splits = [
              {
                sideA: [p0, p1],
                sideB: [p2, p3],
                pCost: (partnerHistory[p0][p1] + partnerHistory[p2][p3]),
                oCost: (opponentHistory[p0][p2] + opponentHistory[p0][p3] + opponentHistory[p1][p2] + opponentHistory[p1][p3])
              },
              {
                sideA: [p0, p2],
                sideB: [p1, p3],
                pCost: (partnerHistory[p0][p2] + partnerHistory[p1][p3]),
                oCost: (opponentHistory[p0][p1] + opponentHistory[p0][p3] + opponentHistory[p2][p1] + opponentHistory[p2][p3])
              },
              {
                sideA: [p0, p3],
                sideB: [p1, p2],
                pCost: (partnerHistory[p0][p3] + partnerHistory[p1][p2]),
                oCost: (opponentHistory[p0][p1] + opponentHistory[p0][p2] + opponentHistory[p3][p1] + opponentHistory[p3][p2])
              }
            ]

            let bestSplit = splits[0]
            let minSplitCost = Infinity
            for (const split of splits) {
              const splitCost = split.pCost * 8 + split.oCost
              if (splitCost < minSplitCost) {
                minSplitCost = splitCost
                bestSplit = split
              }
            }

            currentMatches.push({
              courtNumber: c + 1,
              sideA: bestSplit.sideA,
              sideB: bestSplit.sideB
            })
            historyCost += minSplitCost
          } else {
            // Singles mode
            const p0 = courtPlayers[0]
            const p1 = courtPlayers[1]
            const splitCost = opponentHistory[p0][p1]

            currentMatches.push({
              courtNumber: c + 1,
              sideA: [p0],
              sideB: [p1]
            })
            historyCost += splitCost
          }
        }

        const totalCost = playCost + waitCost + historyCost

        if (totalCost < minSessionCost) {
          minSessionCost = totalCost
          bestMatches = currentMatches
          bestWaitingList = waiting
        }
      }

      // Record history and update play counts for the selected optimal matchup
      for (const match of bestMatches) {
        if (gameType.value === 'ganda') {
          const a0 = match.sideA[0]
          const a1 = match.sideA[1]
          const b0 = match.sideB[0]
          const b1 = match.sideB[1]

          // Increment partnership history
          partnerHistory[a0][a1]++
          partnerHistory[a1][a0]++
          partnerHistory[b0][b1]++
          partnerHistory[b1][b0]++

          // Increment opponent history
          opponentHistory[a0][b0]++
          opponentHistory[b0][a0]++
          opponentHistory[a0][b1]++
          opponentHistory[b1][a0]++
          opponentHistory[a1][b0]++
          opponentHistory[b0][a1]++
          opponentHistory[a1][b1]++
          opponentHistory[b1][a1]++
        } else {
          const a0 = match.sideA[0]
          const b0 = match.sideB[0]
          opponentHistory[a0][b0]++
          opponentHistory[b0][a0]++
        }
      }

      // Update actual play counts and wait counts
      const activeSet = new Set<string>()
      for (const match of bestMatches) {
        const allActive = [...match.sideA, ...match.sideB]
        for (const p of allActive) {
          playCounts[p]++
          waitCounts[p] = 0
          activeSet.add(p)
        }
      }
      for (const p of players.value) {
        if (!activeSet.has(p)) {
          waitCounts[p]++
        }
      }

      sessions.push({
        id: `session-${s + 1}`,
        name: `Sesi ${s + 1}`,
        matches: bestMatches,
        waitingList: bestWaitingList
      })
    }

    generatedRundown.value = sessions
    error.value = null
  }

  return {
    players, gameType, courtCount,
    sessionMode, manualSessionCount, totalDurasiMenit, durasiPerSesi, sessionCount,
    generatedRundown, error,
    hasPlayers, hasRundown, canGenerate, playersPerMatch,
    addPlayer, removePlayer, clearAll, generateRundown
  }
})
