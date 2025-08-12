---
title: Python 异步编程完全指南：从原理到实战优化
date: 2024-01-01
categories:
  - programming
  - python
tags:
  - Python
  - 异步编程
  - asyncio
  - 性能优化
  - 并发
difficulty: advanced
readingTime: 30min
prerequisites:
  - Python 基础语法
  - 函数和装饰器
  - 基本的网络编程概念
learningObjectives:
  - 深入理解 Python 异步编程原理
  - 掌握 asyncio 核心组件和使用模式
  - 学会异步编程性能优化技巧
  - 能够设计和实现高性能异步应用
relatedPosts:
  - python-performance-optimization
  - python-concurrency-patterns
  - python-web-frameworks
---

# Python 异步编程完全指南：从原理到实战优化

## 📖 导读

在现代 Web 应用和微服务架构中，处理高并发 I/O 密集型任务是一个核心挑战。Python 的异步编程模型提供了一种优雅而高效的解决方案。本文将从底层原理出发，深入剖析 Python 异步编程的核心概念，通过实战案例展示如何构建高性能异步应用，并分享生产环境中的优化经验和最佳实践。

## 🎯 学习目标

通过本文，你将：
- **理解事件循环机制**：掌握 asyncio 的核心运行原理
- **精通协程编程**：从基础语法到高级模式的全面掌握
- **优化异步性能**：学会识别和解决性能瓶颈
- **处理复杂场景**：错误处理、并发控制、资源管理
- **构建生产级应用**：真实案例和最佳实践

## 🏗️ 知识架构

```mermaid
graph TB
    A[Python 异步编程] --> B[基础概念]
    A --> C[核心组件]
    A --> D[实战应用]
    A --> E[性能优化]
    
    B --> B1[同步 vs 异步]
    B --> B2[并发 vs 并行]
    B --> B3[事件驱动模型]
    
    C --> C1[协程 Coroutine]
    C --> C2[任务 Task]
    C --> C3[事件循环 Event Loop]
    C --> C4[Future 对象]
    
    D --> D1[异步 HTTP 客户端]
    D --> D2[异步 Web 服务器]
    D --> D3[数据库连接池]
    D --> D4[消息队列集成]
    
    E --> E1[性能分析]
    E --> E2[并发控制]
    E --> E3[内存优化]
    E --> E4[错误处理]
```

## 📚 核心概念

### 1. 同步 vs 异步：本质区别

```python
import time
import asyncio
import aiohttp
import requests
from typing import List, Dict

# 同步方式：阻塞等待
def sync_fetch_url(url: str) -> Dict:
    """同步获取 URL 内容"""
    start = time.time()
    response = requests.get(url)
    elapsed = time.time() - start
    return {
        'url': url,
        'status': response.status_code,
        'length': len(response.content),
        'time': elapsed
    }

def sync_fetch_multiple(urls: List[str]) -> List[Dict]:
    """同步获取多个 URL"""
    results = []
    total_start = time.time()
    
    for url in urls:
        result = sync_fetch_url(url)
        results.append(result)
        print(f"同步完成: {url} - {result['time']:.2f}秒")
    
    total_time = time.time() - total_start
    print(f"同步总耗时: {total_time:.2f}秒")
    return results

# 异步方式：非阻塞并发
async def async_fetch_url(session: aiohttp.ClientSession, url: str) -> Dict:
    """异步获取 URL 内容"""
    start = time.time()
    async with session.get(url) as response:
        content = await response.read()
        elapsed = time.time() - start
        return {
            'url': url,
            'status': response.status,
            'length': len(content),
            'time': elapsed
        }

async def async_fetch_multiple(urls: List[str]) -> List[Dict]:
    """异步并发获取多个 URL"""
    total_start = time.time()
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for url in urls:
            task = asyncio.create_task(async_fetch_url(session, url))
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        for result in results:
            print(f"异步完成: {result['url']} - {result['time']:.2f}秒")
    
    total_time = time.time() - total_start
    print(f"异步总耗时: {total_time:.2f}秒")
    return results

# 性能对比测试
if __name__ == "__main__":
    urls = [
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/3",
        "https://httpbin.org/delay/1"
    ]
    
    print("=" * 50)
    print("同步请求测试:")
    sync_results = sync_fetch_multiple(urls)
    
    print("\n" + "=" * 50)
    print("异步请求测试:")
    async_results = asyncio.run(async_fetch_multiple(urls))
    
    # 结果分析
    print("\n" + "=" * 50)
    print("性能对比:")
    sync_total = sum(r['time'] for r in sync_results)
    async_max = max(r['time'] for r in async_results)
    print(f"同步累计时间: {sync_total:.2f}秒")
    print(f"异步最长时间: {async_max:.2f}秒")
    print(f"性能提升: {sync_total/async_max:.2f}倍")
```

### 2. 事件循环深度剖析

