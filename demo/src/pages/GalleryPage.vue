<template>
  <div class="gallery">
    <h1>Image Gallery</h1>
    <p class="intro">
      Browse the gallery to generate LCP and TTFB measurements. Click any image to expand it (INP demo).
    </p>

    <div class="gallery-grid">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="gallery-item"
        @click="openModal(index)"
      >
        <img
          :src="image.src"
          :alt="image.alt"
          loading="lazy"
          class="gallery-image"
        />
        <div class="gallery-caption">{{ image.alt }}</div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="modalIndex !== null" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="closeModal">&times;</button>
          <img
            :src="images[modalIndex].fullSrc"
            :alt="images[modalIndex].alt"
            class="modal-image"
          />
          <div class="modal-info">
            <h3>{{ images[modalIndex].alt }}</h3>
            <p>{{ images[modalIndex].description }}</p>
          </div>
          <div class="modal-nav">
            <button @click="navigate(-1)" :disabled="modalIndex === 0">Previous</button>
            <span>{{ modalIndex + 1 }} / {{ images.length }}</span>
            <button @click="navigate(1)" :disabled="modalIndex === images.length - 1">Next</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const modalIndex = ref(null)

const images = [
  {
    src: 'https://picsum.photos/seed/a1/400/300',
    fullSrc: 'https://picsum.photos/seed/a1/1200/800',
    alt: 'Mountain Landscape',
    description: 'A serene mountain landscape with snow-capped peaks and a clear blue sky.'
  },
  {
    src: 'https://picsum.photos/seed/b2/400/300',
    fullSrc: 'https://picsum.photos/seed/b2/1200/800',
    alt: 'Ocean Sunset',
    description: 'Golden sunset reflecting off calm ocean waters near the coastline.'
  },
  {
    src: 'https://picsum.photos/seed/c3/400/300',
    fullSrc: 'https://picsum.photos/seed/c3/1200/800',
    alt: 'Forest Path',
    description: 'A winding path through a dense, green forest bathed in dappled sunlight.'
  },
  {
    src: 'https://picsum.photos/seed/d4/400/300',
    fullSrc: 'https://picsum.photos/seed/d4/1200/800',
    alt: 'City Skyline',
    description: 'A modern city skyline illuminated at dusk with reflections on the river.'
  },
  {
    src: 'https://picsum.photos/seed/e5/400/300',
    fullSrc: 'https://picsum.photos/seed/e5/1200/800',
    alt: 'Desert Dunes',
    description: 'Sweeping sand dunes under a brilliant orange desert sky at golden hour.'
  },
  {
    src: 'https://picsum.photos/seed/f6/400/300',
    fullSrc: 'https://picsum.photos/seed/f6/1200/800',
    alt: 'Autumn Trees',
    description: 'Vibrant red and orange autumn foliage lining a quiet country road.'
  },
  {
    src: 'https://picsum.photos/seed/g7/400/300',
    fullSrc: 'https://picsum.photos/seed/g7/1200/800',
    alt: 'Waterfall',
    description: 'A powerful waterfall cascading down moss-covered rocks into a clear pool.'
  },
  {
    src: 'https://picsum.photos/seed/h8/400/300',
    fullSrc: 'https://picsum.photos/seed/h8/1200/800',
    alt: 'Starry Night',
    description: 'The Milky Way stretching across the sky above a remote mountain cabin.'
  },
  {
    src: 'https://picsum.photos/seed/i9/400/300',
    fullSrc: 'https://picsum.photos/seed/i9/1200/800',
    alt: 'Tropical Beach',
    description: 'Crystal-clear turquoise water lapping against white sandy shores.'
  }
]

function openModal(index) {
  modalIndex.value = index
}

function closeModal() {
  modalIndex.value = null
}

function navigate(direction) {
  const next = modalIndex.value + direction
  if (next >= 0 && next < images.length) {
    modalIndex.value = next
  }
}
</script>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.gallery h1 {
  color: #1a1a2e;
  font-size: 2rem;
}

.intro {
  color: #666;
  font-size: 1.1rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.gallery-item {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.gallery-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.gallery-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.gallery-caption {
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.modal-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
}

.modal-info {
  padding: 1.25rem 1.5rem;
}

.modal-info h3 {
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.modal-info p {
  color: #666;
  line-height: 1.5;
}

.modal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
}

.modal-nav button {
  padding: 0.5rem 1.25rem;
  border: 1.5px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.modal-nav button:hover:not(:disabled) {
  border-color: #6c63ff;
  color: #6c63ff;
}

.modal-nav button:disabled {
  opacity: 0.4;
  cursor: default;
}

.modal-nav span {
  color: #888;
  font-size: 0.9rem;
}
</style>
