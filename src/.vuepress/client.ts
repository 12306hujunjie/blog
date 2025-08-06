import { defineClientConfig } from 'vuepress/client'
import MermaidChart from './components/MermaidChart.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('MermaidChart', MermaidChart)
  },
  setup() {
    // Combined setup function
    if (typeof window !== 'undefined') {
      // Handle Valine component errors gracefully
      window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('Valine')) {
          console.warn('Valine component error caught:', event.message);
          event.preventDefault();
          
          // Hide Valine container if there's an error
          const valineElements = document.querySelectorAll('.valine-wrapper');
          valineElements.forEach(el => {
            el.classList.add('error');
          });
        }
      });
      
      // Process mermaid code blocks after page is mounted
      const processMermaidBlocks = () => {
        console.log('🔍 Starting Mermaid processing...')
        
        // Process both code blocks and mermaid tags
        const codeBlocks = document.querySelectorAll('div.language-mermaid pre code')
        const mermaidTags = document.querySelectorAll('mermaid')
        const alreadyProcessed = document.querySelectorAll('.mermaid-container')
        
        console.log(`📊 DOM Status:`)
        console.log(`  - Code blocks: ${codeBlocks.length}`)
        console.log(`  - Mermaid tags: ${mermaidTags.length}`)
        console.log(`  - Already processed: ${alreadyProcessed.length}`)
        
        // Process code blocks
        codeBlocks.forEach((block, index) => {
          let code = block.textContent || ''
          // Clean up the code - remove extra whitespace
          code = code.trim()
          
          console.log(`📝 Processing code block ${index}:`, code.slice(0, 50) + '...')
          const pre = block.parentElement
          const languageDiv = pre?.parentElement
          
          if (languageDiv && languageDiv.classList.contains('language-mermaid') && !languageDiv.classList.contains('mermaid-processed')) {
            console.log(`🔄 Converting code block ${index} to mermaid container`)
            languageDiv.classList.add('mermaid-processed')
            
            const mermaidDiv = document.createElement('div')
            mermaidDiv.className = 'mermaid-container'
            mermaidDiv.innerHTML = `<div id="mermaid-code-${index}" class="mermaid-chart">Loading diagram...</div>`
            
            languageDiv.parentNode?.replaceChild(mermaidDiv, languageDiv)
            
            renderMermaidChart(`mermaid-code-${index}`, code)
          } else {
            console.log(`⏭️ Skipping code block ${index} (already processed or invalid)`)
          }
        })
        
        // Process mermaid tags
        mermaidTags.forEach((tag, index) => {
          if (!tag.classList.contains('mermaid-processed')) {
            tag.classList.add('mermaid-processed')
            const code = tag.textContent || ''
            console.log(`🏷️ Processing mermaid tag ${index}:`, code.slice(0, 50) + '...')
            
            const mermaidDiv = document.createElement('div')
            mermaidDiv.className = 'mermaid-container'
            mermaidDiv.innerHTML = `<div id="mermaid-tag-${index}" class="mermaid-chart">Loading diagram...</div>`
            
            tag.parentNode?.replaceChild(mermaidDiv, tag)
            
            renderMermaidChart(`mermaid-tag-${index}`, code)
          } else {
            console.log(`⏭️ Skipping mermaid tag ${index} (already processed)`)
          }
        })
        
        console.log('✅ Mermaid processing completed')
      }
      
      const loadMermaid = () => {
        return new Promise((resolve, reject) => {
          // Check if mermaid is already loaded
          if (window.mermaid) {
            resolve(window.mermaid)
            return
          }
          
          // Try dynamic import first (works in dev)
          import('mermaid').then((mermaidModule) => {
            const mermaid = mermaidModule.default
            window.mermaid = mermaid
            resolve(mermaid)
          }).catch(() => {
            // Fallback to CDN for static builds
            console.log('📡 Loading Mermaid from CDN...')
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js'
            script.onload = () => {
              console.log('📦 Mermaid loaded from CDN')
              resolve(window.mermaid)
            }
            script.onerror = () => {
              reject(new Error('Failed to load Mermaid from CDN'))
            }
            document.head.appendChild(script)
          })
        })
      }

      const renderMermaidChart = (elementId, code) => {
        console.log(`🎨 Attempting to render chart: ${elementId}`)
        
        loadMermaid().then((mermaid) => {
          console.log(`📦 Mermaid module loaded successfully`)
          
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
          })
          
          const chartElement = document.getElementById(elementId)
          if (chartElement) {
            console.log(`🎯 Found chart element: ${elementId}`)
            console.log(`📄 Code to render:`, code)
            
            mermaid.render(elementId + '-svg', code)
              .then(({ svg }) => {
                chartElement.innerHTML = svg
                console.log(`✅ Successfully rendered mermaid chart: ${elementId}`)
                console.log(`📏 SVG length: ${svg.length} characters`)
              })
              .catch((error) => {
                console.error(`❌ Mermaid rendering error for ${elementId}:`, error)
                chartElement.innerHTML = `<div style="border: 2px solid red; padding: 1rem; background: #ffe6e6;">
                  <h4>Mermaid Rendering Error</h4>
                  <p><strong>Chart ID:</strong> ${elementId}</p>
                  <p><strong>Error:</strong> ${error.message}</p>
                  <details>
                    <summary>Original Code</summary>
                    <pre><code>${code}</code></pre>
                  </details>
                </div>`
              })
          } else {
            console.error(`❌ Chart element not found: ${elementId}`)
          }
        }).catch((error) => {
          console.error('❌ Failed to load mermaid:', error)
          const chartElement = document.getElementById(elementId)
          if (chartElement) {
            chartElement.innerHTML = `<div style="border: 2px solid orange; padding: 1rem; background: #fff3cd;">
              <p><strong>Failed to load Mermaid:</strong> ${error.message}</p>
            </div>`
          }
        })
      }
      
      // Process on initial load with multiple attempts
      setTimeout(processMermaidBlocks, 100)
      setTimeout(processMermaidBlocks, 500)
      setTimeout(processMermaidBlocks, 1000)
      
      // Process on DOM changes and route changes
      if (!window.__VUEPRESS_SSR__) {
        // Handle SPA route changes
        window.addEventListener('popstate', () => {
          setTimeout(processMermaidBlocks, 100)
        })
        
        // Handle hash changes
        window.addEventListener('hashchange', () => {
          setTimeout(processMermaidBlocks, 100)
        })
        
        // Observe DOM changes for new content
        const observer = new MutationObserver(() => {
          setTimeout(processMermaidBlocks, 50)
        })
        
        // Start observing after a delay to avoid initial load conflicts
        setTimeout(() => {
          const targetNode = document.body
          if (targetNode) {
            observer.observe(targetNode, {
              childList: true,
              subtree: true,
              attributes: false
            })
          }
        }, 2000)
      }
    }
  }
})