```python
import asyncio
import threading
import time
from typing import Any, Callable
from dataclasses import dataclass
from enum import Enum

class TaskState(Enum):
    """任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class TaskMetrics:
    """任务度量信息"""
    task_id: str
    state: TaskState
    start_time: float = 0
    end_time: float = 0
    error: Exception = None
    result: Any = None
    
    @property
    def duration(self) -> float:
        if self.end_time and self.start_time:
            return self.end_time - self.start_time
        return 0

class EventLoopMonitor:
    """事件循环监控器"""
    
    def __init__(self):
        self.tasks: Dict[str, TaskMetrics] = {}
        self.loop = None
        self._monitoring = False
        
    def start_monitoring(self, loop: asyncio.AbstractEventLoop):
        """开始监控事件循环"""
        self.loop = loop
        self._monitoring = True
        
        # 设置任务工厂
        loop.set_task_factory(self._task_factory)
        
        # 启动监控协程
        asyncio.create_task(self._monitor_loop())
        
    def _task_factory(self, loop, coro):
        """自定义任务工厂，用于跟踪任务"""
        task = asyncio.Task(coro, loop=loop)
        task_id = f"task-{id(task)}"
        
        # 记录任务创建
        self.tasks[task_id] = TaskMetrics(
            task_id=task_id,
            state=TaskState.PENDING,
            start_time=time.time()
        )
        
        # 添加完成回调
        task.add_done_callback(
            lambda t: self._on_task_done(task_id, t)
        )
        
        return task
    
    def _on_task_done(self, task_id: str, task: asyncio.Task):
        """任务完成回调"""
        metrics = self.tasks.get(task_id)
        if not metrics:
            return
            
        metrics.end_time = time.time()
        
        if task.cancelled():
            metrics.state = TaskState.CANCELLED
        elif task.exception():
            metrics.state = TaskState.FAILED
            metrics.error = task.exception()
        else:
            metrics.state = TaskState.COMPLETED
            metrics.result = task.result()
    
    async def _monitor_loop(self):
        """监控事件循环状态"""
        while self._monitoring:
            await asyncio.sleep(1)
            
            # 获取当前运行的任务
            current_tasks = asyncio.all_tasks(self.loop)
            
            print(f"\n📊 事件循环状态:")
            print(f"  活跃任务数: {len(current_tasks)}")
            print(f"  总任务数: {len(self.tasks)}")
            
            # 任务状态统计
            state_counts = {}
            for metrics in self.tasks.values():
                state_counts[metrics.state] = state_counts.get(metrics.state, 0) + 1
            
            for state, count in state_counts.items():
                print(f"  {state.value}: {count}")
    
    def get_metrics(self) -> List[TaskMetrics]:
        """获取所有任务度量"""
        return list(self.tasks.values())
    
    def print_summary(self):
        """打印任务执行摘要"""
        print("\n📈 任务执行摘要:")
        
        completed_tasks = [
            m for m in self.tasks.values() 
            if m.state == TaskState.COMPLETED
        ]
        
        if completed_tasks:
            durations = [t.duration for t in completed_tasks]
            print(f"  完成任务数: {len(completed_tasks)}")
            print(f"  平均执行时间: {sum(durations)/len(durations):.3f}秒")
            print(f"  最短执行时间: {min(durations):.3f}秒")
            print(f"  最长执行时间: {max(durations):.3f}秒")
        
        failed_tasks = [
            m for m in self.tasks.values() 
            if m.state == TaskState.FAILED
        ]
        
        if failed_tasks:
            print(f"  失败任务数: {len(failed_tasks)}")
            for task in failed_tasks:
                print(f"    - {task.task_id}: {task.error}")

# 演示事件循环监控
async def demo_task(name: str, duration: float):
    """演示任务"""
    print(f"🚀 启动任务: {name}")
    await asyncio.sleep(duration)
    
    # 模拟随机失败
    import random
    if random.random() < 0.2:  # 20% 失败率
        raise Exception(f"任务 {name} 执行失败")
    
    print(f"✅ 完成任务: {name}")
    return f"Result from {name}"

async def main():
    """主函数"""
    # 创建监控器
    monitor = EventLoopMonitor()
    loop = asyncio.get_running_loop()
    monitor.start_monitoring(loop)
    
    # 创建多个并发任务
    tasks = []
    for i in range(10):
        duration = (i % 3) + 1  # 1-3 秒
        task = asyncio.create_task(
            demo_task(f"Task-{i}", duration)
        )
        tasks.append(task)
        await asyncio.sleep(0.1)  # 稍微错开启动时间
    
    # 等待所有任务完成
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 打印监控摘要
    monitor.print_summary()
    
    # 停止监控
    monitor._monitoring = False

if __name__ == "__main__":
    asyncio.run(main())
```

### 3. 协程的生命周期管理

