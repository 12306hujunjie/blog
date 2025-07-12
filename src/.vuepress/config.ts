
// .vuepress/config.ts

import recoTheme from 'vuepress-theme-reco'
import {defineUserConfig} from "vuepress";
import { viteBundler } from '@vuepress/bundler-vite'
import { getDirname, path } from '@vuepress/utils'
import { fileURLToPath } from 'url'
// import { mermaidPlugin } from './plugins/mermaid-plugin.js'

const __dirname = getDirname(import.meta.url)

export default defineUserConfig({
  base: process.env.NODE_ENV === 'production' ? '/blog/' : '/',
  bundler: viteBundler(), 
  title: 'database of memory',
  description: 'study anything and life record',
  head: [
    // Preload Mermaid for better performance in static builds
    ['link', { rel: 'preload', href: 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js', as: 'script' }],
  ],
  clientConfigFile: path.resolve(__dirname, './client-mermaid.ts'),
  plugins: [
    // mermaidPlugin(),
  ],
  theme: recoTheme({
    // style: '@vuepress-reco/style-default',
    logo: '/logo.png',
    author: "hujunjie",
    authorAvatar: "/avatar.jpeg",
    docsRepo: 'https://github.com/12306hujunjie/blog',
    docsBranch: 'master',
    docsDir: 'src',
    lastUpdatedText: '更新于',
    autoSetBlogCategories: true,         // 自动设置分类
    autoAddCategoryToNavbar: false,  // 手动配置导航栏，避免重复
    catalogTitle: '目录',
    commentConfig: {
      type: 'valine',
      options: {
        "appId": "9dl7DeiOQ2DmQoIcai3UC6dR-gzGzoHsz",
        "appKey": "kisH4g4RCIHn0064CXERJktf",
        placeholder: 'Leave a comment',
        // verify: true, // 验证码服务
        // notify: true,
        // recordIP: true,
        // hideComments: true // 隐藏评论
        visitor: false,
        recordIp: true
      },
    },
    // series 为原 sidebar
    series: {
      '/docs/leetcode/': [
        {
          text: '从零开始刷题之路',
          children: [{
            text: '方法论', link : "the_way_to_leetcode"
          }, 'theme']
        },
        {
          text: 'module two',
          children: ['api', 'plugin']
        }
      ]
    },

    navbar:
        [
          { text: 'Home', link: '/' },
          { text: 'Categories', link: '/categories/cloud-base/1/' },
          { text: 'Tags', link: '/tags/runc/1/' },
          { text: '知识地图', link: '/knowledge-map/' },
          { text: 'Docs',
            link: '/docs/',
            children: [
              { text: 'leetcode from scratch', link: '/docs/leetcode/' },
              { text: 'design pattern', link: '/docs/design_pattern/' }
            ]
          },
        ],
  }),
  // debug: true,
})
