<template>
  <div class="waterfall-panel">
    <div class="waterfall-header">
      <h3 class="waterfall-title">Resource Waterfall</h3>
      <div class="waterfall-legend">
        <span class="legend-item"><span class="legend-color legend-queueing"></span>Queueing</span>
        <span class="legend-item"><span class="legend-color" style="background:#333"></span>Stalled</span>
        <span class="legend-item"><span class="legend-color" style="background:#009688"></span>DNS</span>
        <span class="legend-item"><span class="legend-color" style="background:#ff9800"></span>TCP</span>
        <span class="legend-item"><span class="legend-color" style="background:#c141cd"></span>SSL</span>
        <span class="legend-item"><span class="legend-color" style="background:#5faa51"></span>Waiting</span>
        <span class="legend-item"><span class="legend-color" style="background:#4db6e0"></span>Download</span>
      </div>
    </div>

    <div v-if="loading" class="spinner-container" style="padding:24px 0">
      <div class="spinner"></div>
    </div>

    <div v-else-if="entries.length === 0" class="waterfall-empty">
      No resource timing data available yet. Navigate the demo app and switch tabs to generate data.
    </div>

    <div v-else class="waterfall-content">
      <!-- Timeline header -->
      <div class="timeline-header">
        <div class="col-name">Resource</div>
        <div class="col-type">Type</div>
        <div class="col-size">Size</div>
        <div class="col-time">Time</div>
        <div class="col-waterfall">
          <div class="time-markers">
            <span v-for="t in timeMarkers" :key="t" class="time-marker" :style="{ left: getPosition(t) + '%' }">
              {{ formatTime(t) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Resource rows -->
      <div class="timeline-body">
        <div
          v-for="(entry, i) in entries"
          :key="i"
          class="resource-row"
          :class="{ 'row-alt': i % 2 === 1 }"
          @click="selectedIndex = selectedIndex === i ? -1 : i"
          @mouseenter="showTooltip($event, entry)"
          @mousemove="moveTooltip($event)"
          @mouseleave="hideTooltip"
        >
          <div class="col-name" :title="entry.name">
            <span class="resource-icon" :style="{ color: typeColor(entry.initiatorType) }">{{ typeIcon(entry.initiatorType) }}</span>
            <span class="resource-name">{{ shortName(entry.name) }}</span>
          </div>
          <div class="col-type">
            <span class="type-badge" :style="{ background: typeColor(entry.initiatorType) + '22', color: typeColor(entry.initiatorType) }">
              {{ entry.initiatorType }}
            </span>
          </div>
          <div class="col-size">
            <span v-if="isCached(entry)" class="cache-badge">cache</span>
            <span v-else>{{ formatSize(entry.transferSize) }}</span>
          </div>
          <div class="col-time">{{ formatDuration(entry.duration) }}</div>
          <div class="col-waterfall">
            <div class="bar-container">
              <!-- Render all phases from computePhases -->
              <div
                v-for="(phase, pi) in computePhases(entry)"
                :key="pi"
                class="bar-segment"
                :class="'bar-' + phase.type"
                :style="barStyle(phase.start, phase.end)"
                :title="phase.label + ': ' + formatDuration(phase.end - phase.start)"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail panel for selected row (DevTools-style) -->
      <div v-if="selectedIndex >= 0 && entries[selectedIndex]" class="detail-panel">
        <div class="detail-title">
          <span class="resource-icon" :style="{ color: typeColor(entries[selectedIndex].initiatorType) }">
            {{ typeIcon(entries[selectedIndex].initiatorType) }}
          </span>
          {{ entries[selectedIndex].name }}
        </div>

        <div class="detail-timing">
          <!-- Queued at / Started at -->
          <div class="detail-meta" v-if="entries[selectedIndex].startTime > 0">
            <span>Queued at {{ formatDuration(entries[selectedIndex].startTime) }}</span>
            <span v-if="(entries[selectedIndex].fetchStart || entries[selectedIndex].startTime) !== entries[selectedIndex].startTime">
              Started at {{ formatDuration(entries[selectedIndex].fetchStart || entries[selectedIndex].startTime) }}
            </span>
          </div>

          <!-- Resource Scheduling section -->
          <template v-if="hasSection(entries[selectedIndex], 'scheduling')">
            <div class="detail-section-header">
              <span>Resource Scheduling</span>
              <span>DURATION</span>
            </div>
            <div class="detail-row" v-for="item in getSectionItems(entries[selectedIndex], 'scheduling')" :key="item.label">
              <span class="detail-row-label">{{ item.label }}</span>
              <div class="detail-row-bar">
                <div class="detail-bar-track">
                  <div class="detail-bar-fill" :style="{ width: item.pct + '%', background: item.color, left: item.left + '%' }"></div>
                </div>
              </div>
              <span class="detail-row-value">{{ item.value }}</span>
            </div>
          </template>

          <!-- Connection Start section -->
          <template v-if="hasSection(entries[selectedIndex], 'connection')">
            <div class="detail-section-header">
              <span>Connection Start</span>
              <span>DURATION</span>
            </div>
            <div class="detail-row" v-for="item in getSectionItems(entries[selectedIndex], 'connection')" :key="item.label">
              <span class="detail-row-label">{{ item.label }}</span>
              <div class="detail-row-bar">
                <div class="detail-bar-track">
                  <div class="detail-bar-fill" :style="{ width: item.pct + '%', background: item.color, left: item.left + '%' }"></div>
                </div>
              </div>
              <span class="detail-row-value">{{ item.value }}</span>
            </div>
          </template>

          <!-- Request/Response section -->
          <template v-if="hasSection(entries[selectedIndex], 'request')">
            <div class="detail-section-header">
              <span>Request/Response</span>
              <span>DURATION</span>
            </div>
            <div class="detail-row" v-for="item in getSectionItems(entries[selectedIndex], 'request')" :key="item.label">
              <span class="detail-row-label">{{ item.label }}</span>
              <div class="detail-row-bar">
                <div class="detail-bar-track">
                  <div class="detail-bar-fill" :style="{ width: item.pct + '%', background: item.color, left: item.left + '%' }"></div>
                </div>
              </div>
              <span class="detail-row-value">{{ item.value }}</span>
            </div>
          </template>

          <!-- Total -->
          <div class="detail-total">
            <span>Total</span>
            <span class="detail-total-value">{{ formatDuration(entries[selectedIndex].duration) }}</span>
          </div>

          <!-- Extra info -->
          <div class="detail-extra" v-if="entries[selectedIndex].transferSize || entries[selectedIndex].nextHopProtocol">
            <span v-if="entries[selectedIndex].transferSize">Transfer: {{ formatSize(entries[selectedIndex].transferSize) }}</span>
            <span v-if="entries[selectedIndex].decodedBodySize">Decoded: {{ formatSize(entries[selectedIndex].decodedBodySize) }}</span>
            <span v-if="entries[selectedIndex].nextHopProtocol">Protocol: {{ entries[selectedIndex].nextHopProtocol }}</span>
          </div>
        </div>
      </div>

      <!-- Hover tooltip -->
      <div
        v-if="tooltip.visible"
        class="waterfall-tooltip"
        :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
      >
        <div class="tooltip-url">{{ tooltip.entry ? shortName(tooltip.entry.name) : '' }}</div>
        <div class="tooltip-separator"></div>
        <!-- Timing waterfall mini-bar -->
        <div class="tooltip-bar-row" v-if="tooltip.entry">
          <div class="tooltip-minibar">
            <div
              v-for="seg in getTooltipSegments(tooltip.entry)"
              :key="seg.label"
              class="tooltip-seg"
              :style="{ width: seg.pct + '%', background: seg.color }"
            ></div>
          </div>
          <span class="tooltip-duration">{{ formatDuration(tooltip.entry.duration) }}</span>
        </div>
        <div class="tooltip-separator"></div>
        <!-- Timing rows -->
        <div class="tooltip-rows" v-if="tooltip.entry">
          <div class="tooltip-row" v-if="tooltip.entry.startTime > 0">
            <span class="tooltip-dot" style="background:transparent"></span>
            <span class="tooltip-label">Started at</span>
            <span class="tooltip-val">{{ formatDuration(tooltip.entry.startTime) }}</span>
          </div>
          <div class="tooltip-row"
            v-for="phase in computePhases(tooltip.entry)"
            :key="phase.label"
          >
            <span class="tooltip-dot" :style="{ background: phaseColor(phase.type) }"></span>
            <span class="tooltip-label">{{ phase.label }}</span>
            <span class="tooltip-val">{{ formatDuration(phase.end - phase.start) }}</span>
          </div>
          <div class="tooltip-separator"></div>
          <div class="tooltip-row">
            <span class="tooltip-dot" style="background:#e2e8f0"></span>
            <span class="tooltip-label">Total Duration</span>
            <span class="tooltip-val">{{ formatDuration(tooltip.entry.duration) }}</span>
          </div>
          <div class="tooltip-row" v-if="tooltip.entry.transferSize">
            <span class="tooltip-dot" style="background:transparent"></span>
            <span class="tooltip-label">Transfer Size</span>
            <span class="tooltip-val">{{ formatSize(tooltip.entry.transferSize) }}</span>
          </div>
          <div class="tooltip-row" v-if="tooltip.entry.decodedBodySize">
            <span class="tooltip-dot" style="background:transparent"></span>
            <span class="tooltip-label">Decoded Size</span>
            <span class="tooltip-val">{{ formatSize(tooltip.entry.decodedBodySize) }}</span>
          </div>
          <div class="tooltip-row" v-if="tooltip.entry.nextHopProtocol">
            <span class="tooltip-dot" style="background:transparent"></span>
            <span class="tooltip-label">Protocol</span>
            <span class="tooltip-val">{{ tooltip.entry.nextHopProtocol }}</span>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="waterfall-summary">
        <span>{{ entries.length }} requests</span>
        <span>{{ formatSize(totalSize) }} transferred</span>
        <span>{{ formatDuration(totalDuration) }} total</span>
      </div>
    </div>
  </div>
</template>

<script>
import { getResources } from '../services/api.js'

export default {
  name: 'WaterfallPanel',
  props: {
    appId: { type: String, required: true },
    page: { type: String, required: true }
  },
  data() {
    return {
      entries: [],
      loading: true,
      selectedIndex: -1,
      maxTime: 0,
      tooltip: { visible: false, x: 0, y: 0, entry: null }
    }
  },
  computed: {
    totalSize() {
      return this.entries.reduce((s, e) => s + (e.transferSize || 0), 0)
    },
    totalDuration() {
      if (this.entries.length === 0) return 0
      return Math.max(...this.entries.map(e => e.startTime + e.duration))
    },
    timeMarkers() {
      if (this.maxTime <= 0) return []
      const step = this.niceStep(this.maxTime)
      const markers = []
      for (let t = 0; t <= this.maxTime; t += step) {
        markers.push(Math.round(t))
      }
      return markers
    }
  },
  mounted() {
    this.fetchResources()
  },
  watch: {
    page() { this.fetchResources() }
  },
  methods: {
    async fetchResources() {
      this.loading = true
      this.selectedIndex = -1
      try {
        const data = await getResources(this.appId, this.page)
        const records = data.resources || data || []

        // Flatten: each record has a resources array, take the latest record's resources
        let allResources = []
        if (records.length > 0) {
          // Use the most recent record
          const latest = records[records.length - 1]
          allResources = latest.resources || []
        }

        // Sort by startTime
        allResources.sort((a, b) => a.startTime - b.startTime)

        this.entries = allResources
        this.maxTime = allResources.length > 0
          ? Math.max(...allResources.map(e => e.startTime + e.duration))
          : 0
      } catch {
        this.entries = []
        this.maxTime = 0
      } finally {
        this.loading = false
      }
    },

    getPosition(time) {
      if (this.maxTime <= 0) return 0
      return (time / this.maxTime) * 100
    },

    getBarStart(entry) {
      return this.getPosition(entry.startTime)
    },

    barStyle(start, end) {
      const left = this.getPosition(start)
      const width = this.getPosition(end) - left
      return {
        left: left + '%',
        width: Math.max(width, 0.3) + '%'
      }
    },

    computePhases(entry) {
      const phases = []
      const fetchStart = entry.fetchStart || entry.startTime
      const EPS = 0.001 // ~1µs threshold — show even very small phases like DevTools

      // Cross-origin without Timing-Allow-Origin: requestStart is 0
      const hasDetailedTiming = entry.requestStart > 0

      if (!hasDetailedTiming) {
        phases.push({ type: 'download', label: 'Content Download', start: entry.startTime, end: entry.startTime + entry.duration, section: 'request' })
        return phases
      }

      // Redirect phase
      if (entry.redirectEnd > 0 && entry.redirectStart > 0) {
        const dur = entry.redirectEnd - entry.redirectStart
        if (dur > EPS) {
          phases.push({ type: 'redirect', label: 'Redirect', start: entry.redirectStart, end: entry.redirectEnd, section: 'scheduling' })
        }
      }

      // Queueing: fetchStart - startTime
      const queueing = fetchStart - entry.startTime
      if (queueing > EPS) {
        phases.push({ type: 'queueing', label: 'Queueing', start: entry.startTime, end: fetchStart, section: 'scheduling' })
      }

      // Stalled: from fetchStart to the first real network activity
      let firstNetworkActivity = entry.requestStart
      if (entry.dnsStart > 0 && entry.dnsStart > fetchStart) {
        firstNetworkActivity = entry.dnsStart
      } else if (entry.connectStart > 0 && entry.connectStart > fetchStart) {
        firstNetworkActivity = entry.connectStart
      }
      const stalled = firstNetworkActivity - fetchStart
      if (stalled > EPS) {
        phases.push({ type: 'stalled', label: 'Stalled', start: fetchStart, end: fetchStart + stalled, section: 'connection' })
      }

      // DNS Lookup
      const dns = entry.dnsEnd - entry.dnsStart
      if (dns > EPS) {
        phases.push({ type: 'dns', label: 'DNS Lookup', start: entry.dnsStart, end: entry.dnsEnd, section: 'connection' })
      }

      // Initial Connection (TCP + SSL)
      // For waterfall bars: split into non-overlapping TCP | SSL segments
      // For detail panel: getSectionItems will show full "Initial connection" and "SSL" subset
      const tcp = entry.connectEnd - entry.connectStart
      if (tcp > EPS) {
        const sslStart = entry.secureConnectionStart || 0
        if (sslStart > 0) {
          // TCP portion (before SSL handshake)
          const tcpOnly = sslStart - entry.connectStart
          if (tcpOnly > EPS) {
            phases.push({ type: 'tcp', label: 'Initial connection', start: entry.connectStart, end: sslStart, section: 'connection' })
          }
          // SSL portion
          const ssl = entry.connectEnd - sslStart
          if (ssl > EPS) {
            phases.push({ type: 'ssl', label: 'SSL', start: sslStart, end: entry.connectEnd, section: 'connection' })
          }
        } else {
          phases.push({ type: 'tcp', label: 'Initial connection', start: entry.connectStart, end: entry.connectEnd, section: 'connection' })
        }
      }

      // Waiting for server response (TTFB)
      // Includes request sent time since public API doesn't expose sendEnd
      const waiting = entry.responseStart - entry.requestStart
      if (waiting > EPS) {
        phases.push({ type: 'waiting', label: 'Waiting for server response', start: entry.requestStart, end: entry.responseStart, section: 'request' })
      }

      // Content Download
      const download = entry.responseEnd - entry.responseStart
      if (download > EPS) {
        phases.push({ type: 'download', label: 'Content Download', start: entry.responseStart, end: entry.responseEnd, section: 'request' })
      }

      return phases
    },

    shortName(url) {
      try {
        const u = new URL(url)
        const path = u.pathname + u.search
        return path.length > 60 ? '...' + path.slice(-57) : path
      } catch {
        return url.length > 60 ? '...' + url.slice(-57) : url
      }
    },

    formatDuration(ms) {
      if (ms < 0.001) return '< 1 \u00B5s'
      if (ms < 0.01) return Math.round(ms * 1000) + ' \u00B5s'
      if (ms < 1) return ms.toFixed(2) + ' ms'
      return ms.toFixed(2) + ' ms'
    },

    formatSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },

    formatTime(ms) {
      if (ms < 1000) return ms + 'ms'
      return (ms / 1000).toFixed(1) + 's'
    },

    niceStep(max) {
      const rough = max / 5
      const mag = Math.pow(10, Math.floor(Math.log10(rough)))
      const res = rough / mag
      if (res <= 1) return mag
      if (res <= 2) return 2 * mag
      if (res <= 5) return 5 * mag
      return 10 * mag
    },

    typeIcon(type) {
      const icons = {
        script: 'JS', css: 'CS', img: 'IM', link: 'LK',
        fetch: 'FE', xmlhttprequest: 'XH', font: 'FO',
        video: 'VI', audio: 'AU', beacon: 'BC', other: '??'
      }
      return icons[type] || type?.slice(0, 2).toUpperCase() || '??'
    },

    typeColor(type) {
      const colors = {
        script: '#f59e0b', css: '#8b5cf6', img: '#10b981',
        link: '#8b5cf6', fetch: '#3b82f6', xmlhttprequest: '#3b82f6',
        font: '#ec4899', video: '#ef4444', audio: '#ef4444',
        beacon: '#6366f1', other: '#6b7280'
      }
      return colors[type] || '#6b7280'
    },

    isCached(entry) {
      return entry.transferSize === 0 && entry.decodedBodySize > 0
    },

    showTooltip(event, entry) {
      this.tooltip.entry = entry
      this.tooltip.visible = true
      this.moveTooltip(event)
    },
    moveTooltip(event) {
      const offset = 16
      this.tooltip.x = event.clientX + offset
      this.tooltip.y = event.clientY + offset
      // Prevent going off-screen right
      const ttWidth = 320
      if (this.tooltip.x + ttWidth > window.innerWidth) {
        this.tooltip.x = event.clientX - ttWidth - offset
      }
      // Prevent going off-screen bottom
      const ttHeight = 280
      if (this.tooltip.y + ttHeight > window.innerHeight) {
        this.tooltip.y = event.clientY - ttHeight - offset
      }
    },
    hideTooltip() {
      this.tooltip.visible = false
      this.tooltip.entry = null
    },
    phaseColor(type) {
      const colors = {
        redirect: '#f59e0b',
        queueing: '#e8e8e8',
        stalled: '#333333',
        dns: '#009688',
        tcp: '#ff9800',
        ssl: '#c141cd',
        waiting: '#5faa51',
        download: '#4db6e0'
      }
      return colors[type] || '#4db6e0'
    },

    getTooltipSegments(entry) {
      const total = entry.duration || 1
      const phases = this.computePhases(entry)
      const segs = []

      for (const p of phases) {
        const dur = p.end - p.start
        segs.push({ label: p.label, pct: Math.max((dur / total) * 100, 0.5), color: this.phaseColor(p.type) })
      }

      if (segs.length === 0) {
        segs.push({ label: 'Duration', pct: 100, color: '#4db6e0' })
      }

      return segs
    },

    hasSection(entry, section) {
      return this.computePhases(entry).some(p => p.section === section)
    },

    getSectionItems(entry, section) {
      const phases = this.computePhases(entry)
      const total = entry.duration || 1
      const entryStart = entry.startTime
      const items = []

      // For "connection" section: show "Initial connection" as full connectEnd-connectStart
      // and "SSL" as the subset (like DevTools), instead of split TCP|SSL
      if (section === 'connection') {
        const connectionPhases = phases.filter(p => p.section === 'connection')
        for (const p of connectionPhases) {
          if (p.type === 'tcp') {
            // Show full "Initial connection" duration (connectEnd - connectStart)
            const fullConnectionDur = entry.connectEnd - entry.connectStart
            items.push({
              label: 'Initial connection',
              value: this.formatDuration(fullConnectionDur),
              color: this.phaseColor('tcp'),
              pct: Math.max((fullConnectionDur / total) * 100, 0.5),
              left: ((entry.connectStart - entryStart) / total) * 100
            })
          } else if (p.type === 'ssl') {
            // Show SSL as subset
            const sslDur = entry.connectEnd - (entry.secureConnectionStart || 0)
            items.push({
              label: 'SSL',
              value: this.formatDuration(sslDur),
              color: this.phaseColor('ssl'),
              pct: Math.max((sslDur / total) * 100, 0.5),
              left: (((entry.secureConnectionStart || 0) - entryStart) / total) * 100
            })
          } else {
            // Stalled, DNS — show as-is
            const dur = p.end - p.start
            items.push({
              label: p.label,
              value: this.formatDuration(dur),
              color: this.phaseColor(p.type),
              pct: Math.max((dur / total) * 100, 0.5),
              left: ((p.start - entryStart) / total) * 100
            })
          }
        }
        return items
      }

      return phases
        .filter(p => p.section === section)
        .map(p => {
          const dur = p.end - p.start
          return {
            label: p.label,
            value: this.formatDuration(dur),
            color: this.phaseColor(p.type),
            pct: Math.max((dur / total) * 100, 0.5),
            left: ((p.start - entryStart) / total) * 100
          }
        })
    }
  }
}
</script>

<style scoped>
.waterfall-panel {
  margin-top: 12px;
}

.waterfall-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.waterfall-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.waterfall-legend {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}

.legend-queueing {
  background: transparent;
  border: 1px solid #999;
}

.waterfall-empty {
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 32px;
  text-align: center;
  background: var(--bg-surface);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius);
}

