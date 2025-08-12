---
title: 全栈工程师学习路线图 2024
date: 2024-01-01
categories:
  - roadmaps
  - fullstack
tags:
  - 学习路径
  - 全栈开发
  - 职业规划
description: 从零到全栈工程师的完整学习路径，包含前端、后端、DevOps等技术栈的系统化学习指南
---

# 🚀 全栈工程师学习路线图 2024

## 📊 学习路径概览

```mermaid
graph LR
    A[基础阶段] --> B[前端开发]
    B --> C[后端开发]
    C --> D[数据库]
    D --> E[DevOps]
    E --> F[系统设计]
    F --> G[全栈项目]
    
    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#fce4ec
    style F fill:#f3e5f5
    style G fill:#fff9c4
```

## 🎯 学习目标设定

### 初级目标（0-6个月）
- 掌握 HTML/CSS/JavaScript 基础
- 理解 HTTP 协议和 RESTful API
- 能够独立完成简单的全栈应用
- 熟悉版本控制（Git）

### 中级目标（6-12个月）
- 精通至少一个前端框架（React/Vue）
- 掌握一门后端语言（Node.js/Python）
- 理解数据库设计和优化
- 实践 CI/CD 流程

### 高级目标（12-24个月）
- 架构设计能力
- 性能优化实战经验
- 微服务和容器化
- 云服务部署和运维

## 📚 第一阶段：编程基础（1-2个月）

### 1.1 计算机基础
- **必修内容**：
  - 数据结构与算法基础
  - 操作系统概念
  - 网络协议基础（TCP/IP、HTTP/HTTPS）
  - 编程范式（面向对象、函数式）

- **推荐资源**：
  - 📖 [《计算机科学导论》](https://example.com)
  - 🎥 [CS50 哈佛计算机科学导论](https://example.com)
  - 💻 [LeetCode 算法入门](https://leetcode.com)

- **实践项目**：
  ```python
  # 项目：实现基础数据结构
  class Stack:
      def __init__(self):
          self.items = []
      
      def push(self, item):
          self.items.append(item)
      
      def pop(self):
          return self.items.pop() if self.items else None
      
      def is_empty(self):
          return len(self.items) == 0
  ```

### 1.2 版本控制
- **Git 核心概念**：
  - 仓库、分支、合并
  - 提交历史管理
  - 协作工作流（Git Flow、GitHub Flow）
  
- **必会命令**：
  ```bash
  # 基础操作
  git init
  git add .
  git commit -m "message"
  git push origin main
  
  # 分支管理
  git checkout -b feature
  git merge feature
  git rebase main
  
  # 协作操作
  git pull --rebase
  git stash
  git cherry-pick
  ```

## 🎨 第二阶段：前端开发（2-4个月）

### 2.1 HTML5 & CSS3
- **核心知识点**：
  - 语义化标签
  - Flexbox 和 Grid 布局
  - 响应式设计
  - CSS 预处理器（Sass/Less）
  - CSS 架构（BEM、Atomic CSS）

- **实战练习**：
  ```html
  <!-- 响应式卡片组件 -->
  <div class="card">
    <img class="card__image" src="image.jpg" alt="描述">
    <div class="card__content">
      <h3 class="card__title">标题</h3>
      <p class="card__description">描述内容</p>
      <button class="card__button">查看详情</button>
    </div>
  </div>
  ```

  ```scss
  // BEM 命名规范示例
  .card {
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    &__image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    
    &__content {
      padding: 1rem;
    }
    
    &__title {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    @media (min-width: 768px) {
      flex-direction: row;
    }
  }
  ```

### 2.2 JavaScript 进阶
- **ES6+ 特性**：
  - 箭头函数、解构赋值
  - Promise、Async/Await
  - 模块系统（ES Modules）
  - 类和继承

- **DOM 操作与事件**：
  ```javascript
  // 现代化的事件处理
  class TodoApp {
    constructor(selector) {
      this.container = document.querySelector(selector);
      this.todos = [];
      this.init();
    }
    
    init() {
      this.render();
      this.bindEvents();
    }
    
    bindEvents() {
      // 事件委托
      this.container.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
          this.deleteTodo(e.target.dataset.id);
        }
      });
    }
    
    async addTodo(text) {
      const todo = {
        id: Date.now(),
        text,
        completed: false
      };
      
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo)
        });
        
        if (response.ok) {
          this.todos.push(todo);
          this.render();
        }
      } catch (error) {
        console.error('添加待办事项失败:', error);
      }
    }
    
    render() {
      // Virtual DOM 概念的简单实现
      const html = this.todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
          <span>${todo.text}</span>
          <button class="delete-btn" data-id="${todo.id}">删除</button>
        </div>
      `).join('');
      
      this.container.innerHTML = html;
    }
  }
  ```

### 2.3 前端框架（React/Vue）

#### React 学习路径
```javascript
// React 组件示例
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!user) return null;
  
  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </div>
  );
};

