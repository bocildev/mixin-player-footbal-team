import { defineStore } from 'pinia'
import type { Team, RandomizeMode } from '~/types/index'
import { distributeByTeamCount, distributeByPlayersPerTeam } from '~/utils/randomization'
import { validatePlayerName, validateTeamCount } from '~/utils/validation'

export const useTeamRandomizerStore = defineStore('teamRandomizer', () => {
  // State
  const players = ref<string[]>([])
  const goalkeepers = ref<string[]>([])
  const teamCount = ref<number>(2)
  const playersPerTeam = ref<number>(5)
  const randomizeMode = ref<RandomizeMode>('by-team-count')
  const generatedTeams = ref<Team[]>([])
  const bench = ref<string[]>([])
  const staticPlayerData = ref<string[]>([])
  const staticGkData = ref<string[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Getters
  const hasPlayers = computed(() => players.value.length > 0)
  const hasGeneratedTeams = computed(() => generatedTeams.value.length > 0)

  const canRandomize = computed(() => {
    if (players.value.length < 2) return false
    if (randomizeMode.value === 'by-team-count') {
      return validateTeamCount(teamCount.value, players.value.length).isValid
    }
    // by-players-per-team: need at least enough for 2 teams
    const hasGks = goalkeepers.value.length > 0
    const outfieldPerTeam = hasGks ? playersPerTeam.value - 1 : playersPerTeam.value
    return players.value.length >= outfieldPerTeam * 2
  })

  const totalParticipants = computed(() => players.value.length + goalkeepers.value.length)

  // Computed preview for by-players-per-team mode
  const previewTeamCount = computed(() => {
    if (randomizeMode.value === 'by-players-per-team') {
      const hasGks = goalkeepers.value.length > 0
      const outfieldPerTeam = hasGks ? playersPerTeam.value - 1 : playersPerTeam.value
      return Math.floor(players.value.length / outfieldPerTeam)
    }
    return teamCount.value
  })

  const previewBenchCount = computed(() => {
    if (randomizeMode.value === 'by-players-per-team') {
      const hasGks = goalkeepers.value.length > 0
      const outfieldPerTeam = hasGks ? playersPerTeam.value - 1 : playersPerTeam.value
      const extra = players.value.length % outfieldPerTeam
      const extraGks = Math.max(0, goalkeepers.value.length - previewTeamCount.value)
      return extra + extraGks
    }
    return 0
  })

  // Player actions
  function addPlayer(name: string): boolean {
    const validation = validatePlayerName(name)
    if (!validation.isValid) { error.value = validation.errorMessage ?? null; return false }
    players.value.push(name.trim())
    error.value = null
    return true
  }

  function removePlayer(index: number): void {
    if (index >= 0 && index < players.value.length) players.value.splice(index, 1)
  }

  function addGoalkeeper(name: string): boolean {
    const validation = validatePlayerName(name)
    if (!validation.isValid) { error.value = validation.errorMessage ?? null; return false }
    goalkeepers.value.push(name.trim())
    error.value = null
    return true
  }

  function removeGoalkeeper(index: number): void {
    if (index >= 0 && index < goalkeepers.value.length) goalkeepers.value.splice(index, 1)
  }

  function setTeamCount(count: number): void {
    teamCount.value = count
    error.value = null
  }

  function setPlayersPerTeam(count: number): void {
    playersPerTeam.value = count
    error.value = null
  }

  function setRandomizeMode(mode: RandomizeMode): void {
    randomizeMode.value = mode
    error.value = null
  }

  async function loadStaticData(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const data = await $fetch<{ version: string; lastUpdated: string; players: string[]; goalkeepers?: string[] }>('/api/players')
      if (data && Array.isArray(data.players)) {
        staticPlayerData.value = data.players
        staticGkData.value = data.goalkeepers ?? []
      } else {
        error.value = 'Format data tidak valid'
      }
    } catch {
      error.value = 'Data pemain default tidak tersedia'
    } finally {
      isLoading.value = false
    }
  }

  function loadStaticDataIntoPlayers(): void {
    if (staticPlayerData.value.length > 0) players.value = [...staticPlayerData.value]
    if (staticGkData.value.length > 0) goalkeepers.value = [...staticGkData.value]
    error.value = null
  }

  function randomizeTeams(): void {
    let result
    if (randomizeMode.value === 'by-team-count') {
      const validation = validateTeamCount(teamCount.value, players.value.length)
      if (!validation.isValid) { error.value = validation.errorMessage ?? null; return }
      result = distributeByTeamCount([...players.value], teamCount.value, [...goalkeepers.value])
    } else {
      const hasGks = goalkeepers.value.length > 0
      const outfieldPerTeam = hasGks ? playersPerTeam.value - 1 : playersPerTeam.value
      if (players.value.length < outfieldPerTeam * 2) {
        error.value = `Butuh minimal ${outfieldPerTeam * 2} pemain untuk membuat 2 tim`
        return
      }
      result = distributeByPlayersPerTeam([...players.value], playersPerTeam.value, [...goalkeepers.value])
    }
    generatedTeams.value = result.teams
    bench.value = result.bench
    error.value = null
  }

  function reRandomizeTeams(): void {
    randomizeTeams()
  }

  function clearAll(): void {
    players.value = []
    goalkeepers.value = []
    teamCount.value = 2
    playersPerTeam.value = 5
    generatedTeams.value = []
    bench.value = []
    error.value = null
  }

  function clearError(): void {
    error.value = null
  }

  return {
    players, goalkeepers, teamCount, playersPerTeam, randomizeMode,
    generatedTeams, bench, staticPlayerData, staticGkData, isLoading, error,
    hasPlayers, hasGeneratedTeams, canRandomize, totalParticipants,
    previewTeamCount, previewBenchCount,
    addPlayer, removePlayer, addGoalkeeper, removeGoalkeeper,
    setTeamCount, setPlayersPerTeam, setRandomizeMode,
    loadStaticData, loadStaticDataIntoPlayers,
    randomizeTeams, reRandomizeTeams, clearAll, clearError,
  }
})
