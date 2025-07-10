<template>
  <div class="knowledge-map">
    <div class="map-controls">
      <div class="filter-section">
        <label>筛选分类：</label>
        <select v-model="selectedCategory" @change="filterNodes">
          <option value="">全部</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
      <div class="search-section">
        <input 
          v-model="searchQuery" 
          @input="searchNodes"
          placeholder="搜索文章标题..."
          class="search-input"
        />
      </div>
    </div>
    <div id="knowledge-network" class="network-container"></div>
    <div class="map-legend">
      <h4>图例说明</h4>
      <div class="legend-item">
        <span class="node-example algorithm"></span>
        <span>算法类</span>
      </div>
      <div class="legend-item">
        <span class="node-example python"></span>
        <span>Python类</span>
      </div>
      <div class="legend-item">
        <span class="node-example cloud-base"></span>
        <span>云原生类</span>
      </div>
      <div class="legend-item">
        <span class="node-example other"></span>
        <span>其他类别</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'

export default {
  name: 'KnowledgeMap',
  setup() {
    const selectedCategory = ref('')
    const searchQuery = ref('')
    const categories = ref([])
    const allNodes = ref([])
    const allEdges = ref([])
    let network = null

    const articleData = ref([])
    const knowledgeData = ref(null)

    // 加载知识地图数据
    const loadKnowledgeData = async () => {
      try {
        // 尝试多个可能的数据路径
        const possibleUrls = [
          './knowledge-data.json',
          '/blog/knowledge-data.json',
          '/knowledge-data.json'
        ]
        
        // 动态获取base路径
        const basePath = document.querySelector('base')?.getAttribute('href')
        if (basePath) {
          possibleUrls.unshift(`${basePath}knowledge-data.json`.replace('//', '/'))
        }
        
        console.log('尝试加载数据，候选路径:', possibleUrls)
        
        for (const url of possibleUrls) {
          try {
            const response = await fetch(url)
            if (response.ok) {
              const data = await response.json()
              console.log('成功从', url, '加载数据，节点数量:', data.nodes?.length, '边数量:', data.edges?.length)
              knowledgeData.value = data
              articleData.value = data.articles || []
              return // 成功加载，退出
            }
          } catch (urlError) {
            console.log('尝试', url, '失败:', urlError.message)
          }
        }
        
        // 所有URL都失败，使用默认数据
        console.warn('所有数据加载路径都失败，使用默认数据')
        articleData.value = getDefaultData()
        
      } catch (error) {
        console.warn('加载知识地图数据失败，使用默认数据:', error)
        articleData.value = getDefaultData()
      }
    }

    // 默认数据作为回退
    const getDefaultData = () => [
      {
        id: 'bitwise_operation',
        title: '位运算技巧',
        category: 'algorithm',
        tags: ['位运算', '最佳实践'],
        path: '/blogs/algorithm/bitwise_operation.html'
      },
      {
        id: 'sort_1',
        title: '排序算法详解',
        category: 'algorithm', 
        tags: ['排序'],
        path: '/blogs/algorithm/array/sort_1.html'
      },
      {
        id: 'cache_pattern',
        title: '缓存模式',
        category: 'cache',
        tags: ['缓存', '最佳实践'],
        path: '/blogs/cache/cache_pattern.html'
      },
      {
        id: 'docker_tech',
        title: 'Docker技术',
        category: 'cloud-base',
        tags: ['docker', '容器'],
        path: '/blogs/cloud-base/docker_tech.html'
      },
      {
        id: 'k3s',
        title: 'K3S轻量级Kubernetes',
        category: 'cloud-base',
        tags: ['k3s', 'k8s'],
        path: '/blogs/cloud-base/k3s.html'
      },
      {
        id: 'linux_namespace',
        title: 'Linux命名空间',
        category: 'linux',
        tags: ['linux', '虚拟化'],
        path: '/blogs/linux/linux_namespace.html'
      },
      {
        id: 'gevent',
        title: 'Gevent源码解析',
        category: 'python-web',
        tags: ['源码解析', 'flask框架'],
        path: '/blogs/python-web/gevent.html'
      },
      {
        id: 'python_checklist',
        title: 'Python开发清单',
        category: 'python',
        tags: ['checklist'],
        path: '/blogs/python/python_checklist.html'
      },
      {
        id: 'python_env_manage',
        title: 'Python环境管理',
        category: 'python',
        tags: ['环境管理', 'poetry'],
        path: '/blogs/python/python_env_manage.html'
      }
    ]

    const generateKnowledgeGraph = () => {
      if (!articleData.value || articleData.value.length === 0) {
        return { nodes: [], edges: [] }
      }

      // 如果已有预生成的数据则直接使用
      if (knowledgeData.value) {
        allNodes.value = knowledgeData.value.nodes
        allEdges.value = knowledgeData.value.edges
        categories.value = [...new Set(knowledgeData.value.articles.map(a => a.category))]
        return { nodes: knowledgeData.value.nodes, edges: knowledgeData.value.edges }
      }

      // 否则动态生成
      const nodes = []
      const edges = []
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
      articleData.value.forEach(article => {
        nodes.push({
          id: article.id,
          label: article.title,
          title: `分类: ${article.category}\n标签: ${article.tags.join(', ')}\n点击查看详情`,
          color: categoryColors[article.category] || '#95a5a6',
          category: article.category,
          tags: article.tags,
          path: article.path,
          physics: true
        })
      })

      // 基于标签和分类生成边
      for (let i = 0; i < articleData.value.length; i++) {
        for (let j = i + 1; j < articleData.value.length; j++) {
          const article1 = articleData.value[i]
          const article2 = articleData.value[j]
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
          const genericTags = ['最佳实践', 'checklist', '工具', '教程']
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
              width: Math.min(weight, 5),
              length: 200 - weight * 20,
              title: `关联强度: ${weight}\n共同标签: ${commonTags.join(', ')}`
            })
          }
        }
      }

      allNodes.value = nodes
      allEdges.value = edges
      categories.value = [...new Set(articleData.value.map(a => a.category))]

      return { nodes, edges }
    }

    const initNetwork = () => {
      if (typeof window === 'undefined') return

      // 动态加载vis.js
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/vis-network@latest/dist/vis-network.min.js'
      script.onload = () => {
        const { nodes, edges } = generateKnowledgeGraph()
        
        const container = document.getElementById('knowledge-network')
        if (!container) return

        const data = {
          nodes: new vis.DataSet(nodes),
          edges: new vis.DataSet(edges)
        }

        const options = {
          physics: {
            stabilization: { iterations: 100 },
            barnesHut: {
              gravitationalConstant: -8000,
              springConstant: 0.001,
              springLength: 200
            }
          },
          interaction: {
            hover: true,
            tooltipDelay: 300
          },
          nodes: {
            shape: 'dot',
            size: 15,
            font: {
              size: 12,
              color: '#333'
            },
            borderWidth: 2,
            shadow: true
          },
          edges: {
            color: { inherit: 'from' },
            smooth: {
              type: 'continuous'
            }
          }
        }

        network = new vis.Network(container, data, options)

        // 节点点击事件
        network.on('click', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0]
            const article = articleData.value.find(a => a.id === nodeId)
            if (article) {
              window.open(article.path, '_blank')
            }
          }
        })
      }
      document.head.appendChild(script)
    }

    const filterNodes = () => {
      if (!network) return

      const filteredNodes = selectedCategory.value 
        ? allNodes.value.filter(node => node.category === selectedCategory.value)
        : allNodes.value

      const nodeIds = new Set(filteredNodes.map(n => n.id))
      const filteredEdges = allEdges.value.filter(edge => 
        nodeIds.has(edge.from) && nodeIds.has(edge.to)
      )

      network.setData({
        nodes: new vis.DataSet(filteredNodes),
        edges: new vis.DataSet(filteredEdges)
      })
    }

    const searchNodes = () => {
      if (!network) return

      const query = searchQuery.value.toLowerCase()
      if (!query) {
        network.setData({
          nodes: new vis.DataSet(allNodes.value),
          edges: new vis.DataSet(allEdges.value)
        })
        return
      }

      const matchedNodes = allNodes.value.filter(node =>
        node.label.toLowerCase().includes(query)
      )

      const nodeIds = new Set(matchedNodes.map(n => n.id))
      const relatedEdges = allEdges.value.filter(edge =>
        nodeIds.has(edge.from) || nodeIds.has(edge.to)
      )

      // 添加相关联的节点
      relatedEdges.forEach(edge => {
        if (!nodeIds.has(edge.from)) {
          const node = allNodes.value.find(n => n.id === edge.from)
          if (node) matchedNodes.push(node)
        }
        if (!nodeIds.has(edge.to)) {
          const node = allNodes.value.find(n => n.id === edge.to)
          if (node) matchedNodes.push(node)
        }
      })

      network.setData({
        nodes: new vis.DataSet(matchedNodes),
        edges: new vis.DataSet(relatedEdges)
      })
    }

    onMounted(async () => {
      await loadKnowledgeData()
      nextTick(() => {
        initNetwork()
      })
    })

    return {
      selectedCategory,
      searchQuery,
      categories,
      filterNodes,
      searchNodes
    }
  }
}
</script>

<style scoped>
.knowledge-map {
  padding: 20px;
  max-width: 100%;
}

.map-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-section, .search-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.network-container {
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}

.map-legend {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 8px 0;
  gap: 10px;
}

.node-example {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.node-example.algorithm { background-color: #ff6b6b; }
.node-example.python { background-color: #ff9ff3; }
.node-example.cloud-base { background-color: #45b7d1; }
.node-example.other { background-color: #95a5a6; }

@media (max-width: 768px) {
  .map-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .network-container {
    height: 400px;
  }
}
</style>