```python
import asyncio
import functools
import inspect
from typing import Any, Callable, Optional
from contextlib import asynccontextmanager
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CoroutineLifecycleManager:
    """协程生命周期管理器"""
    
    def __init__(self):
        self.active_coroutines = {}
        self.completed_coroutines = {}
        
    def track_coroutine(self, name: str = None):
        """装饰器：跟踪协程生命周期"""
        def decorator(coro_func: Callable):
            @functools.wraps(coro_func)
            async def wrapper(*args, **kwargs):
                # 生成协程 ID
                coro_name = name or coro_func.__name__
                coro_id = f"{coro_name}-{id(asyncio.current_task())}"
                
                # 记录协程启动
                self.active_coroutines[coro_id] = {
                    'name': coro_name,
                    'start_time': asyncio.get_event_loop().time(),
                    'task': asyncio.current_task()
                }
                
                logger.info(f"🟢 协程启动: {coro_id}")
                
                try:
                    # 执行协程
                    result = await coro_func(*args, **kwargs)
                    
                    # 记录成功完成
                    self._mark_completed(coro_id, 'success', result)
                    logger.info(f"✅ 协程成功: {coro_id}")
                    
                    return result
                    
                except asyncio.CancelledError:
                    # 处理取消
                    self._mark_completed(coro_id, 'cancelled', None)
                    logger.warning(f"🟡 协程取消: {coro_id}")
                    raise
                    
                except Exception as e:
                    # 处理异常
                    self._mark_completed(coro_id, 'failed', None, error=e)
                    logger.error(f"❌ 协程失败: {coro_id} - {e}")
                    raise
                    
                finally:
                    # 清理活跃协程记录
                    self.active_coroutines.pop(coro_id, None)
            
            return wrapper
        return decorator
    
    def _mark_completed(self, coro_id: str, status: str, result: Any, error: Exception = None):
        """标记协程完成"""
        info = self.active_coroutines.get(coro_id, {})
        end_time = asyncio.get_event_loop().time()
        
        self.completed_coroutines[coro_id] = {
            'name': info.get('name'),
            'status': status,
            'duration': end_time - info.get('start_time', end_time),
            'result': result,
            'error': error
        }
    
    def get_active_coroutines(self):
        """获取活跃协程列表"""
        return list(self.active_coroutines.values())
    
    def get_statistics(self):
        """获取协程执行统计"""
        stats = {
            'active': len(self.active_coroutines),
            'completed': len(self.completed_coroutines),
            'success': 0,
            'failed': 0,
            'cancelled': 0,
            'total_duration': 0
        }
        
        for info in self.completed_coroutines.values():
            stats[info['status']] = stats.get(info['status'], 0) + 1
            stats['total_duration'] += info.get('duration', 0)
        
        if stats['completed'] > 0:
            stats['avg_duration'] = stats['total_duration'] / stats['completed']
        
        return stats

# 全局生命周期管理器
lifecycle_manager = CoroutineLifecycleManager()

# 协程超时管理
class TimeoutManager:
    """协程超时管理器"""
    
    @staticmethod
    async def with_timeout(coro, timeout: float, default: Any = None):
        """为协程添加超时控制"""
        try:
            return await asyncio.wait_for(coro, timeout)
        except asyncio.TimeoutError:
            logger.warning(f"⏱️ 协程超时 ({timeout}秒)")
            return default
    
    @staticmethod
    def timeout_decorator(seconds: float, default: Any = None):
        """超时装饰器"""
        def decorator(coro_func):
            @functools.wraps(coro_func)
            async def wrapper(*args, **kwargs):
                return await TimeoutManager.with_timeout(
                    coro_func(*args, **kwargs),
                    seconds,
                    default
                )
            return wrapper
        return decorator

# 协程重试机制
class RetryManager:
    """协程重试管理器"""
    
    @staticmethod
    async def with_retry(
        coro_func: Callable,
        max_attempts: int = 3,
        delay: float = 1.0,
        backoff: float = 2.0,
        exceptions: tuple = (Exception,)
    ):
        """带重试的协程执行"""
        attempt = 0
        current_delay = delay
        
        while attempt < max_attempts:
            try:
                return await coro_func()
            except exceptions as e:
                attempt += 1
                if attempt >= max_attempts:
                    logger.error(f"🔄 重试失败，已达最大次数: {max_attempts}")
                    raise
                
                logger.warning(f"🔄 第 {attempt} 次重试，等待 {current_delay:.1f} 秒...")
                await asyncio.sleep(current_delay)
                current_delay *= backoff
    
    @staticmethod
    def retry_decorator(
        max_attempts: int = 3,
        delay: float = 1.0,
        backoff: float = 2.0,
        exceptions: tuple = (Exception,)
    ):
        """重试装饰器"""
        def decorator(coro_func):
            @functools.wraps(coro_func)
            async def wrapper(*args, **kwargs):
                return await RetryManager.with_retry(
                    lambda: coro_func(*args, **kwargs),
                    max_attempts,
                    delay,
                    backoff,
                    exceptions
                )
            return wrapper
        return decorator

# 资源管理
@asynccontextmanager
async def managed_resource(resource_name: str):
    """异步上下文管理器示例"""
    logger.info(f"📂 获取资源: {resource_name}")
    resource = {'name': resource_name, 'data': []}
    
    try:
        yield resource
    finally:
        logger.info(f"📁 释放资源: {resource_name}")
        # 执行清理操作
        await asyncio.sleep(0.1)  # 模拟异步清理

# 使用示例
@lifecycle_manager.track_coroutine("数据处理")
@TimeoutManager.timeout_decorator(5.0, default={'error': 'timeout'})
@RetryManager.retry_decorator(max_attempts=3, delay=0.5)
async def process_data(data_id: str):
    """处理数据的协程"""
    async with managed_resource(f"data-{data_id}") as resource:
        # 模拟数据处理
        await asyncio.sleep(1)
        
        # 模拟偶发错误
        import random
        if random.random() < 0.3:
            raise ValueError(f"处理数据 {data_id} 时出错")
        
        resource['data'].append(f"processed-{data_id}")
        return resource

async def lifecycle_demo():
    """生命周期管理演示"""
    tasks = []
    
    # 创建多个数据处理任务
    for i in range(5):
        task = asyncio.create_task(process_data(f"item-{i}"))
        tasks.append(task)
    
    # 等待所有任务完成
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 打印结果
    print("\n📊 执行结果:")
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"  Task-{i}: ❌ {result}")
        else:
            print(f"  Task-{i}: ✅ {result}")
    
    # 打印统计信息
    stats = lifecycle_manager.get_statistics()
    print("\n📈 执行统计:")
    for key, value in stats.items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    asyncio.run(lifecycle_demo())
```