export default UserProfile;
```

#### Vue 学习路径
```vue
<!-- Vue 3 组合式 API 示例 -->
<template>
  <div class="user-profile">
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error }}</div>
    <div v-else-if="user">
      <img :src="user.avatar" :alt="user.name">
      <h2>{{ user.name }}</h2>
      <p>{{ user.bio }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

const user = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchUser = async (id) => {
  try {
    loading.value = true;
    error.value = null;
    const response = await axios.get(`/api/users/${id}`);
    user.value = response.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUser(props.userId);
});

watch(() => props.userId, (newId) => {
  fetchUser(newId);
});
</script>
```

## 💻 第三阶段：后端开发（2-4个月）

### 3.1 Node.js 生态

#### Express.js 应用架构
```javascript
// app.js - Express 应用结构
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 限制 100 个请求
});
app.use('/api', limiter);

// 日志和解析
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由模块化
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
```

#### 认证和授权
```javascript
// middleware/auth.js - JWT 认证中间件
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
  // 生成 Token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  // 验证 Token 中间件
  authenticate = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: '无效的令牌' });
    }
  };
  
  // 角色授权中间件
  authorize(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: '权限不足' });
      }
      next();
    };
  }
  
  // 密码加密
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
  
  // 密码验证
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = new AuthService();
```

### 3.2 Python 后端（Flask/Django）

#### Flask RESTful API
```python
# app.py - Flask 应用示例
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# 配置
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# 初始化扩展
db = SQLAlchemy(app)
CORS(app)
jwt = JWTManager(app)

# 数据模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    posts = db.relationship('Post', backref='author', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'author': self.author.username,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# API 路由
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # 验证输入
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'message': '缺少必要字段'}), 400
    
    # 检查用户是否存在
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': '邮箱已被注册'}), 409
    
    # 创建新用户
    from werkzeug.security import generate_password_hash
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    
    db.session.add(user)
    db.session.commit()
    
    # 生成 Token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': '注册成功',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201

