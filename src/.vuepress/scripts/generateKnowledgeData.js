const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

// 获取所有markdown文件的元数据
function collectArticleData(dir, basePath = '') {
  const articles = []
  
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      const subArticles = collectArticleData(filePath, `${basePath}/${file}`)
      articles.push(...subArticles)
    } else if (file.endsWith('.md') && file !== 'index.md') {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const { data: frontmatter } = matter(content)
        
        if (frontmatter.title) {
          const webPath = `${basePath}/${file.replace('.md', '.html')}`
          
          articles.push({
            id: file.replace('.md', ''),
            title: frontmatter.title,
            category: frontmatter.categories ? frontmatter.categories[0] : 'uncategorized',
            tags: frontmatter.tags || [],
            date: frontmatter.date,
            path: webPath,
            description: frontmatter.description || ''
          })
        }
      } catch (error) {
        console.warn(`解析文件失败: ${filePath}`, error.message)
      }
    }
  })
  
  return articles
}

// 基于文章数据生成知识图谱
function generateKnowledgeGraph(articles) {
  const nodes = []
  const edges = []
  
  // 分类颜色映射
  const categoryColors = {
    'algorithm': '#ff6b6b',
    'cache': '#4ecdc4', 
    'cloud-base': '#45b7d1',
    'linux': '#96ceb4',
    'python-web': '#feca57',
    'python': '#ff9ff3',
    'design_pattern': '#54a0ff',
    '编程基础': '#54a0ff',
    '项目说明': '#95a5a6',
    'uncategorized': '#95a5a6'
  }

  // 生成节点
  articles.forEach(article => {
    nodes.push({
      id: article.id,
      label: article.title,
      title: `分类: ${article.category}\n标签: ${article.tags.join(', ')}\n点击查看详情`,
      color: categoryColors[article.category] || '#95a5a6',
      category: article.category,
      tags: article.tags,
      path: article.path,
      date: article.date
    })
  })

  // 基于标签和分类生成边
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const article1 = articles[i]
      const article2 = articles[j]
      let weight = 0

      // 相同分类权重+4
      if (article1.category === article2.category) {
        weight += 4
      }

      // 共同标签权重计算
      const commonTags = article1.tags.filter(tag => 
        article2.tags.includes(tag)
      )
      
      // 排除通用标签，避免误连接
      const genericTags = ['最佳实践', 'checklist', '工具', '教程', '学习', '基础']
      const meaningfulTags = commonTags.filter(tag => 
        !genericTags.includes(tag)
      )
      
      // 有意义标签权重+3，通用标签权重+1
      weight += meaningfulTags.length * 3
      weight += (commonTags.length - meaningfulTags.length) * 1

      // 提高关联阈值，只有权重>=3才创建边
      if (weight >= 3) {
        edges.push({
          from: article1.id,
          to: article2.id,
          weight: weight,
          width: Math.min(weight, 5),
          length: 200 - weight * 20,
          commonTags: commonTags,
          meaningfulTags: meaningfulTags
        })
      }
    }
  }

  return { nodes, edges, articles }
}

// 主函数
function generateKnowledgeData() {
  const srcDir = path.join(__dirname, '../../')
  const blogsDir = path.join(srcDir, 'blogs')
  const docsDir = path.join(srcDir, 'docs')
  
  let allArticles = []
  
  // 收集blogs目录的文章
  if (fs.existsSync(blogsDir)) {
    const blogArticles = collectArticleData(blogsDir, '/blogs')
    allArticles.push(...blogArticles)
  }
  
  // 收集docs目录的文章
  if (fs.existsSync(docsDir)) {
    const docArticles = collectArticleData(docsDir, '/docs')
    allArticles.push(...docArticles)
  }
  
  // 收集src根目录下的独立页面（如知识地图）
  const rootFiles = fs.readdirSync(srcDir)
  rootFiles.forEach(item => {
    const itemPath = path.join(srcDir, item)
    const stat = fs.statSync(itemPath)
    
    if (stat.isDirectory() && !['blogs', 'docs', '.vuepress'].includes(item)) {
      const indexFile = path.join(itemPath, 'index.md')
      if (fs.existsSync(indexFile)) {
        try {
          const content = fs.readFileSync(indexFile, 'utf-8')
          const { data: frontmatter } = matter(content)
          
          if (frontmatter.title && frontmatter.title !== '知识地图') { // 排除知识地图页面本身
            allArticles.push({
              id: item,
              title: frontmatter.title,
              category: frontmatter.categories ? frontmatter.categories[0] : 'uncategorized',
              tags: frontmatter.tags || [],
              date: frontmatter.date,
              path: `/${item}/`,
              description: frontmatter.description || ''
            })
          }
        } catch (error) {
          console.warn(`解析文件失败: ${indexFile}`, error.message)
        }
      }
    }
  })
  
  // 生成知识图谱数据
  const knowledgeData = generateKnowledgeGraph(allArticles)
  
  // 输出数据文件
  const outputDir = path.join(__dirname, '../public')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  const outputFile = path.join(outputDir, 'knowledge-data.json')
  fs.writeFileSync(outputFile, JSON.stringify(knowledgeData, null, 2))
  
  console.log(`知识地图数据已生成: ${outputFile}`)
  console.log(`收集到 ${allArticles.length} 篇文章`)
  console.log(`生成 ${knowledgeData.nodes.length} 个节点`)
  console.log(`生成 ${knowledgeData.edges.length} 条边`)
  
  return knowledgeData
}

// 如果直接运行此脚本
if (require.main === module) {
  generateKnowledgeData()
}

module.exports = { generateKnowledgeData, collectArticleData, generateKnowledgeGraph }