## 💻 实践案例

### 1. 高性能异步 Web 爬虫

```python
import asyncio
import aiohttp
import aiofiles
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict, Optional
import hashlib
import json
import time
from dataclasses import dataclass, asdict
from asyncio import Semaphore
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CrawlResult:
    """爬取结果"""
    url: str
    status_code: int
    title: str
    content_length: int
    links: List[str]
    crawl_time: float
    error: Optional[str] = None

class AsyncWebCrawler:
    """高性能异步网络爬虫"""
    
    def __init__(
        self,
        max_concurrent: int = 10,
        max_per_host: int = 3,
        timeout: int = 10,
        max_retries: int = 3,
        user_agent: str = "AsyncCrawler/1.0"
    ):
        self.max_concurrent = max_concurrent
        self.max_per_host = max_per_host
        self.timeout = timeout
        self.max_retries = max_retries
        self.user_agent = user_agent
        
        # 并发控制
        self.semaphore = Semaphore(max_concurrent)
        self.host_semaphores: Dict[str, Semaphore] = {}
        
        # 爬取状态
        self.visited_urls: Set[str] = set()
        self.failed_urls: Set[str] = set()
        self.results: List[CrawlResult] = []
        
        # 统计信息
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'total_bytes': 0,
            'start_time': 0,
            'end_time': 0
        }
    
    def _get_host_semaphore(self, url: str) -> Semaphore:
        """获取主机级别的信号量"""
        host = urlparse(url).netloc
        if host not in self.host_semaphores:
            self.host_semaphores[host] = Semaphore(self.max_per_host)
        return self.host_semaphores[host]
    
    def _should_crawl(self, url: str) -> bool:
        """判断是否应该爬取 URL"""
        # 去重
        if url in self.visited_urls:
            return False
        
        # 过滤无效 URL
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return False
        
        # 只爬取 HTTP/HTTPS
        if parsed.scheme not in ['http', 'https']:
            return False
        
        return True
    
    async def _extract_links(self, html: str, base_url: str) -> List[str]:
        """从 HTML 中提取链接"""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        
        for tag in soup.find_all(['a', 'link']):
            href = tag.get('href')
            if href:
                absolute_url = urljoin(base_url, href)
                links.append(absolute_url)
        
        return links
    
    async def _fetch_with_retry(
        self,
        session: aiohttp.ClientSession,
        url: str
    ) -> CrawlResult:
        """带重试的页面获取"""
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()
                
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=self.timeout),
                    headers={'User-Agent': self.user_agent}
                ) as response:
                    html = await response.text()
                    
                    # 提取页面信息
                    soup = BeautifulSoup(html, 'html.parser')
                    title = soup.title.string if soup.title else "No Title"
                    links = await self._extract_links(html, url)
                    
                    crawl_time = time.time() - start_time
                    
                    return CrawlResult(
                        url=url,
                        status_code=response.status,
                        title=title.strip() if title else "",
                        content_length=len(html),
                        links=links[:50],  # 限制链接数量
                        crawl_time=crawl_time
                    )
                    
            except asyncio.TimeoutError:
                error = f"Timeout (attempt {attempt + 1}/{self.max_retries})"
                logger.warning(f"⏱️ {url}: {error}")
                
            except aiohttp.ClientError as e:
                error = f"Client error: {e} (attempt {attempt + 1}/{self.max_retries})"
                logger.warning(f"⚠️ {url}: {error}")
                
            except Exception as e:
                error = f"Unexpected error: {e}"
                logger.error(f"❌ {url}: {error}")
                break
            
            # 指数退避
            if attempt < self.max_retries - 1:
                await asyncio.sleep(2 ** attempt)
        
        # 所有重试失败
        return CrawlResult(
            url=url,
            status_code=0,
            title="",
            content_length=0,
            links=[],
            crawl_time=0,
            error=error
        )
    
    async def crawl_url(
        self,
        session: aiohttp.ClientSession,
        url: str
    ) -> Optional[CrawlResult]:
        """爬取单个 URL"""
        if not self._should_crawl(url):
            return None
        
        # 标记为已访问
        self.visited_urls.add(url)
        self.stats['total_requests'] += 1
        
        # 获取信号量
        host_semaphore = self._get_host_semaphore(url)
        
        async with self.semaphore:  # 全局并发控制
            async with host_semaphore:  # 主机级并发控制
                logger.info(f"🕷️ 爬取: {url}")
                
                result = await self._fetch_with_retry(session, url)
                
                if result.error:
                    self.failed_urls.add(url)
                    self.stats['failed_requests'] += 1
                else:
                    self.stats['successful_requests'] += 1
                    self.stats['total_bytes'] += result.content_length
                
                self.results.append(result)
                return result
    
    async def crawl_recursive(
        self,
        start_url: str,
        max_depth: int = 2,
        max_pages: int = 100
    ) -> List[CrawlResult]:
        """递归爬取"""
        self.stats['start_time'] = time.time()
        
        async with aiohttp.ClientSession() as session:
            # BFS 队列
            queue = [(start_url, 0)]  # (url, depth)
            
            while queue and len(self.visited_urls) < max_pages:
                # 批量处理当前层级
                current_batch = []
                next_batch = []
                
                for url, depth in queue:
                    if depth <= max_depth and len(current_batch) < 10:
                        current_batch.append((url, depth))
                    elif depth < max_depth:
                        next_batch.append((url, depth))
                
                queue = next_batch
                
                # 并发爬取当前批次
                tasks = []
                for url, depth in current_batch:
                    task = asyncio.create_task(self.crawl_url(session, url))
                    tasks.append((task, depth))
                
                # 等待批次完成
                for task, depth in tasks:
                    result = await task
                    
                    # 添加子链接到队列
                    if result and not result.error and depth < max_depth:
                        for link in result.links[:10]:  # 限制每页链接数
                            if self._should_crawl(link):
                                queue.append((link, depth + 1))
        
        self.stats['end_time'] = time.time()
        return self.results
    
    def print_statistics(self):
        """打印爬取统计"""
        duration = self.stats['end_time'] - self.stats['start_time']
        
        print("\n" + "=" * 60)
        print("📊 爬取统计")
        print("=" * 60)
        print(f"总请求数: {self.stats['total_requests']}")
        print(f"成功请求: {self.stats['successful_requests']}")
        print(f"失败请求: {self.stats['failed_requests']}")
        print(f"总下载量: {self.stats['total_bytes'] / 1024 / 1024:.2f} MB")
        print(f"总耗时: {duration:.2f} 秒")
        print(f"平均速度: {self.stats['total_requests'] / duration:.2f} 页/秒")
        print(f"平均页面大小: {self.stats['total_bytes'] / max(1, self.stats['successful_requests']) / 1024:.2f} KB")
        
        # 失败 URL 列表
        if self.failed_urls:
            print(f"\n❌ 失败的 URL ({len(self.failed_urls)} 个):")
            for url in list(self.failed_urls)[:5]:
                print(f"  - {url}")
    
    async def save_results(self, filename: str = "crawl_results.json"):
        """保存爬取结果"""
        async with aiofiles.open(filename, 'w', encoding='utf-8') as f:
            data = {
                'stats': self.stats,
                'results': [asdict(r) for r in self.results]
            }
            await f.write(json.dumps(data, indent=2, ensure_ascii=False))
        
        logger.info(f"💾 结果已保存到: {filename}")

# 爬虫使用示例
async def main():
    """主函数"""
    crawler = AsyncWebCrawler(
        max_concurrent=20,
        max_per_host=5,
        timeout=10
    )
    
    # 开始爬取
    start_url = "https://example.com"
    results = await crawler.crawl_recursive(
        start_url,
        max_depth=2,
        max_pages=50
    )
    
    # 打印统计
    crawler.print_statistics()
    
    # 保存结果
    await crawler.save_results()
    
    # 打印前 5 个结果
    print("\n📝 爬取结果示例:")
    for result in results[:5]:
        print(f"\nURL: {result.url}")
        print(f"  标题: {result.title}")
        print(f"  状态码: {result.status_code}")
        print(f"  页面大小: {result.content_length / 1024:.2f} KB")
        print(f"  爬取时间: {result.crawl_time:.2f} 秒")
        print(f"  链接数: {len(result.links)}")

if __name__ == "__main__":
    asyncio.run(main())
```