@app.route('/api/posts', methods=['GET', 'POST'])
@jwt_required()
def posts():
    if request.method == 'GET':
        # 分页参数
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # 查询文章
        pagination = Post.query.order_by(Post.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'posts': [post.to_dict() for post in pagination.items],
            'total': pagination.total,
            'page': page,
            'pages': pagination.pages
        })
    
    elif request.method == 'POST':
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        post = Post(
            title=data['title'],
            content=data['content'],
            user_id=current_user_id
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify({
            'message': '文章创建成功',
            'post': post.to_dict()
        }), 201

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': '资源未找到'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'message': '服务器内部错误'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
```

## 🗄️ 第四阶段：数据库技术（1-2个月）

### 4.1 关系型数据库（MySQL/PostgreSQL）

#### 数据库设计原则
```sql
-- 规范化的数据库设计示例
-- 用户系统数据库设计

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- 角色表
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表（多对多）
CREATE TABLE user_roles (
    user_id INT,
    role_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 权限表
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    INDEX idx_resource_action (resource, action)
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 用户会话表
CREATE TABLE user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- 审计日志表
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
);
```

#### 查询优化
```sql
-- 性能优化示例

-- 1. 使用 EXPLAIN 分析查询计划
EXPLAIN SELECT u.username, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id
HAVING post_count > 5
ORDER BY post_count DESC
LIMIT 10;

-- 2. 优化后的查询（使用子查询减少 JOIN 数据量）
WITH active_users AS (
    SELECT id, username
    FROM users
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
),
user_post_counts AS (
    SELECT user_id, COUNT(*) as post_count
    FROM posts
    WHERE user_id IN (SELECT id FROM active_users)
    GROUP BY user_id
    HAVING COUNT(*) > 5
)
SELECT au.username, upc.post_count
FROM active_users au
INNER JOIN user_post_counts upc ON au.id = upc.user_id
ORDER BY upc.post_count DESC
LIMIT 10;

-- 3. 创建复合索引优化查询
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX idx_users_created_active ON users(created_at, is_active);

-- 4. 分区表优化大数据量查询
ALTER TABLE audit_logs
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 4.2 NoSQL 数据库（MongoDB/Redis）

#### MongoDB 文档设计
```javascript
// MongoDB 数据模型设计
const mongoose = require('mongoose');

// 嵌入式设计（适合一对少关系）
const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    avatar: String
  },
  // 嵌入评论（限制数量）
  comments: [{
    user: {
      id: mongoose.Schema.Types.ObjectId,
      name: String
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  metadata: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    readTime: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: Date
});

// 复合索引
blogPostSchema.index({ 'author.id': 1, createdAt: -1 });
blogPostSchema.index({ tags: 1, createdAt: -1 });

// 文本搜索索引
blogPostSchema.index({ title: 'text', content: 'text' });

// 虚拟属性
blogPostSchema.virtual('excerpt').get(function() {
  return this.content.substring(0, 200) + '...';
});

// 中间件
blogPostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

// 静态方法
blogPostSchema.statics.findByTag = function(tag) {
  return this.find({ tags: tag }).sort({ createdAt: -1 });
};

// 实例方法
blogPostSchema.methods.incrementViews = function() {
  return this.updateOne({ $inc: { 'metadata.views': 1 } });
};

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
```

#### Redis 缓存策略
```javascript
// Redis 缓存层实现
const redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    });
    
    // Promise 化 Redis 方法
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.existsAsync = promisify(this.client.exists).bind(this.client);
  }
  
  // 缓存策略：Cache-Aside Pattern
  async getCachedData(key, fetchFunction, ttl = 3600) {
    try {
      // 尝试从缓存获取
      const cached = await this.getAsync(key);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // 缓存未命中，获取数据
      const data = await fetchFunction();
      
      // 写入缓存
      await this.setAsync(key, ttl, JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Cache error:', error);
      // 缓存错误时直接返回数据
      return fetchFunction();
    }
  }
  
  // 缓存失效策略
  async invalidateCache(pattern) {
    return new Promise((resolve, reject) => {
      const stream = this.client.scanStream({
        match: pattern
      });
      
      stream.on('data', (keys) => {
        if (keys.length) {
          const pipeline = this.client.pipeline();
          keys.forEach(key => pipeline.del(key));
          pipeline.exec();
        }
      });
      
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }
  
  // 分布式锁实现
  async acquireLock(lockKey, ttl = 10) {
    const lockValue = Date.now().toString();
    const result = await this.client.set(
      lockKey,
      lockValue,
      'NX',
      'EX',
      ttl
    );
    return result === 'OK' ? lockValue : null;
  }
  
  async releaseLock(lockKey, lockValue) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    return new Promise((resolve, reject) => {
      this.client.eval(script, 1, lockKey, lockValue, (err, result) => {
        if (err) reject(err);
        else resolve(result === 1);
      });
    });
  }
}

// 使用示例
const cache = new CacheService();

// API 路由中使用缓存
app.get('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const cacheKey = `post:${postId}`;
  
  try {
    const post = await cache.getCachedData(
      cacheKey,
      async () => {
        // 从数据库获取数据
        return await Post.findById(postId).populate('author');
      },
      3600 // 1小时缓存
    );
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🚢 第五阶段：DevOps 实践（2-3个月）

### 5.1 容器化（Docker）

#### Dockerfile 最佳实践
```dockerfile
# 多阶段构建示例 - Node.js 应用
# 阶段1：构建阶段
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（利用缓存层）
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 阶段2：运行阶段
FROM node:16-alpine

# 安装 dumb-init 处理信号
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### Docker Compose 编排
```yaml
# docker-compose.yml - 完整应用栈
version: '3.8'

services:
  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - static-files:/usr/share/nginx/html
    depends_on:
      - api
      - frontend
    networks:
      - app-network
    restart: unless-stopped

  # 前端应用
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend-app
    environment:
      - NODE_ENV=production
      - API_URL=http://api:3000
    volumes:
      - static-files:/app/dist
    networks:
      - app-network
    restart: unless-stopped

  # 后端 API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend-api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/appdb
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL 数据库
  postgres:
    image: postgres:14-alpine
    container_name: postgres-db
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=appdb
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network
    restart: unless-stopped

  # 数据库备份服务
  backup:
    image: postgres:14-alpine
    container_name: db-backup
    environment:
      - PGPASSWORD=pass
    volumes:
      - ./backups:/backups
    command: >
      sh -c "while true; do
        pg_dump -h postgres -U user appdb > /backups/backup-$$(date +%Y%m%d-%H%M%S).sql;
        find /backups -type f -mtime +7 -delete;
        sleep 86400;
      done"
    depends_on:
      - postgres
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  static-files:
```

### 5.2 CI/CD 流水线

#### GitHub Actions 配置
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '16'
  DOCKER_REGISTRY: ghcr.io

jobs:
  # 代码质量检查
  lint-and-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

  # 安全扫描
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run SAST scan
        uses: github/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # 构建和推送 Docker 镜像
  build-and-push:
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 部署到开发环境
  deploy-dev:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: development
    
    steps:
      - name: Deploy to development server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.DEV_HOST }}
          username: ${{ secrets.DEV_USER }}
          key: ${{ secrets.DEV_SSH_KEY }}
          script: |
            cd /app
            docker-compose pull
            docker-compose up -d
            docker system prune -f

  # 部署到生产环境
  deploy-prod:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d --no-deps --build
            docker system prune -f
      
      - name: Verify deployment
        run: |
          sleep 30
          curl -f https://api.example.com/health || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

