<template>
  <div :id="chartId" class="mermaid-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface Props {
  code: string
  id?: string
}

const props = defineProps<Props>()
const chartId = ref(props.id || `mermaid-${Math.random().toString(36).substr(2, 9)}`)

onMounted(async () => {
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import mermaid
      const mermaid = (await import('mermaid')).default
      
      // Initialize mermaid
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      })
      
      await nextTick()
      
      // Clear any existing content
      const element = document.getElementById(chartId.value)
      if (element) {
        element.innerHTML = ''
        
        // Render the diagram
        const { svg } = await mermaid.render(chartId.value, props.code)
        element.innerHTML = svg
      }
    } catch (error) {
      console.error('Error rendering mermaid chart:', error)
      const element = document.getElementById(chartId.value)
      if (element) {
        element.innerHTML = `<pre><code>Error rendering chart: ${error}</code></pre>`
      }
    }
  }
})
</script>

<style scoped>
.mermaid-chart {
  text-align: center;
  margin: 1rem 0;
}
</style>