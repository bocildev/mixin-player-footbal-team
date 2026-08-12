<script setup lang="ts">
import { validatePlayerName } from '~/utils/validation'

const props = withDefaults(defineProps<{
  players: string[]
  goalkeepers?: string[]
  staticData?: string[]
  showGoalkeepers?: boolean
}>(), {
  goalkeepers: () => [],
  staticData: () => [],
  showGoalkeepers: true
})

const emit = defineEmits<{
  'update:players': [value: string[]]
  'update:goalkeepers': [value: string[]]
  'load-static': []
}>()

const activeTab = ref<'player' | 'gk'>('player')
const gender = ref<'M'|'F'>('M')
const inputName = ref('')
const inputError = ref('')

function addCurrent() {
  const validation = validatePlayerName(inputName.value)
  if (!validation.isValid) {
    inputError.value = validation.errorMessage ?? ''
    return
  }
  const name = inputName.value.trim()
  if (activeTab.value === 'gk') {
    emit('update:goalkeepers', [...props.goalkeepers, name])
  } else {
    emit('update:players', [...props.players, name])
  }
  inputName.value = ''
  inputError.value = ''
}

function removeCurrent(index: number) {
  if (activeTab.value === 'gk') {
    const updated = [...props.goalkeepers]
    updated.splice(index, 1)
    emit('update:goalkeepers', updated)
  } else {
    const updated = [...props.players]
    updated.splice(index, 1)
    emit('update:players', updated)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') addCurrent()
}

function handleBulkAdd(payload: { players: string[]; goalkeepers: string[] }) {
  const existingPlayers = new Set(props.players.map(p => p.toLowerCase()))
  const newPlayers = payload.players.filter(p => !existingPlayers.has(p.toLowerCase()))
  
  if (!props.showGoalkeepers) {
    const newGksAsPlayers = payload.goalkeepers.filter(p => !existingPlayers.has(p.toLowerCase()))
    const combined = [...newPlayers, ...newGksAsPlayers]
    if (combined.length > 0) emit('update:players', [...props.players, ...combined])
  } else {
    if (newPlayers.length > 0) emit('update:players', [...props.players, ...newPlayers])

    const existingGks = new Set((props.goalkeepers ?? []).map(p => p.toLowerCase()))
    const newGks = payload.goalkeepers.filter(p => !existingGks.has(p.toLowerCase()))
    if (newGks.length > 0) emit('update:goalkeepers', [...(props.goalkeepers ?? []), ...newGks])
  }
}

const currentList = computed(() => activeTab.value === 'gk' ? props.goalkeepers : props.players)
const placeholder = computed(() => activeTab.value === 'gk' ? 'Nama kiper...' : 'Nama pemain...')
</script>

<template>
  <div class="neo-card p-3 sm:p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base sm:text-xl font-bold uppercase tracking-wide">👥 Peserta</h2>
      <div class="flex gap-1">
        <span v-if="showGoalkeepers" class="neo-badge bg-neo-green text-xs">🧤 {{ (goalkeepers ?? []).length }}</span>
        <span class="neo-badge text-xs">{{ showGoalkeepers ? '⚽' : '🏸' }} {{ players.length }}</span>
      </div>
    </div>

    <!-- Tabs -->
    <div v-if="showGoalkeepers" class="flex border-4 border-neo-black mb-3">
      <button
        class="flex-1 py-2 font-bold text-xs sm:text-sm uppercase transition-colors"
        :class="activeTab === 'player' ? 'bg-neo-yellow' : 'bg-white'"
        @click="activeTab = 'player'"
      >
        ⚽ Pemain ({{ players.length }})
      </button>
      <button
        class="flex-1 py-2 font-bold text-xs sm:text-sm uppercase border-l-4 border-neo-black transition-colors"
        :class="activeTab === 'gk' ? 'bg-neo-green' : 'bg-white'"
        @click="activeTab = 'gk'"
      >
        🧤 Kiper ({{ (goalkeepers ?? []).length }})
      </button>
    </div>

    <!-- Input row -->
    <div class="flex gap-2 mb-2">
      <input
        v-model="inputName"
        type="text"
        :placeholder="placeholder"
        class="neo-input flex-1 text-sm sm:text-base py-2 sm:py-3"
        @keydown="handleKeydown"
        @input="inputError = ''"
      />
      <button
        class="neo-btn px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base whitespace-nowrap"
        :class="activeTab === 'gk' ? 'bg-neo-green' : 'bg-neo-yellow'"
        @click="addCurrent"
      >
        + Tambah
      </button>
    </div>

    <!-- Inline error -->
    <p v-if="inputError" class="text-neo-red font-bold text-xs sm:text-sm mb-2 border-2 border-neo-red px-2 py-1">
      {{ inputError }}
    </p>

    <!-- Bulk input -->
    <div class="mb-3">
      <BulkPlayerInput @add-players="handleBulkAdd" />
    </div>

    <!-- Load static data -->
    <button
      v-if="staticData.length > 0"
      class="neo-btn-secondary text-xs sm:text-sm mb-3 w-full py-2"
      @click="emit('load-static')"
    >
      📂 Muat Data Default
    </button>

    <!-- Player chips -->
    <div v-if="currentList.length > 0" class="flex flex-wrap gap-1.5 sm:gap-2 mt-1 max-h-40 overflow-y-auto">
      <div
        v-for="(name, index) in currentList"
        :key="index"
        class="neo-tag text-xs sm:text-sm py-0.5 sm:py-1"
        :class="activeTab === 'gk' ? 'bg-neo-green' : ''"
      >
        <span>{{ activeTab === 'gk' ? '🧤' : (showGoalkeepers ? '⚽' : '🏸') }} {{ name }}</span>
        <button
          class="ml-1 font-bold text-neo-red hover:text-neo-black"
          @click="removeCurrent(index)"
          :aria-label="`Hapus ${name}`"
        >✕</button>
      </div>
    </div>

    <p v-else class="text-gray-500 font-bold text-xs sm:text-sm mt-2 italic">
      {{ activeTab === 'gk' ? 'Belum ada kiper. Kiper bersifat opsional.' : 'Belum ada pemain.' }}
    </p>
  </div>
</template>
