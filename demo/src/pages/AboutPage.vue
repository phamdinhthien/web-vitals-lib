<template>
  <div class="about">
    <h1>About Web Vitals</h1>
    <p class="intro">This page demonstrates CLS (layout shift from delayed content) and INP (form interactions).</p>

    <section class="dynamic-content">
      <h2>Dynamic Content Loading (CLS Demo)</h2>
      <div class="content-area">
        <div v-if="loading" class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading content...</span>
        </div>
        <div v-else class="loaded-content">
          <img
            src="https://picsum.photos/800/300"
            alt="Dynamic content image"
            class="dynamic-image"
          />
          <p>
            This content loaded after a 500ms delay, causing a layout shift (CLS).
            In a real application, reserving space for dynamic content with fixed
            dimensions or aspect-ratio prevents CLS. Notice how the page shifted
            when this block appeared.
          </p>
          <p>
            Core Web Vitals measure real user experience. CLS captures visual
            instability, which frustrates users when content moves unexpectedly
            as the page loads.
          </p>
        </div>
      </div>
    </section>

    <section class="form-section">
      <h2>Contact Form (INP Demo)</h2>
      <p class="form-description">
        Interact with the form fields below to generate INP measurements.
        Each keystroke and click is an interaction the library tracks.
      </p>
      <form class="contact-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Name</label>
          <input id="name" v-model="form.name" type="text" placeholder="Enter your name" />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" placeholder="Enter your email" />
        </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" v-model="form.message" rows="4" placeholder="Write a message..."></textarea>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <div class="radio-group">
            <label v-for="option in priorities" :key="option">
              <input type="radio" v-model="form.priority" :value="option" />
              {{ option }}
            </label>
          </div>
        </div>
        <button type="submit" class="submit-button" :disabled="submitted">
          {{ submitted ? 'Submitted!' : 'Submit' }}
        </button>
      </form>
      <div v-if="submitted" class="success-message">
        Form submitted successfully. Check the console for web vitals data.
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const loading = ref(true)
const submitted = ref(false)
const priorities = ['Low', 'Medium', 'High']

const form = reactive({
  name: '',
  email: '',
  message: '',
  priority: 'Medium'
})

onMounted(() => {
  // Intentional delay to cause CLS
  setTimeout(() => {
    loading.value = false
  }, 500)
})

function handleSubmit() {
  submitted.value = true
  setTimeout(() => {
    submitted.value = false
  }, 3000)
}
</script>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.about h1 {
  color: #1a1a2e;
  font-size: 2rem;
}

.intro {
  color: #666;
  font-size: 1.1rem;
}

.dynamic-content,
.form-section {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.dynamic-content h2,
.form-section h2 {
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loaded-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dynamic-image {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.loaded-content p {
  color: #555;
  line-height: 1.6;
}

.form-description {
  color: #666;
  margin-bottom: 1.5rem;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #6c63ff;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.25rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: normal;
  cursor: pointer;
}

.submit-button {
  padding: 0.75rem 2rem;
  background: #6c63ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: #5a52d5;
}

.submit-button:disabled {
  background: #a5a1f5;
  cursor: default;
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  font-size: 0.95rem;
}
</style>