.waterfall-content {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
}

/* Timeline header */
.timeline-header {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) 70px 70px 60px 1fr;
  gap: 0;
  padding: 8px 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-header .col-waterfall {
  position: relative;
}

.time-markers {
  position: relative;
  height: 100%;
}

.time-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
}

/* Resource rows */
.timeline-body {
  max-height: 500px;
  overflow-y: auto;
}

.resource-row {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) 70px 70px 60px 1fr;
  gap: 0;
  padding: 6px 12px;
  align-items: center;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  font-size: 0.8rem;
}

.resource-row:hover {
  background: rgba(99, 102, 241, 0.08);
}

.row-alt {
  background: rgba(255, 255, 255, 0.015);
}

.col-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.resource-icon {
  font-size: 0.65rem;
  font-weight: 700;
  width: 22px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.resource-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
}

.col-type { text-align: center; }
.col-size { text-align: right; color: var(--text-muted); font-family: var(--font-mono); font-size: 0.75rem; }
.col-time { text-align: right; color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.75rem; }

.cache-badge {
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  font-weight: 500;
  text-transform: lowercase;
}

.type-badge {
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
}

/* Waterfall bars */
.col-waterfall {
  position: relative;
  height: 16px;
}

.bar-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.bar-segment {
  position: absolute;
  height: 8px;
  top: 4px;
  min-width: 1px;
}

