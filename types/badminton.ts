export interface BadmintonMatch {
  courtNumber: number
  sideA: string[]
  sideB: string[]
}

export interface BadmintonSession {
  id: string
  name: string
  matches: BadmintonMatch[]
  waitingList: string[]
}

export type BadmintonGameType = 'tunggal' | 'ganda'
