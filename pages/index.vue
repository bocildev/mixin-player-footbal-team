<script setup lang="ts">
import { useTeamRandomizerStore } from '~/stores/teamRandomizer'
import { useBadmintonStore } from '~/stores/badminton'

const store = useTeamRandomizerStore()
const badmintonStore = useBadmintonStore()

const activeSport = ref<'soccer' | 'badminton'>('soccer')

onMounted(async () => {
  await store.loadStaticData()
})

// Dynamically update SEO meta tags based on active sport
watch(activeSport, (val) => {
  useSeoMeta({
    title: val === 'soccer' ? '⚽ Pengacak Tim Bola' : '🏸 Pengacak Mabar Bulutangkis',
    description: val === 'soccer'
      ? 'Aplikasi untuk mengacak tim sepak bola secara adil dan cepat'
      : 'Aplikasi untuk membuat rundown dan mixing pertandingan bulutangkis secara adil',
  })
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-neo-bg">

    <!-- Header -->
    <header class="border-b-4 border-neo-black bg-neo-yellow px-3 py-3 shadow-neo sticky top-0 z-20">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-lg sm:text-2xl md:text-3xl font-bold uppercase tracking-tight leading-tight flex items-center gap-2">
            <span>{{ activeSport === 'soccer' ? '⚽ Pengacak Tim Bola' : '🏸 Pengacak Mabar Bulutangkis' }}</span>
          </h1>
          <p class="text-xs sm:text-sm font-bold text-black/70 hidden sm:block">
            {{ activeSport === 'soccer' ? 'Bagi pemain ke tim secara acak & adil' : 'Mixing tim ganda/tunggal & rundown adil' }}
          </p>
        </div>
        <div class="neo-badge text-xs">v1.1</div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

      <!-- Sport Selection Tabs -->
      <div class="flex border-4 border-neo-black shadow-neo">
        <button
          class="flex-1 py-3 font-bold text-sm sm:text-base uppercase transition-all flex items-center justify-center gap-2"
          :class="activeSport === 'soccer' ? 'bg-neo-yellow text-neo-black' : 'bg-white'"
          @click="activeSport = 'soccer'"
        >
          <span>⚽ Sepak Bola</span>
        </button>
        <button
          class="flex-1 py-3 font-bold text-sm sm:text-base uppercase border-l-4 border-neo-black transition-all flex items-center justify-center gap-2"
          :class="activeSport === 'badminton' ? 'bg-neo-blue text-white' : 'bg-white'"
          @click="activeSport = 'badminton'"
        >
          <span>🏸 Bulutangkis</span>
        </button>
      </div>

      <!-- Error notification for Soccer -->
      <ErrorNotification
        v-if="activeSport === 'soccer' && store.error"
        :message="store.error"
        type="error"
        @close="store.clearError()"
      />

      <!-- Error notification for Badminton -->
      <ErrorNotification
        v-if="activeSport === 'badminton' && badmintonStore.error"
        :message="badmintonStore.error"
        type="error"
        @close="badmintonStore.error = null"
      />

      <!-- SOCCER VIEW -->
      <div v-if="activeSport === 'soccer'" class="space-y-4 sm:space-y-6">
        <!-- Input section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Player input -->
          <div class="md:col-span-2">
            <PlayerInput
              :players="store.players"
              :goalkeepers="store.goalkeepers"
              :static-data="store.staticPlayerData"
              :show-goalkeepers="true"
              @update:players="store.players = $event"
              @update:goalkeepers="store.goalkeepers = $event"
              @load-static="store.loadStaticDataIntoPlayers()"
            />
          </div>

          <!-- Controls sidebar -->
          <div class="flex flex-col gap-3">
            <TeamModeSelector
              :mode="store.randomizeMode"
              :team-count="store.teamCount"
              :players-per-team="store.playersPerTeam"
              :player-count="store.players.length"
              :preview-team-count="store.previewTeamCount"
              :preview-bench-count="store.previewBenchCount"
              @update:mode="store.setRandomizeMode($event)"
              @update:team-count="store.setTeamCount($event)"
              @update:players-per-team="store.setPlayersPerTeam($event)"
            />

            <!-- Summary -->
            <div class="neo-card bg-neo-bg text-sm font-bold space-y-2 p-3">
              <div class="flex justify-between items-center">
                <span>Pemain</span>
                <span class="neo-badge">{{ store.players.length }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Kiper</span>
                <span class="neo-badge bg-neo-green">{{ store.goalkeepers.length }}</span>
              </div>
              <div class="flex justify-between items-center border-t-2 border-neo-black pt-2">
                <span>Tim terbentuk</span>
                <span class="neo-badge bg-neo-blue text-white">{{ store.previewTeamCount }}</span>
              </div>
              <div v-if="store.previewBenchCount > 0" class="flex justify-between items-center">
                <span>Cadangan</span>
                <span class="neo-badge bg-neo-orange text-white">{{ store.previewBenchCount }}</span>
              </div>
              <p
                v-if="store.goalkeepers.length > 0 && store.goalkeepers.length < store.previewTeamCount"
                class="text-neo-red text-xs border-2 border-neo-red px-2 py-1"
              >
                ⚠️ Kiper ({{ store.goalkeepers.length }}) kurang dari tim ({{ store.previewTeamCount }})
              </p>
            </div>

            <!-- Action buttons — visible on desktop -->
            <RandomizeButton
              :disabled="!store.canRandomize"
              :is-re-randomize="store.hasGeneratedTeams"
              @randomize="store.randomizeTeams()"
            />
            <ClearButton
              v-if="store.hasPlayers || store.hasGeneratedTeams || store.goalkeepers.length > 0"
              @clear="store.clearAll()"
            />
          </div>
        </div>

        <!-- Share URL — shown after teams generated -->
        <ShareButton
          v-if="store.hasGeneratedTeams"
          :teams="store.generatedTeams"
          :bench="store.bench"
        />

        <!-- Bench -->
        <BenchDisplay :bench="store.bench" />

        <!-- Team results -->
        <TeamDisplay :teams="store.generatedTeams" :show-player-count="true" />

        <!-- Empty state -->
        <div
          v-if="!store.hasGeneratedTeams && !store.hasPlayers && store.goalkeepers.length === 0"
          class="neo-card text-center py-10 sm:py-16"
        >
          <p class="text-5xl mb-3">⚽</p>
          <p class="font-bold text-base sm:text-lg">Tambahkan pemain & tentukan mode pembagian</p>
          <p class="text-sm text-gray-600 font-bold mt-1">lalu klik "Acak Tim!"</p>
        </div>
      </div>

      <!-- BADMINTON VIEW -->
      <div v-else class="space-y-4 sm:space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Badminton Player input -->
          <div class="md:col-span-2">
            <PlayerInput
              :players="badmintonStore.players"
              :show-goalkeepers="false"
              @update:players="badmintonStore.players = $event"
            />
          </div>

          <!-- Badminton Controls -->
          <div class="flex flex-col gap-3">
            <BadmintonControls />
          </div>
        </div>

        <!-- Rundown Match Results -->
        <BadmintonRundown />

        <!-- Empty state for Badminton -->
        <div
          v-if="!badmintonStore.hasRundown && !badmintonStore.hasPlayers"
          class="neo-card text-center py-10 sm:py-16"
        >
          <p class="text-5xl mb-3">🏸</p>
          <p class="font-bold text-base sm:text-lg">Tambahkan pemain & atur lapangan/sesi</p>
          <p class="text-sm text-gray-600 font-bold mt-1">lalu klik "Buat Rundown Mabar!"</p>
        </div>
      </div>

    </main>

    <!-- ✅ Sticky bottom bar — always visible on mobile -->
    <div class="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t-4 border-neo-black bg-neo-bg px-3 py-2 flex gap-2 shadow-[0_-4px_0_0_#000]">
      <button
        v-if="activeSport === 'soccer'"
        class="neo-btn flex-1 text-sm py-3"
        :class="[
          store.hasGeneratedTeams ? 'bg-neo-blue text-white' : 'bg-neo-yellow text-neo-black',
          !store.canRandomize ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        :disabled="!store.canRandomize"
        @click="store.randomizeTeams()"
      >
        {{ store.hasGeneratedTeams ? '🔀 Acak Ulang' : '🎲 Acak Tim!' }}
      </button>
      <button
        v-else
        class="neo-btn flex-1 text-sm py-3"
        :class="[
          badmintonStore.hasRundown ? 'bg-neo-blue text-white' : 'bg-neo-yellow text-neo-black',
          !badmintonStore.canGenerate ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        :disabled="!badmintonStore.canGenerate"
        @click="badmintonStore.generateRundown()"
      >
        {{ badmintonStore.hasRundown ? '🔀 Acak Ulang' : '🎲 Buat Rundown 🏸' }}
      </button>
      
      <button
        v-if="activeSport === 'soccer' ? (store.hasPlayers || store.hasGeneratedTeams || store.goalkeepers.length > 0) : (badmintonStore.hasPlayers || badmintonStore.hasRundown)"
        class="neo-btn-danger text-sm py-3 px-4"
        @click="activeSport === 'soccer' ? store.clearAll() : badmintonStore.clearAll()"
      >
        🗑️
      </button>
    </div>

    <!-- Spacer so sticky bar doesn't cover content -->
    <div class="h-20 md:hidden" />

    <footer class="border-t-4 border-neo-black px-4 py-3 text-center">
      <p class="text-xs sm:text-sm font-bold text-black/60">Pengacak Mabar &mdash; Nuxt 3</p>
    </footer>
  </div>
</template>
