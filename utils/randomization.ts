import type { Team, RandomizeResult } from '~/types/index'

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * Returns a NEW array without mutating the original.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * MODE 1: Distribute by team count.
 * All players are distributed as evenly as possible into N teams.
 * No bench — everyone plays.
 */
export function distributeByTeamCount(
  players: string[],
  teamCount: number,
  goalkeepers: string[] = [],
): RandomizeResult {
  const shuffledPlayers = shuffleArray(players)
  const shuffledGks = shuffleArray(goalkeepers)

  const total = shuffledPlayers.length
  const base = Math.floor(total / teamCount)
  const remainder = total % teamCount

  const teams: Team[] = []
  let idx = 0

  for (let i = 0; i < teamCount; i++) {
    const size = i < remainder ? base + 1 : base
    const teamPlayers = shuffledPlayers.slice(idx, idx + size)
    idx += size
    const gk = shuffledGks[i] ?? null
    teams.push({
      id: `team-${i + 1}`,
      name: `Tim ${i + 1}`,
      gk,
      players: teamPlayers,
      playerCount: teamPlayers.length + (gk ? 1 : 0),
    })
  }

  return { teams, bench: [] }
}

/**
 * MODE 2: Distribute by players per team.
 * `playersPerTeam` is the TOTAL per team including GK.
 * Each team gets 1 GK (if available) + (playersPerTeam - 1) outfield players.
 * If no GKs, all slots are outfield players.
 * Remaining players who don't fill a complete team go to the bench.
 */
export function distributeByPlayersPerTeam(
  players: string[],
  playersPerTeam: number,
  goalkeepers: string[] = [],
): RandomizeResult {
  const shuffledPlayers = shuffleArray(players)
  const shuffledGks = shuffleArray(goalkeepers)

  const hasGks = shuffledGks.length > 0
  // Outfield slots per team: if GKs exist, reserve 1 slot for GK
  const outfieldPerTeam = hasGks ? playersPerTeam - 1 : playersPerTeam

  const teamCount = Math.floor(shuffledPlayers.length / outfieldPerTeam)
  const bench = shuffledPlayers.slice(teamCount * outfieldPerTeam)

  const teams: Team[] = []
  for (let i = 0; i < teamCount; i++) {
    const teamPlayers = shuffledPlayers.slice(i * outfieldPerTeam, (i + 1) * outfieldPerTeam)
    const gk = shuffledGks[i] ?? null
    teams.push({
      id: `team-${i + 1}`,
      name: `Tim ${i + 1}`,
      gk,
      players: teamPlayers,
      playerCount: teamPlayers.length + (gk ? 1 : 0),
    })
  }

  // GKs that didn't get a team also go to bench
  const extraGks = shuffledGks.slice(teamCount)
  const fullBench = [...bench, ...extraGks]

  return { teams, bench: fullBench }
}
