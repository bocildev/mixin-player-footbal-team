<script setup lang="ts">
import { useBadmintonStore } from '~/stores/badminton'

const store = useBadmintonStore()
const isCopied = ref(false)

function copyToWhatsApp() {
  if (!store.hasRundown) return
  
  let text = `🏸 *RUNDOWN MABAR BULUTANGKIS* 🏸\n`
  text += `Format: ${store.gameType === 'ganda' ? 'Ganda (Doubles)' : 'Tunggal (Singles)'}\n`
  text += `===============================\n\n`

  for (const session of store.generatedRundown) {
    text += `*🗓️ ${session.name.toUpperCase()}*\n`
    text += `-------------------------------\n`
    for (const match of session.matches) {
      const sideA = match.sideA.join(' & ')
      const sideB = match.sideB.join(' & ')
      text += `🔹 Lap. ${match.courtNumber}: [${sideA}] VS [${sideB}]\n`
    }
    if (session.waitingList.length > 0) {
      text += `🥤 Istirahat: ${session.waitingList.join(', ')}\n`
    }
    text += `\n`
  }
  
  text += `_Dibuat otomatis menggunakan Aplikasi Pengacak Mabar_`

  navigator.clipboard.writeText(text)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}
</script>

<template>
  <div v-if="store.hasRundown" class="space-y-6">
    <!-- Top Action Panel -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 neo-card bg-neo-yellow">
      <div>
        <h3 class="text-lg font-bold uppercase">🎉 Rundown Berhasil Diacak!</h3>
        <p class="text-xs font-bold text-black/75">
          Rotasi bermain seimbang & adil. Semua pemain mendapat giliran yang pas.
        </p>
      </div>
      <button 
        class="neo-btn bg-white w-full sm:w-auto text-sm py-2 px-4 flex items-center justify-center gap-2"
        @click="copyToWhatsApp"
      >
        <span>{{ isCopied ? '✅ Tersalin!' : '📋 Salin ke WhatsApp' }}</span>
      </button>
    </div>

    <!-- Sessions Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        v-for="session in store.generatedRundown" 
        :key="session.id" 
        class="neo-card flex flex-col justify-between"
      >
        <!-- Session Header -->
        <div class="border-b-4 border-neo-black bg-neo-yellow -mx-4 -mt-4 p-3 flex justify-between items-center shadow-[0_4px_0_0_#000]">
          <h4 class="font-bold text-base sm:text-lg uppercase">🗓️ {{ session.name }}</h4>
          <span class="neo-badge bg-white text-xs">
            {{ session.matches.length }} Lapangan Aktif
          </span>
        </div>

        <!-- Court Matches -->
        <div class="space-y-4 my-4 flex-1">
          <div 
            v-for="match in session.matches" 
            :key="match.courtNumber"
            class="border-4 border-neo-black bg-[#00994C] text-white p-3 relative overflow-hidden shadow-neo-sm"
          >
            <!-- Stylized Badminton Court Lines -->
            <div class="absolute inset-0 border-2 border-white/20 pointer-events-none"></div>
            <div class="absolute left-1/2 top-0 bottom-0 border-r-2 border-dashed border-white/30 pointer-events-none"></div>
            
            <div class="relative z-10 flex flex-col justify-between h-full space-y-3">
              <!-- Court Label -->
              <div class="flex justify-between items-center border-b border-white/20 pb-1.5">
                <span class="text-xs font-black uppercase bg-black text-white px-2 py-0.5 border border-white">
                  📍 LAPANGAN {{ match.courtNumber }}
                </span>
                <span class="text-[10px] font-bold text-white/80">MATCH IN PROGRESS</span>
              </div>

              <!-- Matchups -->
              <div class="grid grid-cols-1 sm:grid-cols-7 items-center gap-2 text-center py-1">
                <!-- Side A -->
                <div class="sm:col-span-3 bg-white text-neo-black border-2 border-neo-black p-2 font-bold text-sm shadow-neo-sm">
                  <div v-for="player in match.sideA" :key="player" class="truncate">
                    🏸 {{ player }}
                  </div>
                </div>

                <!-- VS Badge -->
                <div class="sm:col-span-1 flex justify-center">
                  <span class="bg-neo-red border-2 border-neo-black text-white px-2 py-1 text-xs font-black rotate-[-6deg] shadow-neo-sm">
                    VS
                  </span>
                </div>

                <!-- Side B -->
                <div class="sm:col-span-3 bg-white text-neo-black border-2 border-neo-black p-2 font-bold text-sm shadow-neo-sm">
                  <div v-for="player in match.sideB" :key="player" class="truncate">
                    🏸 {{ player }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Waiting List / Rest Section -->
        <div class="border-t-4 border-neo-black bg-neo-bg -mx-4 -mb-4 p-3 rounded-b">
          <h5 class="text-xs font-bold uppercase text-gray-700 mb-1 flex items-center gap-1">
            <span>🥤 Sedang Istirahat :</span>
            <span class="neo-badge bg-white text-[10px] py-0 px-1">{{ session.waitingList.length }} Orang</span>
          </h5>
          <div v-if="session.waitingList.length > 0" class="flex flex-wrap gap-1 mt-1">
            <span 
              v-for="player in session.waitingList" 
              :key="player"
              class="neo-badge bg-white text-xs py-0.5 px-2 border"
            >
              😴 {{ player }}
            </span>
          </div>
          <p v-else class="text-xs font-bold text-green-700 italic">
            Semua pemain bermain di sesi ini!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
