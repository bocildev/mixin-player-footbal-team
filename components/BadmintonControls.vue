<script setup lang="ts">
import { useBadmintonStore } from '~/stores/badminton'

const store = useBadmintonStore()
</script>

<template>
  <div class="neo-card p-4 space-y-4">
    <h2 class="text-lg sm:text-xl font-bold uppercase tracking-wide">⚙️ Pengaturan Mabar</h2>

    <!-- Game Type Tab Selector -->
    <div>
      <label class="block text-xs sm:text-sm font-bold uppercase mb-1">Format Game</label>
      <div class="flex border-4 border-neo-black">
        <button
          class="flex-1 py-2.5 font-bold text-xs sm:text-sm uppercase transition-colors"
          :class="store.gameType === 'ganda' ? 'bg-neo-blue text-white' : 'bg-white'"
          @click="store.gameType = 'ganda'"
        >
          🏸 Ganda (Doubles)
        </button>
        <button
          class="flex-1 py-2.5 font-bold text-xs sm:text-sm uppercase border-l-4 border-neo-black transition-colors"
          :class="store.gameType === 'tunggal' ? 'bg-neo-yellow text-neo-black' : 'bg-white'"
          @click="store.gameType = 'tunggal'"
        >
          👤 Tunggal (Singles)
        </button>
      </div>
    </div>

    <!-- Court Count & Session Mode selector -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="court-count" class="block text-xs sm:text-sm font-bold uppercase mb-1">Jumlah Lapangan</label>
        <input
          id="court-count"
          v-model.number="store.courtCount"
          type="number"
          min="1"
          max="10"
          class="neo-input py-2 text-center"
        />
      </div>
      <div>
        <label class="block text-xs sm:text-sm font-bold uppercase mb-1">Mode Sesi</label>
        <div class="flex border-4 border-neo-black">
          <button
            class="flex-1 py-2.5 font-bold text-xs sm:text-sm uppercase transition-colors"
            :class="store.sessionMode === 'manual' ? 'bg-neo-blue text-white' : 'bg-white'"
            @click="store.sessionMode = 'manual'"
          >Manual</button>
          <button
            class="flex-1 py-2.5 font-bold text-xs sm:text-sm uppercase border-l-4 border-neo-black transition-colors"
            :class="store.sessionMode === 'durasi' ? 'bg-neo-green text-white' : 'bg-white'"
            @click="store.sessionMode = 'durasi'"
          >Durasi</button>
        </div>
      </div>
    </div>
    <!-- Conditional inputs based on selected mode -->
    <div v-if="store.sessionMode === 'manual'" class="mt-2">
      <label for="manual-session-count" class="block text-xs sm:text-sm font-bold uppercase mb-1">Jumlah Sesi</label>
      <input
        id="manual-session-count"
        v-model.number="store.manualSessionCount"
        type="number"
        min="1"
        max="20"
        class="neo-input py-2 text-center w-full"
      />
    </div>
    <div v-else class="mt-2 grid grid-cols-2 gap-3">
      <div>
        <label for="total-durasi" class="block text-xs sm:text-sm font-bold uppercase mb-1">Durasi Total (menit)</label>
        <input
          id="total-durasi"
          v-model.number="store.totalDurasiMenit"
          type="number"
          min="15"
          class="neo-input py-2 text-center w-full"
        />
      </div>
      <div>
        <label for="durasi-per-sesi" class="block text-xs sm:text-sm font-bold uppercase mb-1">Durasi per Sesi (menit)</label>
        <input
          id="durasi-per-sesi"
          v-model.number="store.durasiPerSesi"
          type="number"
          min="5"
          class="neo-input py-2 text-center w-full"
        />
      </div>
    </div>

    <!-- Stats Preview Box -->
    <div class="neo-card bg-neo-bg text-xs font-bold space-y-2 p-3">
      <div class="flex justify-between items-center">
        <span>Total Pemain</span>
        <span class="neo-badge bg-white">{{ store.players.length }} orang</span>
      </div>
      <div class="flex justify-between items-center">
        <span>Pemain per Pertandingan</span>
        <span class="neo-badge bg-white">{{ store.playersPerMatch }} orang</span>
      </div>
      <div class="flex justify-between items-center">
        <span>Kebutuhan Lapangan (Maks)</span>
        <span class="neo-badge bg-white">
          {{ Math.max(0, Math.floor(store.players.length / store.playersPerMatch)) }} Lapangan
        </span>
      </div>
      <div class="flex justify-between items-center">
        <span>Lapangan Aktif Terpakai</span>
        <span class="neo-badge bg-neo-yellow">
          {{ Math.min(store.courtCount, Math.max(0, Math.floor(store.players.length / store.playersPerMatch))) }} Lapangan
        </span>
      </div>
      <div class="flex justify-between items-center border-t-2 border-neo-black pt-2">
        <span>Bermain per Sesi</span>
        <span class="neo-badge bg-neo-green text-white">
          {{ Math.min(store.courtCount, Math.max(0, Math.floor(store.players.length / store.playersPerMatch))) * store.playersPerMatch }} orang
        </span>
      </div>
      <div class="flex justify-between items-center">
        <span>Istirahat per Sesi</span>
        <span class="neo-badge bg-neo-orange text-white">
          {{ store.players.length - (Math.min(store.courtCount, Math.max(0, Math.floor(store.players.length / store.playersPerMatch))) * store.playersPerMatch) }} orang
        </span>
      </div>
    </div>

    <!-- Main action button for generating -->
    <div class="space-y-2 pt-2">
      <button
        class="neo-btn w-full text-sm py-3 flex items-center justify-center gap-2"
        :class="[
          store.hasRundown ? 'bg-neo-blue text-white' : 'bg-neo-yellow text-neo-black',
          !store.canGenerate ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        :disabled="!store.canGenerate"
        @click="store.generateRundown()"
      >
        <span>{{ store.hasRundown ? '🔀 Acak Ulang Rundown' : '🎲 Buat Rundown Mabar 🏸' }}</span>
      </button>
      
      <button
        v-if="store.hasPlayers || store.hasRundown"
        class="neo-btn-danger w-full text-sm py-3"
        @click="store.clearAll()"
      >
        🗑️ Hapus & Reset Semua
      </button>
    </div>
  </div>
</template>