.bar-redirect { background: #f59e0b; }
.bar-queueing { background: transparent; border: 1px solid #999; height: 6px; top: 5px; }
.bar-stalled { background: #333; }
.bar-dns { background: #009688; }
.bar-tcp { background: #ff9800; }
.bar-ssl { background: #c141cd; }
.bar-waiting { background: #5faa51; }
.bar-download { background: #4db6e0; }

/* Detail panel — DevTools-style */
.detail-panel {
  padding: 16px 20px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
}

.detail-title {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-primary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-all;
}

.detail-timing {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

.detail-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 12px;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-color);
}

.detail-row {
  display: grid;
  grid-template-columns: 200px 1fr 80px;
  align-items: center;
  gap: 12px;
  padding: 4px 0 4px 12px;
  font-size: 0.78rem;
}

.detail-row-label {
  color: var(--text-secondary);
}

.detail-row-bar {
  position: relative;
  height: 12px;
}

.detail-bar-track {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.04);
  border-radius: 2px;
}

.detail-bar-fill {
  position: absolute;
  height: 100%;
  border-radius: 2px;
  min-width: 3px;
}

.detail-row-value {
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--text-primary);
  font-weight: 600;
}

.detail-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.detail-total-value {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.detail-extra {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* Tooltip */
.waterfall-tooltip {
  position: fixed;
  z-index: 9999;
  width: 320px;
  background: #1a1f2e;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  pointer-events: none;
  font-size: 0.78rem;
}

.tooltip-url {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #93c5fd;
  word-break: break-all;
  line-height: 1.4;
  margin-bottom: 4px;
}

.tooltip-separator {
  height: 1px;
  background: #334155;
  margin: 8px 0;
}

.tooltip-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tooltip-minibar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.06);
  display: flex;
  overflow: hidden;
}

.tooltip-seg {
  height: 100%;
  min-width: 2px;
}

.tooltip-duration {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #e2e8f0;
  font-weight: 600;
  white-space: nowrap;
}

.tooltip-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tooltip-label {
  flex: 1;
  color: #94a3b8;
  font-size: 0.75rem;
}

.tooltip-val {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: #e2e8f0;
  font-weight: 600;
  text-align: right;
}

/* Summary bar */
.waterfall-summary {
  display: flex;
  gap: 24px;
  padding: 10px 16px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
</style>
