import type { Plugin } from 'vuepress/core'
import { getDirname, path } from '@vuepress/utils'

const __dirname = getDirname(import.meta.url)

export const mermaidPlugin = (): Plugin => ({
  name: 'vuepress-plugin-mermaid-custom',
  
  // 在markdown解析之前处理
  extendsMarkdown: (md) => {
    // 保存原始的fence rule
    const defaultRender = md.renderer.rules.fence || function (tokens, idx, options, env, renderer) {
      return renderer.renderToken(tokens, idx, options)
    }

    md.renderer.rules.fence = (tokens, idx, options, env, renderer) => {
      const token = tokens[idx]
      const info = token.info.trim()
      
      // 检查是否是mermaid代码块
      if (info === 'mermaid') {
        const content = token.content.trim()
        // 生成唯一ID
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        
        return `<div class="mermaid-wrapper">
  <div class="mermaid-container" data-mermaid-code="${encodeURIComponent(content)}" id="${id}">
    <div class="mermaid-loading">Loading diagram...</div>
  </div>
</div>`
      }
      
      // 对于非mermaid代码块，使用默认渲染
      return defaultRender(tokens, idx, options, env, renderer)
    }
  },
  
  // 提供客户端配置
  // clientConfigFile: path.resolve(__dirname, '../client-mermaid.ts'),
})