### 2. 异步数据库连接池

```python
import asyncio
import asyncpg
import aioredis
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager
import json
import logging
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class AsyncDatabasePool:
    """异步数据库连接池管理器"""
    
    def __init__(
        self,
        postgres_dsn: str,
        redis_url: str,
        pg_min_size: int = 10,
        pg_max_size: int = 20,
        cache_ttl: int = 300
    ):
        self.postgres_dsn = postgres_dsn
        self.redis_url = redis_url
        self.pg_min_size = pg_min_size
        self.pg_max_size = pg_max_size
        self.cache_ttl = cache_ttl
        
        self.pg_pool: Optional[asyncpg.Pool] = None
        self.redis_pool: Optional[aioredis.Redis] = None
        
        # 性能统计
        self.stats = {
            'queries': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'total_query_time': 0
        }
    
    async def initialize(self):
        """初始化连接池"""
        logger.info("🔧 初始化数据库连接池...")
        
        # 创建 PostgreSQL 连接池
        self.pg_pool = await asyncpg.create_pool(
            self.postgres_dsn,
            min_size=self.pg_min_size,
            max_size=self.pg_max_size,
            command_timeout=60
        )
        
        # 创建 Redis 连接池
        self.redis_pool = await aioredis.create_redis_pool(
            self.redis_url,
            encoding='utf-8'
        )
        
        logger.info("✅ 数据库连接池初始化完成")
    
    async def close(self):
        """关闭连接池"""
        if self.pg_pool:
            await self.pg_pool.close()
        
        if self.redis_pool:
            self.redis_pool.close()
            await self.redis_pool.wait_closed()
        
        logger.info("🔒 数据库连接池已关闭")
    
    @asynccontextmanager
    async def acquire_pg_connection(self):
        """获取 PostgreSQL 连接"""
        async with self.pg_pool.acquire() as connection:
            yield connection
    
    def _cache_key(self, query: str, params: tuple) -> str:
        """生成缓存键"""
        import hashlib
        key_str = f"{query}:{str(params)}"
        return f"query:{hashlib.md5(key_str.encode()).hexdigest()}"
    
    async def execute_query(
        self,
        query: str,
        *params,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """执行查询（带缓存）"""
        self.stats['queries'] += 1
        start_time = time.time()
        
        # 尝试从缓存获取
        if use_cache:
            cache_key = self._cache_key(query, params)
            cached = await self.redis_pool.get(cache_key)
            
            if cached:
                self.stats['cache_hits'] += 1
                logger.debug(f"🎯 缓存命中: {cache_key}")
                return json.loads(cached)
            else:
                self.stats['cache_misses'] += 1
        
        # 执行数据库查询
        async with self.acquire_pg_connection() as conn:
            rows = await conn.fetch(query, *params)
            result = [dict(row) for row in rows]
        
        # 写入缓存
        if use_cache and result:
            cache_key = self._cache_key(query, params)
            await self.redis_pool.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(result, default=str)
            )
            logger.debug(f"💾 写入缓存: {cache_key}")
        
        # 更新统计
        query_time = time.time() - start_time
        self.stats['total_query_time'] += query_time
        
        return result
    
    async def execute_transaction(self, operations: List[tuple]) -> bool:
        """执行事务"""
        async with self.acquire_pg_connection() as conn:
            async with conn.transaction():
                try:
                    for query, params in operations:
                        await conn.execute(query, *params)
                    return True
                except Exception as e:
                    logger.error(f"❌ 事务执行失败: {e}")
                    raise
    
    async def bulk_insert(
        self,
        table: str,
        records: List[Dict[str, Any]]
    ) -> int:
        """批量插入"""
        if not records:
            return 0
        
        # 构建插入语句
        columns = list(records[0].keys())
        values_template = ", ".join([f"${i+1}" for i in range(len(columns))])
        
        query = f"""
            INSERT INTO {table} ({", ".join(columns)})
            VALUES ({values_template})
        """
        
        # 批量执行
        async with self.acquire_pg_connection() as conn:
            count = 0
            async with conn.transaction():
                for record in records:
                    values = [record[col] for col in columns]
                    await conn.execute(query, *values)
                    count += 1
        
        # 清除相关缓存
        await self.invalidate_cache_pattern(f"query:*{table}*")
        
        return count
    
    async def invalidate_cache_pattern(self, pattern: str):
        """按模式清除缓存"""
        cursor = b'0'
        while cursor:
            cursor, keys = await self.redis_pool.scan(
                cursor, match=pattern
            )
            if keys:
                await self.redis_pool.delete(*keys)
                logger.debug(f"🗑️ 清除缓存: {len(keys)} 个键")
    
    def get_statistics(self) -> Dict[str, Any]:
        """获取性能统计"""
        stats = self.stats.copy()
        
        if stats['queries'] > 0:
            stats['cache_hit_rate'] = stats['cache_hits'] / stats['queries']
            stats['avg_query_time'] = stats['total_query_time'] / stats['queries']
        
        return stats

# 连接池使用示例
class UserRepository:
    """用户仓库（使用连接池）"""
    
    def __init__(self, db_pool: AsyncDatabasePool):
        self.db = db_pool
    
    async def create_table(self):
        """创建用户表"""
        query = """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        async with self.db.acquire_pg_connection() as conn:
            await conn.execute(query)
    
    async def find_by_id(self, user_id: int) -> Optional[Dict]:
        """根据 ID 查找用户"""
        query = "SELECT * FROM users WHERE id = $1"
        results = await self.db.execute_query(query, user_id)
        return results[0] if results else None
    
    async def find_by_username(self, username: str) -> Optional[Dict]:
        """根据用户名查找"""
        query = "SELECT * FROM users WHERE username = $1"
        results = await self.db.execute_query(query, username)
        return results[0] if results else None
    
    async def create_user(self, username: str, email: str) -> Dict:
        """创建用户"""
        query = """
            INSERT INTO users (username, email)
            VALUES ($1, $2)
            RETURNING *
        """
        
        async with self.db.acquire_pg_connection() as conn:
            row = await conn.fetchrow(query, username, email)
            user = dict(row)
        
        # 清除缓存
        await self.db.invalidate_cache_pattern("query:*users*")
        
        return user
    
    async def update_user(self, user_id: int, **kwargs) -> Optional[Dict]:
        """更新用户"""
        if not kwargs:
            return None
        
        # 构建更新语句
        set_clauses = []
        values = []
        for i, (key, value) in enumerate(kwargs.items(), 1):
            set_clauses.append(f"{key} = ${i}")
            values.append(value)
        
        values.append(user_id)
        query = f"""
            UPDATE users
            SET {", ".join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${len(values)}
            RETURNING *
        """
        
        async with self.db.acquire_pg_connection() as conn:
            row = await conn.fetchrow(query, *values)
            
        if row:
            # 清除缓存
            await self.db.invalidate_cache_pattern(f"query:*users*")
            return dict(row)
        
        return None

async def database_demo():
    """数据库连接池演示"""
    # 初始化连接池
    db_pool = AsyncDatabasePool(
        postgres_dsn="postgresql://user:pass@localhost/testdb",
        redis_url="redis://localhost:6379",
        pg_min_size=5,
        pg_max_size=10
    )
    
    try:
        await db_pool.initialize()
        
        # 创建用户仓库
        user_repo = UserRepository(db_pool)
        await user_repo.create_table()
        
        # 并发测试
        async def create_and_query_user(index: int):
            """创建并查询用户"""
            # 创建用户
            user = await user_repo.create_user(
                username=f"user_{index}",
                email=f"user_{index}@example.com"
            )
            logger.info(f"✅ 创建用户: {user['username']}")
            
            # 查询用户（第一次，缓存未命中）
            found = await user_repo.find_by_id(user['id'])
            
            # 再次查询（缓存命中）
            found_cached = await user_repo.find_by_id(user['id'])
            
            return found
        
        # 并发创建和查询用户
        tasks = []
        for i in range(10):
            task = asyncio.create_task(create_and_query_user(i))
            tasks.append(task)
        
        users = await asyncio.gather(*tasks)
        
        # 打印统计
        stats = db_pool.get_statistics()
        print("\n📊 数据库性能统计:")
        print(f"  总查询数: {stats['queries']}")
        print(f"  缓存命中: {stats['cache_hits']}")
        print(f"  缓存未命中: {stats['cache_misses']}")
        print(f"  缓存命中率: {stats.get('cache_hit_rate', 0):.2%}")
        print(f"  平均查询时间: {stats.get('avg_query_time', 0):.3f} 秒")
        
    finally:
        await db_pool.close()

if __name__ == "__main__":
    asyncio.run(database_demo())
```