## 🏛️ 第六阶段：系统设计（2-3个月）

### 6.1 架构模式

#### 微服务架构示例
```javascript
// API 网关实现
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

class APIGateway {
  constructor() {
    this.app = express();
    this.services = {
      auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      user: process.env.USER_SERVICE_URL || 'http://user-service:3002',
      product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003',
      order: process.env.ORDER_SERVICE_URL || 'http://order-service:3004'
    };
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      next();
    });
    
    // 限流
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: '请求过于频繁，请稍后再试'
    });
    this.app.use('/api', limiter);
    
    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }
  
  // 认证中间件
  authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: '无效的令牌' });
    }
  }
  
  setupRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    // 认证服务（公开）
    this.app.use('/api/auth', 
      httpProxy.createProxyMiddleware({
        target: this.services.auth,
        changeOrigin: true
      })
    );
    
    // 用户服务（需认证）
    this.app.use('/api/users',
      this.authenticate,
      httpProxy.createProxyMiddleware({
        target: this.services.user,
        changeOrigin: true,
        onProxyReq: (proxyReq, req) => {
          // 传递用户信息到微服务
          proxyReq.setHeader('X-User-Id', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      })
    );
    
    // 产品服务（部分需认证）
    this.app.use('/api/products',
      (req, res, next) => {
        // GET 请求公开，其他需认证
        if (req.method === 'GET') {
          next();
        } else {
          this.authenticate(req, res, next);
        }
      },
      httpProxy.createProxyMiddleware({
        target: this.services.product,
        changeOrigin: true
      })
    );
    
    // 订单服务（需认证）
    this.app.use('/api/orders',
      this.authenticate,
      httpProxy.createProxyMiddleware({
        target: this.services.order,
        changeOrigin: true,
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-User-Id', req.user.id);
        }
      })
    );
    
    // 服务发现和负载均衡
    this.app.get('/api/services', this.authenticate, (req, res) => {
      res.json({
        services: Object.keys(this.services).map(name => ({
          name,
          url: this.services[name],
          status: 'active' // 实际应该检查服务状态
        }))
      });
    });
  }
  
  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`API Gateway running on port ${port}`);
      console.log('Registered services:', this.services);
    });
  }
}

// 启动网关
const gateway = new APIGateway();
gateway.start();
```

