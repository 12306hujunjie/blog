---
title: Gevent 异步编程
date: 2020-06-03
tags:
 - 源码解析
 - flask框架
categories: 
 - python
sidebar: auto
---

### Gevent 简介
Gevent 是一个基于 libev 的 Python 并发框架，它使用 greenlet 提供了同步编程的 API，但底层实现了异步 I/O。

#### 核心特性
- 基于 greenlet 的轻量级协程
- 非阻塞 I/O 操作支持
- 猴子补丁(monkey patch)实现对标准库的异步化

### 基础使用示例
```python
import gevent
from gevent import monkey
monkey.patch_all()

def task(n):
    for i in range(n):
        print(f'Task {i}')
        gevent.sleep(0.5)

gevent.joinall([
    gevent.spawn(task, 3),
    gevent.spawn(task, 2)
])
```
