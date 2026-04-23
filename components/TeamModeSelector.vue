<script setup lang="ts">
import type { RandomizeMode } from '~/types/index'

const props = defineProps<{
  mode: RandomizeMode
  teamCount: number
  playersPerTeam: number
  playerCount: number
  previewTeamCount: number
  previewBenchCount: number
}>()

const emit = defineEmits<{
  'update:mode': [value: RandomizeMode]
  'update:teamCount': [value: number]
  'update:playersPerTeam': [value: number]
}>()

function decTeams() {
  if (props.teamCount > 2) emit('update:teamCount', props.teamCount - 1)
}
function incTeams() { emit('update:teamCount', props.teamCount + 1) }

function decPPT() {
  if (props.playersPerTeam > 1) emit('update:playersPerTeam', props.playersPerTeam - 1)
}
function incPPT() { emit('update:playersPerTeam', props.playersPerTeam + 1) }
</script>

<template>
  <div class="neo-card p-3 sm:p-4 space-y-3">
    <h2 class="text-base sm:text-xl font-bold uppercase tracking-wide">⚙️ Mode Pembagian</h2>

    <!-- Mode toggle -->
    <div class="flex border-4 border-neo-black">
      <button
        class="flex-1 py-2 text-xs sm:text-sm font-bold uppercase transition-colors leading-tight px-1"
        :class="mode === 'by-team-count' ? 'bg-neo-yellow' : 'bg-white'"
        @click="emit('update:mode', 'by-team-count')"
      >
        🏆 Jumlah Tim
      </button>
      <button
        class="flex-1 py-2 text-xs sm:text-sm font-bold uppercase border-l-4 border-neo-black transition-colors leading-tight px-1"
        :class="mode === 'by-players-per-team' ? 'bg-neo-blue text-white' : 'bg-white'"
        @click="emit('update:mode', 'by-players-per-team')"
      >
        👥 Per Tim
      </button>
    </div>

    <!-- Mode: by team count -->
    <div v-if="mode === 'by-team-count'">
      <p class="text-xs font-bold text-gray-600 mb-2">Semua pemain dibagi rata ke N tim</p>
      <div class="flex items-center gap-2">
        <button class="neo-btn w-10 h-10 text-xl p-0 shrink-0" @click="decTeams" :disabled="teamCount <= 2">−</button>
        <div class="neo-input text-center text-xl font-bold flex-1 py-2 cursor-default select-none">
          {{ teamCount }}
        </div>
        <button class="neo-btn w-10 h-10 text-xl p-0 shrink-0" @click="incTeams">+</button>
      </div>
      <p class="text-xs font-bold text-gray-600 mt-2">
        {{ playerCount }} pemain → {{ teamCount }} tim
        (~{{ playerCount > 0 ? Math.ceil(playerCount / teamCount) : 0 }} per tim)
      </p>
    </div>

    <!-- Mode: by players per team -->
    <div v-else>
      <p class="text-xs font-bold text-gray-600 mb-2">
        Tentukan berapa pemain per tim. Sisa yang tidak kebagian masuk cadangan.
      </p>
      <div class="flex items-center gap-2">
        <button class="neo-btn w-10 h-10 text-xl p-0 shrink-0" @click="decPPT" :disabled="playersPerTeam <= 1">−</button>
        <div class="neo-input text-center text-xl font-bold flex-1 py-2 cursor-default select-none">
          {{ playersPerTeam }}
        </div>
        <button class="neo-btn w-10 h-10 text-xl p-0 shrink-0" @click="incPPT">+</button>
      </div>

      <!-- Preview -->
      <div class="mt-2 space-y-1 text-xs font-bold">
        <div class="flex justify-between">
          <span>Tim terbentuk</span>
          <span class="neo-badge bg-neo-blue text-white">{{ previewTeamCount }} tim</span>
        </div>
        <div class="flex justify-between">
          <span>Total per tim</span>
          <span class="neo-badge">{{ playersPerTeam }} orang</span>
        </div>
        <div v-if="previewBenchCount > 0" class="flex justify-between">
          <span>Cadangan / bebas</span>
          <span class="neo-badge bg-neo-orange text-white">{{ previewBenchCount }} orang</span>
        </div>
        <p v-if="previewTeamCount < 2 && playerCount > 0" class="text-neo-red border-2 border-neo-red px-2 py-1">
          ⚠️ Butuh lebih banyak pemain untuk 2 tim
        </p>
      </div>
    </div>
  </div>
</template>