### 6.2 性能优化

#### 缓存和性能优化策略
```javascript
// 多级缓存实现
class MultiLevelCache {
  constructor() {
    // L1: 内存缓存（快速，容量小）
    this.memoryCache = new Map();
    this.memoryCacheSize = 100; // 最多 100 个条目
    
    // L2: Redis 缓存（中速，容量中）
    this.redisClient = redis.createClient();
    
    // L3: CDN 缓存（慢速，容量大）
    this.cdnEndpoint = process.env.CDN_ENDPOINT;
  }
  
  async get(key) {
    // 尝试 L1 缓存
    if (this.memoryCache.has(key)) {
      console.log(`L1 cache hit: ${key}`);
      return this.memoryCache.get(key);
    }
    
    // 尝试 L2 缓存
    try {
      const redisValue = await this.redisClient.getAsync(key);
      if (redisValue) {
        console.log(`L2 cache hit: ${key}`);
        const value = JSON.parse(redisValue);
        
        // 提升到 L1 缓存
        this.setMemoryCache(key, value);
        
        return value;
      }
    } catch (error) {
      console.error('Redis error:', error);
    }
    
    // 尝试 L3 缓存（CDN）
    if (this.cdnEndpoint) {
      try {
        const response = await fetch(`${this.cdnEndpoint}/${key}`);
        if (response.ok) {
          console.log(`L3 cache hit: ${key}`);
          const value = await response.json();
          
          // 提升到 L1 和 L2 缓存
          this.setMemoryCache(key, value);
          await this.redisClient.setexAsync(key, 3600, JSON.stringify(value));
          
          return value;
        }
      } catch (error) {
        console.error('CDN error:', error);
      }
    }
    
    console.log(`Cache miss: ${key}`);
    return null;
  }
  
  async set(key, value, options = {}) {
    const { ttl = 3600, cdn = false } = options;
    
    // 写入 L1 缓存
    this.setMemoryCache(key, value);
    
    // 写入 L2 缓存
    try {
      await this.redisClient.setexAsync(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis write error:', error);
    }
    
    // 可选：写入 CDN
    if (cdn && this.cdnEndpoint) {
      // 异步写入 CDN，不阻塞
      this.writeToCDN(key, value).catch(console.error);
    }
  }
  
  setMemoryCache(key, value) {
    // LRU 策略
    if (this.memoryCache.size >= this.memoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, value);
  }
  
  async writeToCDN(key, value) {
    // 实现 CDN 写入逻辑
    const response = await fetch(`${this.cdnEndpoint}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
    
    if (!response.ok) {
      throw new Error(`CDN write failed: ${response.statusText}`);
    }
  }
  
  async invalidate(key) {
    // 清除所有层级的缓存
    this.memoryCache.delete(key);
    await this.redisClient.delAsync(key);
    
    if (this.cdnEndpoint) {
      await fetch(`${this.cdnEndpoint}/${key}`, { method: 'DELETE' });
    }
  }
}

// 数据库查询优化
class QueryOptimizer {
  constructor(db) {
    this.db = db;
    this.cache = new MultiLevelCache();
  }
  
  // 查询结果缓存
  async cachedQuery(sql, params, options = {}) {
    const cacheKey = `query:${this.hashQuery(sql, params)}`;
    
    // 尝试从缓存获取
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 执行查询
    const result = await this.db.query(sql, params);
    
    // 缓存结果
    await this.cache.set(cacheKey, result, options);
    
    return result;
  }
  