## 🔍 深度解析

### 1. 异步 vs 多线程 vs 多进程

```python
import asyncio
import threading
import multiprocessing
import time
import concurrent.futures
from typing import List, Callable
import requests
import aiohttp

class ConcurrencyComparison:
    """并发模型对比"""
    
    @staticmethod
    def cpu_bound_task(n: int) -> int:
        """CPU 密集型任务：计算斐波那契数"""
        if n <= 1:
            return n
        return ConcurrencyComparison.cpu_bound_task(n-1) + \
               ConcurrencyComparison.cpu_bound_task(n-2)
    
    @staticmethod
    def io_bound_task(url: str) -> int:
        """I/O 密集型任务：网络请求"""
        response = requests.get(url)
        return len(response.content)
    
    @staticmethod
    async def async_io_bound_task(session: aiohttp.ClientSession, url: str) -> int:
        """异步 I/O 任务"""
        async with session.get(url) as response:
            content = await response.read()
            return len(content)
    
    @staticmethod
    def test_sequential(task_func: Callable, args_list: List) -> float:
        """顺序执行测试"""
        start = time.time()
        results = []
        
        for args in args_list:
            result = task_func(args)
            results.append(result)
        
        return time.time() - start
    
    @staticmethod
    def test_threading(task_func: Callable, args_list: List) -> float:
        """多线程测试"""
        start = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(task_func, args) for args in args_list]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        return time.time() - start
    
    @staticmethod
    def test_multiprocessing(task_func: Callable, args_list: List) -> float:
        """多进程测试"""
        start = time.time()
        
        with multiprocessing.Pool(processes=4) as pool:
            results = pool.map(task_func, args_list)
        
        return time.time() - start
    
    @staticmethod
    async def test_asyncio(urls: List[str]) -> float:
        """异步测试"""
        start = time.time()
        
        async with aiohttp.ClientSession() as session:
            tasks = [
                ConcurrencyComparison.async_io_bound_task(session, url)
                for url in urls
            ]
            results = await asyncio.gather(*tasks)
        
        return time.time() - start

async def performance_comparison():
    """性能对比测试"""
    print("🔬 并发模型性能对比")
    print("=" * 60)
    
    # CPU 密集型任务测试
    print("\n📊 CPU 密集型任务（计算斐波那契数）:")
    cpu_tasks = [30] * 10
    
    seq_time = ConcurrencyComparison.test_sequential(
        ConcurrencyComparison.cpu_bound_task, cpu_tasks
    )
    print(f"  顺序执行: {seq_time:.2f} 秒")
    
    thread_time = ConcurrencyComparison.test_threading(
        ConcurrencyComparison.cpu_bound_task, cpu_tasks
    )
    print(f"  多线程: {thread_time:.2f} 秒")
    
    mp_time = ConcurrencyComparison.test_multiprocessing(
        ConcurrencyComparison.cpu_bound_task, cpu_tasks
    )
    print(f"  多进程: {mp_time:.2f} 秒")
    
    # I/O 密集型任务测试
    print("\n📊 I/O 密集型任务（网络请求）:")
    urls = ["https://httpbin.org/delay/1"] * 10
    
    seq_io_time = ConcurrencyComparison.test_sequential(
        ConcurrencyComparison.io_bound_task, urls
    )
    print(f"  顺序执行: {seq_io_time:.2f} 秒")
    
    thread_io_time = ConcurrencyComparison.test_threading(
        ConcurrencyComparison.io_bound_task, urls
    )
    print(f"  多线程: {thread_io_time:.2f} 秒")
    
    async_io_time = await ConcurrencyComparison.test_asyncio(urls)
    print(f"  异步: {async_io_time:.2f} 秒")
    
    # 结论
    print("\n📈 结论:")
    print("  - CPU 密集型：多进程 > 多线程 > 顺序执行")
    print("  - I/O 密集型：异步 > 多线程 > 顺序执行")
    print("  - 异步适合 I/O 密集型，多进程适合 CPU 密集型")

if __name__ == "__main__":
    asyncio.run(performance_comparison())
```

