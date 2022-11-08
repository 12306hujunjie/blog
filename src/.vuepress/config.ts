
// .vuepress/config.ts

import { defineUserConfig } from 'vuepress'
import type { DefaultThemeOptions } from 'vuepress'
import recoTheme from 'vuepress-theme-reco'

export default defineUserConfig({
  title: 'database of memory',
  description: 'study anything and life record',
  theme: recoTheme({
    style: '@vuepress-reco/style-default',
    logo: '/logo.png',
    author: "hujunjie",
    authorAvatar: "/avatar.jpeg",
    docsRepo: 'https://github.com/12306hujunjie/blog',
    docsBranch: 'master',
    docsDir: 'src',
    lastUpdatedText: '更新于',
    autoSetBlogCategories: true,         // 自动设置分类
    autoAddCategoryToNavbar: true,  // 自动将首页、分类和标签添加至头部导航条
    catalogTitle: '目录',
    commentConfig: {
      type: 'valine',
      options: {
        "appId": "9dl7DeiOQ2DmQoIcai3UC6dR-gzGzoHsz",
        "appKey": "kisH4g4RCIHn0064CXERJktf",
        placeholder: '填写邮箱可以收到回复提醒哦！',
        verify: true, // 验证码服务
        // notify: true,
        recordIP: true,
        // hideComments: true // 隐藏评论
      },
    },
    // series 为原 sidebar
    series: {
      '/docs/theme-reco/': [
        {
          text: 'module one',
          children: ['home', 'theme']
        },
        {
          text: 'module two',
          children: ['api', 'plugin']
        }
      ]
    },
    navbar:
        [
          // { text: 'Home', link: '/' },
          // { text: 'Categories', link: '/categories/reco/1/' },
          // { text: 'Tags', link: '/tags/tag1/1/' },
          { text: 'Docs',
            children: [
              { text: 'vuepress-reco', link: '/docs/theme-reco/theme' },
              { text: 'vuepress-theme-reco', link: '/blogs/other/guide' }
            ]
          },
        ],
  }),
  // debug: true,
})