  // 批量查询优化
  async batchQuery(ids, tableName, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const placeholders = batch.map(() => '?').join(',');
      const sql = `SELECT * FROM ${tableName} WHERE id IN (${placeholders})`;
      
      const batchResults = await this.cachedQuery(sql, batch);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // 查询哈希生成
  hashQuery(sql, params) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(sql);
    hash.update(JSON.stringify(params));
    return hash.digest('hex');
  }
}
```

## 🎯 第七阶段：实战项目（持续）

### 7.1 全栈项目实战

#### 项目架构设计
```mermaid
graph TB
    subgraph "前端"
        A[React/Vue SPA]
        B[Redux/Vuex]
        C[Router]
    end
    
    subgraph "API 网关"
        D[Kong/Nginx]
        E[认证/授权]
        F[限流/熔断]
    end
    
    subgraph "微服务"
        G[用户服务]
        H[产品服务]
        I[订单服务]
        J[支付服务]
    end
    
    subgraph "数据层"
        K[PostgreSQL]
        L[MongoDB]
        M[Redis]
        N[Elasticsearch]
    end
    
    subgraph "基础设施"
        O[Docker/K8s]
        P[CI/CD]
        Q[监控/日志]
    end
    
    A --> D
    D --> G
    D --> H
    D --> I
    D --> J
    G --> K
    H --> L
    I --> K
    J --> K
    G --> M
    H --> M
    I --> N
```

### 7.2 项目清单

#### 必做项目（展示全栈能力）
1. **博客系统**：展示 CRUD 和基础架构能力
2. **电商平台**：展示复杂业务逻辑处理
3. **社交应用**：展示实时通信和大数据处理
4. **项目管理工具**：展示协作和权限管理
5. **数据可视化平台**：展示数据处理和展示能力

#### 加分项目
1. **开源贡献**：参与知名开源项目
2. **技术博客**：持续输出技术文章
3. **个人工具库**：开发和维护 npm 包
4. **技术分享**：在技术会议或社区分享

## 📈 持续学习与成长

### 技术趋势关注
- **云原生**：Serverless、Service Mesh
- **AI/ML**：机器学习集成、AI 辅助开发
- **Web3**：区块链、去中心化应用
- **边缘计算**：IoT、5G 应用
- **低代码平台**：快速开发平台

### 学习资源推荐
- **在线课程**：Coursera、Udemy、Pluralsight
- **技术文档**：MDN、官方文档
- **开源项目**：GitHub Trending、Awesome 系列
- **技术社区**：Stack Overflow、Reddit、掘金
- **技术播客**：Software Engineering Daily、Changelog

### 个人品牌建设
1. **GitHub**：保持活跃，展示项目
2. **技术博客**：定期更新，分享经验
3. **社交媒体**：LinkedIn、Twitter 技术分享
4. **开源贡献**：参与项目，建立影响力
5. **技术演讲**：参加 Meetup，技术分享

## 🎓 认证与进阶

### 推荐认证
- **云服务**：AWS/Azure/GCP 认证
- **容器技术**：CKA（Kubernetes）
- **安全**：Security+、CEH
- **项目管理**：PMP、Scrum Master
- **数据库**：Oracle、MongoDB 认证

### 职业发展路径
```mermaid
graph LR
    A[初级全栈] --> B[中级全栈]
    B --> C{选择方向}
    C --> D[技术专家]
    C --> E[架构师]
    C --> F[技术管理]
    C --> G[创业/自由职业]
    
    D --> H[首席工程师]
    E --> I[首席架构师]
    F --> J[技术总监/CTO]
    G --> K[技术创始人]
```

## 📋 学习检查清单

### 每日任务
- [ ] 编码练习（1-2小时）
- [ ] 技术阅读（30分钟）
- [ ] 项目开发（2-3小时）
- [ ] 复习笔记（15分钟）

### 每周目标
- [ ] 完成一个小项目或功能
- [ ] 写一篇技术博客
- [ ] 参与开源项目
- [ ] 学习一个新概念

### 每月里程碑
- [ ] 完成一个完整项目
- [ ] 掌握一项新技术
- [ ] 进行技术分享
- [ ] 更新个人作品集

## 🚀 最后建议

1. **保持好奇心**：技术永远在进步，保持学习热情
2. **实践优先**：理论结合实践，动手做项目
3. **建立网络**：参与社区，结识同行
4. **平衡生活**：避免过度学习，保持身心健康
5. **享受过程**：编程是创造的艺术，享受创造的乐趣

---

*记住：成为全栈工程师是一个旅程，而不是目的地。持续学习，不断进步，你终将达到目标！*

**最后更新**: 2024年1月
**作者**: 全栈学习社区
**License**: MIT