## ⚠️ 常见问题与解决方案

### 问题1：协程未正确等待
**症状**: `RuntimeWarning: coroutine was never awaited`
**原因**: 调用协程函数时忘记使用 await
**解决**:
```python
# ❌ 错误
async def main():
    fetch_data()  # 忘记 await

# ✅ 正确
async def main():
    await fetch_data()
```

### 问题2：事件循环冲突
**症状**: `RuntimeError: This event loop is already running`
**原因**: 在已运行的事件循环中尝试运行另一个
**解决**:
```python
# 使用 nest_asyncio 解决 Jupyter 环境问题
import nest_asyncio
nest_asyncio.apply()
```

### 问题3：内存泄漏
**症状**: 长时间运行后内存持续增长
**原因**: 任务未正确清理或循环引用
**解决**:
```python
# 使用弱引用避免循环引用
import weakref

class TaskManager:
    def __init__(self):
        self.tasks = weakref.WeakSet()
    
    def add_task(self, task):
        self.tasks.add(task)
```

## 🚀 进阶扩展

### 1. 异步生成器和异步迭代器
### 2. 异步上下文管理器
### 3. 异步队列和生产者-消费者模式
### 4. 与同步代码的互操作
### 5. 异步测试最佳实践

## 📊 性能优化建议

1. **合理控制并发数**：使用 Semaphore 限制并发
2. **连接池复用**：避免频繁创建销毁连接
3. **批量操作**：减少 I/O 次数
4. **缓存策略**：合理使用内存和 Redis 缓存
5. **监控和调试**：使用 aiomonitor 监控运行状态

## 🔗 参考资源

- [Python asyncio 官方文档](https://docs.python.org/3/library/asyncio.html)
- [aiohttp 文档](https://docs.aiohttp.org/)
- [asyncpg 文档](https://magicstack.github.io/asyncpg/)
- [Python Async/Await 教程](https://realpython.com/async-io-python/)

## 💭 思考题

1. 什么情况下异步编程反而会降低性能？
2. 如何设计一个支持背压的异步流处理系统？
3. 在微服务架构中，如何实现异步服务间通信？

## 📝 总结

Python 异步编程是处理高并发 I/O 密集型任务的利器。通过深入理解事件循环机制、掌握协程编程模式、合理设计并发架构，我们可以构建出高性能、可扩展的异步应用。记住，异步编程不是银弹，要根据具体场景选择合适的并发模型。

---

**相关文章**: [文档中心](../../../docs/) - 查看更多技术文档和学习资料