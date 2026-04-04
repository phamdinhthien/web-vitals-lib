<template>
  <div class="home">
    <section class="hero">
      <img
        src="https://picsum.photos/1200/600"
        alt="Hero image"
        class="hero-image"
        @load="imageLoaded = true"
      />
      <div class="hero-overlay">
        <h1 class="hero-title">Web Vitals Monitoring</h1>
        <p class="hero-subtitle">
          Track Core Web Vitals in real-time. This page demonstrates LCP (hero image),
          FCP (heading text), and INP (interactive button) measurements.
        </p>
        <button class="hero-button" @click="handleClick">
          Clicked {{ clickCount }} times
        </button>
      </div>
    </section>

    <section class="features">
      <div class="feature-card">
        <div class="feature-icon" style="background: #e3f2fd; color: #1565c0;">LCP</div>
        <h3>Largest Contentful Paint</h3>
        <p>The hero image above is the largest contentful element, triggering LCP measurement when it renders.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="background: #e8f5e9; color: #2e7d32;">FCP</div>
        <h3>First Contentful Paint</h3>
        <p>The heading text is among the first elements painted, contributing to a fast FCP score.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="background: #fff3e0; color: #e65100;">INP</div>
        <h3>Interaction to Next Paint</h3>
        <p>Click the button above or interact with elements to measure INP responsiveness.</p>
      </div>
    </section>

    <section class="interaction-demo">
      <h2>Interactive Demo</h2>
      <p>Each interaction below generates INP measurements:</p>
      <div class="button-grid">
        <button
          v-for="(color, index) in colors"
          :key="index"
          class="color-button"
          :style="{ background: activeIndex === index ? color : '#e0e0e0', color: activeIndex === index ? 'white' : '#333' }"
          @click="activeIndex = index"
        >
          Option {{ index + 1 }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const clickCount = ref(0)
const imageLoaded = ref(false)
const activeIndex = ref(-1)
const colors = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff9800', '#795548']

function handleClick() {
  clickCount.value++
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.hero {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.hero-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
}

.hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
}

.hero-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  max-width: 600px;
}

.hero-button {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  background: #6c63ff;
  color: white;
  cursor: pointer;
  transition: transform 0.15s, background 0.2s;
}

.hero-button:hover {
  background: #5a52d5;
}

.hero-button:active {
  transform: scale(0.97);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: #1a1a2e;
}

.feature-card p {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.interaction-demo {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.interaction-demo h2 {
  margin-bottom: 0.5rem;
  color: #1a1a2e;
}

.interaction-demo > p {
  color: #666;
  margin-bottom: 1.5rem;
}

.button-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.color-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.color-button:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}
</style>
