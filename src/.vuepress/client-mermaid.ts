import { defineClientConfig } from 'vuepress/client'

declare global {
  interface Window {
    mermaid?: any
  }
}

export default defineClientConfig({
  setup() {
    if (typeof window !== 'undefined') {
      
      const loadMermaid = async () => {
        // 检查是否已加载
        if (window.mermaid) {
          return window.mermaid
        }
        
        try {
          // 优先尝试动态导入
          const mermaidModule = await import('mermaid')
          const mermaid = mermaidModule.default
          window.mermaid = mermaid
          return mermaid
        } catch (error) {
          // 降级到CDN
          console.log('📡 Loading Mermaid from CDN...')
          return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js'
            script.onload = () => {
              console.log('📦 Mermaid loaded from CDN')
              window.mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
              })
              resolve(window.mermaid)
            }
            script.onerror = () => reject(new Error('Failed to load Mermaid from CDN'))
            document.head.appendChild(script)
          })
        }
      }
      
      const renderAllMermaidDiagrams = async () => {
        console.log('🔍 Processing Mermaid diagrams...')
        
        // 查找标准的mermaid代码块
        const codeBlocks = document.querySelectorAll('div.language-mermaid:not(.mermaid-processed)')
        
        if (codeBlocks.length === 0) {
          return
        }
        
        console.log(`📊 Found ${codeBlocks.length} mermaid code blocks to render`)
        
        try {
          const mermaid = await loadMermaid()
          
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
          })
          
          for (let i = 0; i < codeBlocks.length; i++) {
            const codeBlock = codeBlocks[i] as HTMLElement
            const codeElement = codeBlock.querySelector('pre code')
            
            if (!codeElement) continue
            
            const code = codeElement.textContent?.trim() || ''
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
            
            console.log(`🎨 Rendering diagram: ${id}`)
            console.log(`📄 Code:`, code.slice(0, 50) + '...')
            
            try {
              const { svg } = await mermaid.render(`${id}-svg`, code)
              
              // 创建新的容器并替换原来的代码块
              const wrapper = document.createElement('div')
              wrapper.className = 'mermaid-wrapper'
              wrapper.innerHTML = `
                <div class="mermaid-container mermaid-rendered" id="${id}">
                  ${svg}
                </div>`
              
              codeBlock.parentNode?.replaceChild(wrapper, codeBlock)
              console.log(`✅ Successfully rendered: ${id}`)
            } catch (error) {
              console.error(`❌ Failed to render ${id}:`, error)
              
              // 显示错误信息
              const wrapper = document.createElement('div')
              wrapper.className = 'mermaid-wrapper'
              wrapper.innerHTML = `
                <div class="mermaid-container mermaid-error-state">
                  <div class="mermaid-error">
                    <h4>Mermaid Rendering Error</h4>
                    <p><strong>ID:</strong> ${id}</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <details>
                      <summary>Original Code</summary>
                      <pre><code>${code}</code></pre>
                    </details>
                  </div>
                </div>`
              
              codeBlock.parentNode?.replaceChild(wrapper, codeBlock)
            }
            
            // 标记为已处理
            codeBlock.classList.add('mermaid-processed')
          }
        } catch (error) {
          console.error('❌ Failed to load Mermaid library:', error)
        }
      }
      
      // 初始渲染
      const initRender = () => {
        setTimeout(renderAllMermaidDiagrams, 100)
        setTimeout(renderAllMermaidDiagrams, 500)
        setTimeout(renderAllMermaidDiagrams, 1000)
      }
      
      // 页面加载完成后渲染
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRender)
      } else {
        initRender()
      }
      
      // 监听路由变化
      if (!window.__VUEPRESS_SSR__) {
        // SPA路由变化
        window.addEventListener('popstate', () => {
          setTimeout(renderAllMermaidDiagrams, 100)
        })
        
        // 监听DOM变化
        const observer = new MutationObserver((mutations) => {
          let hasNewMermaid = false
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                if (element.querySelector && element.querySelector('div.language-mermaid:not(.mermaid-processed)')) {
                  hasNewMermaid = true
                }
              }
            })
          })
          
          if (hasNewMermaid) {
            setTimeout(renderAllMermaidDiagrams, 50)
          }
        })
        
        setTimeout(() => {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          })
        }, 1000)
      }
    }
  }
})