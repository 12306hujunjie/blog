---
title: Cgroups 资源管理
date: 2025-08-04
tags:
 - runc
 - 云原生
 - Cgroups
categories:
 - 云原生
sidebar: auto
---

# Cgroups 资源管理

> **系列导航：** [runc 容器运行时深度解析系列](./README.md) → 第四篇：Cgroups 资源管理  
> **上一篇：** [Namespace隔离实现](./03-Namespace隔离实现.md)  
> **最后更新：** 2024

## 概述

本文深入分析 runc 如何利用 Linux Cgroups 实现容器资源管理和限制。Cgroups 是容器资源隔离的核心机制，能够精确控制容器对 CPU、内存、I/O 等资源的使用。

## 🎯 学习目标

完成本模块后，你将能够：
- 深入理解 Linux Cgroups 的核心概念和层次结构
- 掌握 cgroups v1 和 v2 的架构差异和实现原理
- 理解 CPU、内存、IO、设备等资源控制机制
- 掌握 runc 中资源限制的配置和应用流程
- 具备资源监控、统计和性能调优的实践能力

## 1. Cgroups 基础概念

### 1.1 什么是 Cgroups？

**Cgroups (Control Groups)** 是 Linux 内核提供的资源管理和隔离机制，允许对进程组进行资源限制、优先级分配和资源使用统计。

```
┌─────────────────────────────────────────────────┐
│                    物理机器                     │
│  CPU: 8核   Memory: 16GB   Disk: 1TB          │
└┬────────────────────┬───────────────────────────┘
 │                    │
 ▼                    ▼
┌─────────────────┐  ┌─────────────────────────────┐
│   容器 A        │  │        容器 B               │
│ CPU: 2核 (25%)  │  │    CPU: 4核 (50%)          │
│ Memory: 4GB     │  │    Memory: 8GB             │
│ IO: 100MB/s     │  │    IO: 200MB/s             │
└─────────────────┘  └─────────────────────────────┘
       ▲                        ▲
   cgroup-a                 cgroup-b
```

**核心功能**：
- 🎯 **资源限制**: 限制进程组使用的资源上限
- ⚖️ **优先级分配**: 分配不同的资源权重
- 📊 **资源统计**: 监控和统计资源使用情况
- 🔧 **资源控制**: 动态调整资源配置

### 1.2 Cgroups 层次结构

```
/sys/fs/cgroup/         ← cgroup 文件系统根目录
├── system.slice/       ← systemd 创建的系统服务
│   ├── cgroup.procs    ← 进程列表
│   ├── cpu.shares      ← CPU 权重
│   └── memory.limit_in_bytes ← 内存限制
├── user.slice/         ← 用户会话
└── machine.slice/      ← 虚拟机和容器
    └── docker-abc123.scope/
        ├── cgroup.procs
        ├── cpu.cfs_quota_us
        ├── cpu.cfs_period_us
        ├── memory.limit_in_bytes
        ├── memory.usage_in_bytes
        └── blkio.throttle.read_bps_device
```

**层次结构特点**：
- 🌳 **树形结构**: 子 cgroup 继承父 cgroup 的属性
- 👥 **进程归属**: 每个进程属于且仅属于一个 cgroup
- 📋 **控制器**: 每个控制器独立管理特定类型资源

## 2. Cgroups v1 vs v2 架构差异

### 2.1 架构对比图

#### Cgroups v1 (多层次架构)

```
/sys/fs/cgroup/
├── cpu/              ← CPU 控制器独立层次
│   ├── system/
│   └── docker/
│       └── container1/
├── memory/           ← 内存控制器独立层次  
│   ├── system/
│   └── docker/
│       └── container1/
├── blkio/            ← IO 控制器独立层次
│   ├── system/
│   └── docker/
│       └── container1/
└── devices/          ← 设备控制器独立层次
    ├── system/
    └── docker/
        └── container1/
```

#### Cgroups v2 (统一层次架构)

```
/sys/fs/cgroup/              ← 统一文件系统
├── cgroup.controllers       ← 可用控制器列表
├── cgroup.subtree_control   ← 启用的子控制器
├── system.slice/
│   ├── cpu.weight          ← 所有控制器文件
│   ├── memory.max          ← 都在同一目录
│   ├── io.max
│   └── cgroup.procs
└── machine.slice/
    └── docker-abc123.scope/
        ├── cpu.weight
        ├── memory.max
        ├── io.max
        └── cgroup.procs
```

### 2.2 核心差异对比

| 特性 | Cgroups v1 | Cgroups v2 |
|------|------------|------------|
| **层次结构** | 多个独立层次 | 统一层次结构 |
| **控制器管理** | 每个控制器独立挂载 | 所有控制器统一管理 |
| **CPU权重** | `cpu.shares` (2-262144) | `cpu.weight` (1-10000) |
| **内存交换** | `memory.memsw.limit_in_bytes` | `memory.swap.max` |
| **IO控制** | `blkio.*` 接口 | `io.*` 接口 |
| **设备控制** | 白名单机制 | eBPF 程序 |
| **内存回收** | 复杂的页面回收 | 统一的内存回收策略 |
| **PSI支持** | 不支持 | 内置压力失速信息 |

### 2.3 runc 的实现适配

runc 通过抽象接口同时支持两个版本：

```go
// 统一的 Manager 接口
type Manager interface {
    Apply(pid int) error           // 将进程加入 cgroup
    GetPids() ([]int, error)       // 获取 cgroup 中的进程列表
    GetAllPids() ([]int, error)    // 获取包括子 cgroup 的所有进程
    GetStats() (*Stats, error)     // 获取资源使用统计
    Freeze(state FreezerState) error // 冻结/解冻进程
    Destroy() error               // 销毁 cgroup
    Set(r *Resources) error       // 设置资源限制
    GetPaths() map[string]string  // 获取 cgroup 路径
}

// 版本检测和管理器创建
func NewManager(config *configs.Config) (Manager, error) {
    if cgroups.IsCgroup2UnifiedMode() {
        // 使用 v2 管理器
        return fs2.NewManager(config, path)
    } else {
        // 使用 v1 管理器  
        return fs.NewManager(config, paths)
    }
}
```

## 3. 核心资源控制机制

### 3.1 CPU 资源控制

#### A. CPU 权重控制 (相对权重)

**Cgroups v1 实现**：

```go
// CPU 权重设置 (cpu.shares)
func (s *CpuGroup) Set(path string, r *cgroups.Resources) error {
    if r.CpuShares != 0 {
        // 范围: 2-262144，默认: 1024
        if err := cgroups.WriteFile(path, "cpu.shares", 
            strconv.FormatUint(r.CpuShares, 10)); err != nil {
            return fmt.Errorf("failed to set cpu.shares: %w", err)
        }
    }
    return nil
}
```

**Cgroups v2 实现**：

```go
// CPU 权重设置 (cpu.weight)  
func setCPU(dirPath string, r *cgroups.Resources) error {
    if r.CpuWeight != 0 {
        // 范围: 1-10000，默认: 100
        if err := cgroups.WriteFile(dirPath, "cpu.weight", 
            strconv.FormatUint(r.CpuWeight, 10)); err != nil {
            return fmt.Errorf("failed to set cpu.weight: %w", err)
        }
    }
    return nil
}

// v1 shares 到 v2 weight 的转换
func convertSharesToWeight(shares uint64) uint64 {
    if shares == 0 {
        return 0
    }
    // weight = ((shares - 2) * 9999) / 262142 + 1
    return ((shares - 2) * 9999) / 262142 + 1
}
```

**权重计算示例**：

```
场景: 3个容器竞争 CPU
容器A: cpu.shares = 1024 (默认)
容器B: cpu.shares = 512  (一半权重)  
容器C: cpu.shares = 2048 (两倍权重)

总权重 = 1024 + 512 + 2048 = 3584

CPU 分配比例:
容器A: 1024/3584 = 28.6%
容器B: 512/3584  = 14.3%  
容器C: 2048/3584 = 57.1%
```

#### B. CPU 配额控制 (硬限制)

```go
// CFS 调度器配额设置
func setCPUQuota(path string, quota int64, period uint64) error {
    // 设置调度周期 (默认 100ms = 100,000μs)
    if period != 0 {
        if err := cgroups.WriteFile(path, "cpu.cfs_period_us", 
            strconv.FormatUint(period, 10)); err != nil {
            return err
        }
    }
    
    // 设置配额 (每个周期内可使用的 CPU 时间)
    if quota != 0 {
        if err := cgroups.WriteFile(path, "cpu.cfs_quota_us", 
            strconv.FormatInt(quota, 10)); err != nil {
            return err
        }
    }
    
    return nil
}
```

**配额计算示例**：

```bash
# 限制容器使用 1.5 个 CPU 核心
echo 100000 > cpu.cfs_period_us    # 周期 100ms
echo 150000 > cpu.cfs_quota_us     # 配额 150ms

# 限制使用 50% 的单核 CPU
echo 100000 > cpu.cfs_period_us    # 周期 100ms  
echo 50000  > cpu.cfs_quota_us     # 配额 50ms

# 配额计算公式:
# CPU核心数 = quota / period
# 1.5 核 = 150000 / 100000 = 1.5
# 0.5 核 = 50000 / 100000 = 0.5
```

#### C. CPU 突发控制 (Burst)

```go
// CPU 突发限制 (较新的内核特性)
func setCPUBurst(path string, burst *uint64) error {
    if burst != nil {
        // 允许短期内超过配额使用的 CPU 时间
        if err := cgroups.WriteFile(path, "cpu.cfs_burst_us", 
            strconv.FormatUint(*burst, 10)); err != nil {
            // 忽略不支持的内核
            if !os.IsNotExist(err) {
                return err
            }
        }
    }
    return nil
}
```

### 3.2 内存资源控制

#### A. 内存限制设置

```go
// 内存限制的复杂设置逻辑
func setMemoryAndSwap(path string, r *cgroups.Resources) error {
    // 关键: 交换空间限制必须 >= 内存限制
    if r.Memory != 0 && r.MemorySwap != 0 {
        curLimit, err := fscommon.GetCgroupParamUint(path, cgroupMemoryLimit)
        if err != nil {
            return err
        }
        
        // 根据当前值决定设置顺序
        if r.MemorySwap == -1 || curLimit < uint64(r.MemorySwap) {
            // 情况1: 先设置交换，再设置内存
            if err := setSwap(path, r.MemorySwap); err != nil {
                return err
            }
            return setMemory(path, r.Memory)
        }
    }
    
    // 情况2: 正常顺序 - 先内存，后交换
    if err := setMemory(path, r.Memory); err != nil {
        return err
    }
    return setSwap(path, r.MemorySwap)
}

func setMemory(path string, limit int64) error {
    if limit == 0 {
        return nil
    }
    
    err := cgroups.WriteFile(path, cgroupMemoryLimit, 
        strconv.FormatInt(limit, 10))
    
    // EBUSY 表示新限制低于当前使用量
    if errors.Is(err, unix.EBUSY) {
        usage, _ := fscommon.GetCgroupParamUint(path, cgroupMemoryUsage)
        max, _ := fscommon.GetCgroupParamUint(path, cgroupMemoryMaxUsage)
        return fmt.Errorf("cannot set memory limit to %d: current usage %d, peak usage %d", 
            limit, usage, max)
    }
    
    return err
}
```

#### B. Cgroups v2 内存管理

```go
// v2 的内存管理更加统一和简化
func setMemory(dirPath string, r *cgroups.Resources) error {
    // 检查当前内存使用，避免设置过低的限制
    if err := CheckMemoryUsage(dirPath, r); err != nil {
        return err
    }
    
    // v2 中交换空间限制不包含内存
    swap, err := cgroups.ConvertMemorySwapToCgroupV2Value(r.MemorySwap, r.Memory)
    if err != nil {
        return err
    }
    
    // 设置交换限制
    if swapStr := numToStr(swap); swapStr != "" {
        if err := cgroups.WriteFile(dirPath, "memory.swap.max", swapStr); err != nil {
            // 如果 swap 未启用，静默忽略错误
            if !(errors.Is(err, os.ErrNotExist) && (swapStr == "max" || swapStr == "0")) {
                return err
            }
        }
    }
    
    // 设置内存限制
    if val := numToStr(r.Memory); val != "" {
        if err := cgroups.WriteFile(dirPath, "memory.max", val); err != nil {
            return err
        }
    }
    
    return nil
}

// 内存交换值转换 (v1 -> v2)
func ConvertMemorySwapToCgroupV2Value(memorySwap, memory int64) (int64, error) {
    // v1: memory.memsw.limit_in_bytes 包含内存+交换总量
    // v2: memory.swap.max 只包含交换空间
    if memorySwap == -1 {
        return -1, nil  // 无限制
    }
    if memorySwap > 0 && memory > 0 {
        return memorySwap - memory, nil  // 减去内存部分
    }
    return memorySwap, nil
}
```

#### C. 内存回收策略

```go
// 内存交换倾向性设置
func setSwappiness(path string, swappiness *uint64) error {
    if swappiness != nil {
        // 范围 0-100，值越小越不愿意使用交换空间
        // 0: 禁用交换 (除非内存不足)
        // 100: 积极使用交换空间
        if err := cgroups.WriteFile(path, "memory.swappiness", 
            strconv.FormatUint(*swappiness, 10)); err != nil {
            return err
        }
    }
    return nil
}
```

### 3.3 IO 资源控制

#### A. IO 权重控制

**Cgroups v1 实现**：

```go
func (s *BlkioGroup) Set(path string, r *cgroups.Resources) error {
    // 检测并选择调度器 (CFQ 或 BFQ)
    s.detectWeightFilenames(path)
    
    // 设置全局 IO 权重
    if r.BlkioWeight != 0 {
        // 范围: 10-1000，默认: 500
        if err := cgroups.WriteFile(path, s.weightFilename, 
            strconv.FormatUint(uint64(r.BlkioWeight), 10)); err != nil {
            return err
        }
    }
    
    // 设置设备级 IO 权重
    for _, wd := range r.BlkioWeightDevice {
        if wd.Weight != 0 {
            // 格式: "major:minor weight"
            weightStr := fmt.Sprintf("%d:%d %d", wd.Major, wd.Minor, wd.Weight)
            if err := cgroups.WriteFile(path, s.weightDeviceFilename, 
                weightStr); err != nil {
                return err
            }
        }
    }
    
    return s.setThrottle(path, r)
}
```

**Cgroups v2 实现**：

```go
func setIo(dirPath string, r *cgroups.Resources) error {
    // 优先尝试使用 BFQ 调度器 (更好的性能)
    var bfq *os.File
    if r.BlkioWeight != 0 || len(r.BlkioWeightDevice) > 0 {
        if bfq, err := cgroups.OpenFile(dirPath, "io.bfq.weight", os.O_RDWR); err == nil {
            defer bfq.Close()
        }
    }
    
    // 设置 IO 权重
    if r.BlkioWeight != 0 {
        if bfq != nil {
            // 使用 BFQ 调度器
            if _, err := bfq.WriteString(strconv.FormatUint(uint64(r.BlkioWeight), 10)); err != nil {
                return err
            }
        } else {
            // 转换为 io.weight 值 (不同的范围)
            v := cgroups.ConvertBlkIOToIOWeightValue(r.BlkioWeight)
            if err := cgroups.WriteFile(dirPath, "io.weight", 
                strconv.FormatUint(v, 10)); err != nil {
                return err
            }
        }
    }
    
    return nil
}

// BlkIO 权重到 IO 权重的转换
func ConvertBlkIOToIOWeightValue(blkioWeight uint16) uint64 {
    if blkioWeight == 0 {
        return 0
    }
    // weight = (blkioWeight - 10) * 9999 / 990 + 1
    return uint64((uint64(blkioWeight)-10)*9999/990 + 1)
}
```

#### B. IO 限流 (Throttling)

```go
// IO 带宽限制
func setIOThrottle(path string, r *cgroups.Resources) error {
    // 读取带宽限制
    for _, td := range r.BlkioThrottleReadBpsDevice {
        throttleStr := fmt.Sprintf("%d:%d %d", td.Major, td.Minor, td.Rate)
        if err := cgroups.WriteFile(path, "blkio.throttle.read_bps_device", 
            throttleStr); err != nil {
            return err
        }
    }
    
    // 写入带宽限制
    for _, td := range r.BlkioThrottleWriteBpsDevice {
        throttleStr := fmt.Sprintf("%d:%d %d", td.Major, td.Minor, td.Rate)  
        if err := cgroups.WriteFile(path, "blkio.throttle.write_bps_device", 
            throttleStr); err != nil {
            return err
        }
    }
    
    // IOPS 限制
    for _, td := range r.BlkioThrottleReadIOPSDevice {
        throttleStr := fmt.Sprintf("%d:%d %d", td.Major, td.Minor, td.Rate)
        if err := cgroups.WriteFile(path, "blkio.throttle.read_iops_device", 
            throttleStr); err != nil {
            return err
        }
    }
    
    return nil
}
```

### 3.4 设备访问控制

#### A. Cgroups v1 设备控制 (白名单机制)

```go
// 设备访问控制的状态机实现
func setV1(path string, r *cgroups.Resources) error {
    // 1. 加载当前设备访问状态
    current, err := loadEmulator(path)
    if err != nil {
        return err
    }
    
    // 2. 构建目标状态
    target, err := buildEmulator(r.Devices)
    if err != nil {
        return err
    }
    
    // 3. 计算状态转换规则
    transitionRules, err := current.Transition(target)
    if err != nil {
        return err
    }
    
    // 4. 应用转换规则
    for _, rule := range transitionRules {
        file := "devices.deny"
        if rule.Allow {
            file = "devices.allow"
        }
        
        ruleStr := rule.CgroupString()  // 格式: "c 1:3 rwm"
        if err := cgroups.WriteFile(path, file, ruleStr); err != nil {
            return fmt.Errorf("failed to write %s to %s: %w", ruleStr, file, err)
        }
    }
    
    // 5. 验证最终状态
    currentAfter, err := loadEmulator(path)
    if err != nil {
        return err
    }
    
    if !target.IsBlacklist() && !reflect.DeepEqual(currentAfter, target) {
        return errors.New("resulting devices cgroup doesn't precisely match target")
    }
    
    return nil
}
```

**设备规则格式**：

```bash
# 设备规则格式: [a|b|c] [major:minor|*] [r][w][m]
# a: all devices, b: block devices, c: character devices  
# major:minor: 设备号，* 表示所有
# r: read, w: write, m: mknod

# 允许访问所有设备 (危险!)
echo "a *:* rwm" > devices.allow

# 允许读写 /dev/null (1:3)
echo "c 1:3 rw" > devices.allow  

# 禁止访问所有块设备
echo "b *:* rwm" > devices.deny

# 允许创建字符设备节点 
echo "c 5:0 m" > devices.allow  # /dev/tty
```

#### B. Cgroups v2 设备控制 (eBPF 程序)

```go
// v2 使用 eBPF 程序进行设备访问控制
func setV2(dirPath string, r *cgroups.Resources) error {
    // 1. 生成 eBPF 指令和许可证
    insts, license, err := deviceFilter(r.Devices)
    if err != nil {
        return err
    }
    
    // 2. 打开 cgroup 目录文件描述符
    dirFD, err := unix.Open(dirPath, unix.O_DIRECTORY|unix.O_RDONLY, 0o600)
    if err != nil {
        return fmt.Errorf("cannot get dir FD for %s", dirPath)
    }
    defer unix.Close(dirFD)
    
    // 3. 加载和附加 eBPF 程序到 cgroup
    if _, err := loadAttachCgroupDeviceFilter(insts, license, dirFD); err != nil {
        if !canSkipEBPFError(r) {
            return err
        }
        // rootless 模式或纯允许规则可以忽略 eBPF 错误
        logrus.WithError(err).Warn("Failed to load eBPF device filter")
    }
    
    return nil
}

// 检查是否可以忽略 eBPF 错误
func canSkipEBPFError(r *cgroups.Resources) bool {
    // rootless 模式允许忽略 eBPF 错误
    if userns.RunningInUserNS() {
        return true
    }
    
    // 如果所有规则都是允许规则且包含 rwm 权限
    for _, dev := range r.Devices {
        if !dev.Allow || !isRWM(dev.Permissions) {
            return false
        }
    }
    return true
}
```

### 3.5 进程数限制 (PIDs)

```go
// 限制 cgroup 中的进程数量
func setPids(path string, r *cgroups.Resources) error {
    if r.PidsLimit != 0 {
        var limit string
        if r.PidsLimit > 0 {
            limit = strconv.FormatInt(r.PidsLimit, 10)
        } else {
            limit = "max"  // 无限制
        }
        
        if err := cgroups.WriteFile(path, "pids.max", limit); err != nil {
            return err
        }
    }
    return nil
}
```

## 4. 资源统计和监控

### 4.1 统计数据结构

```go
// 综合的资源使用统计
type Stats struct {
    CpuStats     CpuStats                `json:"cpu_stats"`
    CPUSetStats  CPUSetStats             `json:"cpuset_stats"`
    MemoryStats  MemoryStats             `json:"memory_stats"`
    PidsStats    PidsStats               `json:"pids_stats"`
    BlkioStats   BlkioStats              `json:"blkio_stats"`
    HugetlbStats map[string]HugetlbStats `json:"hugetlb_stats"`
    RdmaStats    RdmaStats               `json:"rdma_stats"`
    MiscStats    map[string]MiscStats    `json:"misc_stats"`
}

// CPU 使用统计
type CpuStats struct {
    CpuUsage       CpuUsage       `json:"cpu_usage"`
    ThrottlingData ThrottlingData `json:"throttling_data"`
    PSI            *PSIStats      `json:"psi,omitempty"`  // 压力失速信息
    BurstData      BurstData      `json:"cpu_burst"`      // 突发使用数据
}

// 内存使用统计
type MemoryStats struct {
    Cache              uint64                `json:"cache"`
    Usage              MemoryData            `json:"usage"`
    SwapUsage          MemoryData            `json:"swap_usage"`
    SwapOnlyUsage      MemoryData            `json:"swap_only_usage"`
    KernelUsage        MemoryData            `json:"kernel_usage"`
    KernelTCPUsage     MemoryData            `json:"kernel_tcp_usage"`
    PageUsageByNUMA    PageUsageByNUMA       `json:"page_usage_by_numa"`
    UseHierarchy       bool                  `json:"use_hierarchy"`
    Stats              map[string]uint64     `json:"stats"`  // 详细统计
    PSI                *PSIStats             `json:"psi,omitempty"`
}

// 压力失速信息 (PSI - Pressure Stall Information)
type PSIStats struct {
    Some PSIData `json:"some"` // 某些任务受阻
    Full PSIData `json:"full"` // 所有任务受阻  
}

type PSIData struct {
    Avg10  float64 `json:"avg10"`  // 10秒平均
    Avg60  float64 `json:"avg60"`  // 60秒平均
    Avg300 float64 `json:"avg300"` // 300秒平均
    Total  uint64  `json:"total"`  // 总计微秒
}
```

### 4.2 统计数据收集实现

#### Cgroups v1 统计收集

```go
// v1 需要从多个子系统收集统计
func (m *Manager) GetStats() (*cgroups.Stats, error) {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    stats := cgroups.NewStats()
    
    // 遍历所有子系统收集统计
    for _, sys := range subsystems {
        path := m.paths[sys.Name()]
        if path == "" {
            continue
        }
        
        if err := sys.GetStats(path, stats); err != nil {
            if os.IsNotExist(errors.Cause(err)) {
                continue  // 子系统不存在，跳过
            }
            return nil, err
        }
    }
    
    return stats, nil
}

// CPU 统计收集示例
func (s *CpuGroup) GetStats(path string, stats *cgroups.Stats) error {
    // CPU 使用时间统计
    if cpuacctUsage, err := fscommon.GetCgroupParamUint(path, "cpuacct.usage"); err == nil {
        stats.CpuStats.CpuUsage.TotalUsage = cpuacctUsage
    }
    
    // 分核心 CPU 使用统计
    if percpuUsage, err := fscommon.ParseCgroupFile(path, "cpuacct.usage_percpu"); err == nil {
        for i, usage := range percpuUsage {
            if len(stats.CpuStats.CpuUsage.PercpuUsage) <= i {
                stats.CpuStats.CpuUsage.PercpuUsage = append(stats.CpuStats.CpuUsage.PercpuUsage, usage)
            } else {
                stats.CpuStats.CpuUsage.PercpuUsage[i] = usage
            }
        }
    }
    
    // 限流统计
    if throttledData, err := fscommon.ParseCgroupFile(path, "cpu.stat"); err == nil {
        stats.CpuStats.ThrottlingData.Periods = throttledData["nr_periods"]
        stats.CpuStats.ThrottlingData.ThrottledPeriods = throttledData["nr_throttled"]  
        stats.CpuStats.ThrottlingData.ThrottledTime = throttledData["throttled_time"]
    }
    
    return nil
}
```

#### Cgroups v2 统计收集

```go
// v2 从统一路径收集所有统计
func (m *Manager) GetStats() (*cgroups.Stats, error) {
    var errs []error
    st := cgroups.NewStats()
    
    // 收集各种资源统计
    if err := statPids(m.dirPath, st); err != nil {
        errs = append(errs, err)
    }
    
    if err := statMemory(m.dirPath, st); err != nil && !os.IsNotExist(err) {
        errs = append(errs, err)
    }
    
    if err := statIo(m.dirPath, st); err != nil && !os.IsNotExist(err) {
        errs = append(errs, err)
    }
    
    if err := statCpu(m.dirPath, st); err != nil && !os.IsNotExist(err) {
        errs = append(errs, err)
    }
    
    // 收集 PSI (压力失速信息)
    if st.CpuStats.PSI, err = statPSI(m.dirPath, "cpu.pressure"); err == nil {
        errs = append(errs, err)
    }
    if st.MemoryStats.PSI, err = statPSI(m.dirPath, "memory.pressure"); err == nil {
        errs = append(errs, err)
    }
    
    return st, nil
}

// PSI 统计收集
func statPSI(dirPath, file string) (*cgroups.PSIStats, error) {
    data, err := cgroups.ReadFile(dirPath, file)
    if err != nil {
        return nil, err
    }
    
    psi := &cgroups.PSIStats{}
    
    // 解析格式: "some avg10=0.00 avg60=0.00 avg300=0.00 total=0"
    lines := strings.Split(string(data), "\n")
    for _, line := range lines {
        if strings.HasPrefix(line, "some ") {
            psi.Some = parsePSIData(line)
        } else if strings.HasPrefix(line, "full ") {
            psi.Full = parsePSIData(line)
        }
    }
    
    return psi, nil
}
```

### 4.3 性能监控指标解读

#### A. CPU 监控指标

```go
// CPU 使用率计算
func calculateCPUPercent(prev, curr *CpuStats) float64 {
    var (
        cpuDelta    = curr.CpuUsage.TotalUsage - prev.CpuUsage.TotalUsage
        systemDelta = curr.SystemUsage - prev.SystemUsage
    )
    
    if systemDelta > 0 && cpuDelta > 0 {
        return (float64(cpuDelta) / float64(systemDelta)) * float64(len(curr.CpuUsage.PercpuUsage)) * 100.0
    }
    return 0.0
}

// 限流分析
func analyzeCPUThrottling(stats *CpuStats) {
    if stats.ThrottlingData.Periods > 0 {
        throttlePercent := float64(stats.ThrottlingData.ThrottledPeriods) / float64(stats.ThrottlingData.Periods) * 100
        fmt.Printf("CPU Throttling: %.2f%% of periods throttled\n", throttlePercent)
        fmt.Printf("Total throttled time: %d ns\n", stats.ThrottlingData.ThrottledTime)
    }
}
```

#### B. 内存监控指标

```go
// 内存使用分析
func analyzeMemoryUsage(stats *MemoryStats) {
    fmt.Printf("Memory Usage: %d / %d bytes (%.2f%%)\n", 
        stats.Usage.Usage, stats.Usage.Limit,
        float64(stats.Usage.Usage)/float64(stats.Usage.Limit)*100)
    
    fmt.Printf("Memory Cache: %d bytes\n", stats.Cache)
    fmt.Printf("Memory RSS: %d bytes\n", stats.Stats["rss"])
    fmt.Printf("Memory Swap: %d / %d bytes\n", stats.SwapUsage.Usage, stats.SwapUsage.Limit)
    
    // 内存压力分析
    if stats.PSI != nil {
        fmt.Printf("Memory Pressure: some=%.2f%%, full=%.2f%%\n",
            stats.PSI.Some.Avg60, stats.PSI.Full.Avg60)
    }
}
```

## 5. 高级特性和优化

### 5.1 层次结构管理

```go
// cgroup 层次结构的创建和管理
type Manager struct {
    mu      sync.Mutex
    cgroups *cgroups.Cgroup
    paths   map[string]string  // v1: 多路径映射
    dirPath string            // v2: 单一路径
}

// 创建 cgroup 层次结构
func (m *Manager) Apply(pid int) error {
    // 1. 创建 cgroup 目录结构
    if err := m.createCgroupPath(); err != nil {
        return err
    }
    
    // 2. 设置资源限制
    if err := m.Set(m.cgroups.Resources); err != nil {
        return err
    }
    
    // 3. 将进程加入 cgroup
    if err := m.addProcess(pid); err != nil {
        return err  
    }
    
    return nil
}

func (m *Manager) createCgroupPath() error {
    // v1 需要为每个子系统创建路径
    if !cgroups.IsCgroup2UnifiedMode() {
        for subsys, path := range m.paths {
            if err := os.MkdirAll(path, 0755); err != nil {
                return fmt.Errorf("failed to create cgroup path %s: %w", path, err)
            }
        }
        return nil
    }
    
    // v2 只需创建单一路径
    return os.MkdirAll(m.dirPath, 0755)
}
```

### 5.2 动态资源调整

```go
// 运行时动态调整资源限制
func (m *Manager) UpdateResources(r *cgroups.Resources) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    // 验证新的资源配置
    if err := validateResources(r); err != nil {
        return err
    }
    
    // 应用新的资源限制
    if err := m.Set(r); err != nil {
        return err
    }
    
    // 更新内部配置
    m.cgroups.Resources = r
    
    return nil
}

func validateResources(r *cgroups.Resources) error {
    // 内存限制不能低于当前使用量
    if r.Memory > 0 {
        // 检查当前内存使用
        // ...
    }
    
    // CPU 配额合理性检查  
    if r.CpuQuota > 0 && r.CpuPeriod > 0 {
        cpuRatio := float64(r.CpuQuota) / float64(r.CpuPeriod)
        if cpuRatio > float64(runtime.NumCPU()) {
            return fmt.Errorf("CPU quota %.2f exceeds available CPUs %d", 
                cpuRatio, runtime.NumCPU())
        }
    }
    
    return nil
}
```

### 5.3 Rootless 容器支持

```go
// Rootless 模式的特殊处理
func NewRootlessManager(config *cgroups.Cgroup) (cgroups.Manager, error) {
    // 检查 cgroups 委托
    if !isValidDelegate() {
        return nil, errors.New("insufficient cgroups delegation for rootless")
    }
    
    // Rootless 模式下的路径调整
    userSlice, err := getUserSlice()
    if err != nil {
        return nil, err
    }
    
    config.Path = filepath.Join(userSlice, config.Path)
    
    if cgroups.IsCgroup2UnifiedMode() {
        return fs2.NewManager(config, config.Path)
    } else {
        // v1 rootless 支持有限
        return nil, errors.New("cgroups v1 rootless support is limited")
    }
}

func isValidDelegate() bool {
    // 检查用户是否有足够的 cgroups 委托权限
    delegateFile := "/sys/fs/cgroup/cgroup.subtree_control"
    if data, err := os.ReadFile(delegateFile); err == nil {
        return strings.Contains(string(data), "memory") && 
               strings.Contains(string(data), "cpu")
    }
    return false
}
```

### 5.4 性能优化策略

#### A. 批量操作

```go
// 批量设置多个资源参数，减少系统调用
func (m *Manager) SetBatch(r *cgroups.Resources) error {
    operations := []func() error{
        func() error { return setCpu(m.path, r) },
        func() error { return setMemory(m.path, r) },
        func() error { return setIO(m.path, r) },
        func() error { return setPids(m.path, r) },
    }
    
    // 并发执行，但要处理依赖关系
    for _, op := range operations {
        if err := op(); err != nil {
            return err
        }
    }
    
    return nil
}
```

#### B. 缓存机制

```go
// 统计数据缓存，避免频繁读取文件
type cachedStats struct {
    stats     *cgroups.Stats
    timestamp time.Time
    ttl       time.Duration
}

func (m *Manager) GetStatsCached() (*cgroups.Stats, error) {
    if m.cache != nil && time.Since(m.cache.timestamp) < m.cache.ttl {
        return m.cache.stats, nil
    }
    
    stats, err := m.GetStats()
    if err != nil {
        return nil, err
    }
    
    m.cache = &cachedStats{
        stats:     stats,
        timestamp: time.Now(),
        ttl:       time.Second * 5,  // 5秒缓存
    }
    
    return stats, nil
}
```

## 6. 实践练习

### 6.1 基础资源限制实验

```bash
#!/bin/bash
# 实验 1: CPU 限制测试

# 创建测试 cgroup
sudo mkdir -p /sys/fs/cgroup/cpu/test-cpu
echo $$ | sudo tee /sys/fs/cgroup/cpu/test-cpu/cgroup.procs

# 限制为 0.5 个 CPU 核心
echo 100000 | sudo tee /sys/fs/cgroup/cpu/test-cpu/cpu.cfs_period_us
echo 50000 | sudo tee /sys/fs/cgroup/cpu/test-cpu/cpu.cfs_quota_us

# 运行 CPU 密集任务并观察限制效果
stress --cpu 4 --timeout 30s &

# 监控 CPU 使用
watch -n 1 "cat /sys/fs/cgroup/cpu/test-cpu/cpuacct.usage && top -p \$!"
```

```bash
#!/bin/bash  
# 实验 2: 内存限制测试

# 创建内存限制 cgroup
sudo mkdir -p /sys/fs/cgroup/memory/test-memory
echo $$ | sudo tee /sys/fs/cgroup/memory/test-memory/cgroup.procs

# 限制内存为 100MB
echo 104857600 | sudo tee /sys/fs/cgroup/memory/test-memory/memory.limit_in_bytes

# 尝试分配 200MB 内存 (应该被 OOM killer 终止)
stress --vm 1 --vm-bytes 200M --timeout 10s

# 检查 OOM 统计
cat /sys/fs/cgroup/memory/test-memory/memory.oom_control
```

### 6.2 监控脚本开发

```bash
#!/bin/bash
# cgroup 资源监控脚本

CGROUP_PATH="/sys/fs/cgroup"
CONTAINER_PATH="$CGROUP_PATH/system.slice/docker-*.scope"

monitor_container() {
    local container_path="$1"
    local container_name=$(basename "$container_path" | cut -d'-' -f2 | cut -d'.' -f1)
    
    echo "=== Container: $container_name ==="
    
    # CPU 统计
    if [[ -f "$container_path/cpu.stat" ]]; then
        echo "CPU Stats:"
        grep -E "(usage_usec|throttled)" "$container_path/cpu.stat" | sed 's/^/  /'
    fi
    
    # 内存统计  
    if [[ -f "$container_path/memory.current" ]]; then
        echo "Memory Usage: $(cat $container_path/memory.current) bytes"
        echo "Memory Limit: $(cat $container_path/memory.max)"
    fi
    
    # IO 统计
    if [[ -f "$container_path/io.stat" ]]; then
        echo "IO Stats:"
        head -3 "$container_path/io.stat" | sed 's/^/  /'
    fi
    
    echo
}

# 监控所有容器
while true; do
    for container_path in $CONTAINER_PATH; do
        [[ -d "$container_path" ]] && monitor_container "$container_path"
    done
    sleep 5
done
```

### 6.3 自定义资源控制

```go
// 自定义资源管理器示例
package main

import (
    "fmt"
    "github.com/opencontainers/cgroups"
    "github.com/opencontainers/cgroups/fs2"
)

func main() {
    // 创建自定义 cgroup 配置
    cgroupConfig := &cgroups.Cgroup{
        Path: "custom-test",
        Resources: &cgroups.Resources{
            Memory: 128 * 1024 * 1024,  // 128MB
            CpuWeight: 100,             // CPU 权重
            CpuQuota: 50000,           // 0.5 CPU 核心
            CpuPeriod: 100000,         // 100ms 周期
        },
    }
    
    // 创建管理器 (自动检测 v1/v2)
    manager, err := fs2.NewManager(cgroupConfig, cgroupConfig.Path)
    if err != nil {
        panic(err)
    }
    
    // 应用配置到当前进程
    if err := manager.Apply(os.Getpid()); err != nil {
        panic(err)
    }
    
    fmt.Println("Cgroup applied successfully!")
    
    // 运行一些工作负载
    doWork()
    
    // 获取统计信息
    stats, err := manager.GetStats()
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("CPU Usage: %d ns\n", stats.CpuStats.CpuUsage.TotalUsage)
    fmt.Printf("Memory Usage: %d bytes\n", stats.MemoryStats.Usage.Usage)
    
    // 清理
    if err := manager.Destroy(); err != nil {
        fmt.Printf("Failed to cleanup: %v\n", err)
    }
}

func doWork() {
    // 模拟一些 CPU 和内存使用
    data := make([]byte, 50*1024*1024) // 50MB
    for i := 0; i < len(data); i++ {
        data[i] = byte(i % 256)
    }
    
    // CPU 密集计算
    sum := 0
    for i := 0; i < 10000000; i++ {
        sum += i
    }
    
    fmt.Printf("Work completed, sum: %d\n", sum)
}
```

## 7. 故障排除和调试

### 7.1 常见问题诊断

#### 权限问题

```bash
# 检查 cgroup 挂载情况
mount | grep cgroup

# 检查 cgroup 版本
stat -fc %T /sys/fs/cgroup/
# cgroup2fs = v2, tmpfs = v1

# 检查用户权限
ls -la /sys/fs/cgroup/user.slice/user-$(id -u).slice/

# 检查 systemd 委托
systemctl --user show-environment
```

#### 资源限制不生效

```bash
# 检查是否正确设置
echo "设置的限制:"
cat /sys/fs/cgroup/memory/test/memory.limit_in_bytes

echo "当前使用:"  
cat /sys/fs/cgroup/memory/test/memory.usage_in_bytes

echo "进程列表:"
cat /sys/fs/cgroup/memory/test/cgroup.procs

# 检查内核支持
grep CONFIG_MEMCG /boot/config-$(uname -r)
```

### 7.2 性能分析工具

```bash
# 使用 systemd-cgtop 监控
systemd-cgtop

# 使用 htop 查看 cgroup 信息
htop -t  # 显示进程树

# 使用 perf 分析 cgroup 性能
perf record -g -e cpu-cycles --cgroup=/sys/fs/cgroup/test ./workload
perf report
```

## 8. 思考题

### 8.1 架构设计思考

1. **双版本架构**: 为什么 runc 需要同时支持 cgroups v1 和 v2？两个版本能否统一？

2. **资源冲突处理**: 当 CPU 配额和权重同时设置时，内核如何处理优先级？

3. **内存交换策略**: 为什么内存限制的设置顺序很重要？如何避免设置冲突？

### 8.2 性能优化思考

4. **统计收集开销**: 频繁读取 cgroup 统计文件对性能有什么影响？如何优化？

5. **批量操作**: 哪些 cgroup 操作可以批量执行？如何设计批量接口？

6. **缓存策略**: cgroup 路径和文件描述符应该如何缓存？什么时候失效？

### 8.3 实际应用思考

7. **动态调整**: 如何在不重启容器的情况下安全地调整资源限制？

8. **资源超售**: 在资源超售的情况下，如何设计合理的资源分配策略？

9. **多租户隔离**: 如何使用 cgroups 实现多租户之间的资源隔离？

## 9. 扩展阅读

### 9.1 内核文档

- [Control Group v2](https://www.kernel.org/doc/Documentation/admin-guide/cgroup-v2.rst)
- [Control Group v1](https://www.kernel.org/doc/Documentation/cgroup-v1/)
- [CPU Bandwidth Control](https://www.kernel.org/doc/Documentation/scheduler/sched-bwc.txt)
- [Memory Resource Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt)

### 9.2 实践指南

- [Cgroups, namespaces and beyond](https://www.slideshare.net/jpetazzo/cgroups-namespaces-and-beyond-what-are-containers-made-from-dockercon-europe-2015)
- [Understanding cgroups](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/managing_monitoring_and_updating_the_kernel/using-control-groups_managing-monitoring-and-updating-the-kernel)
- [Systemd and cgroups](https://systemd.io/CGROUP_DELEGATION/)

### 9.3 工具和监控

- [cAdvisor - Container monitoring](https://github.com/google/cadvisor)  
- [systemd-cgtop](https://www.freedesktop.org/software/systemd/man/systemd-cgtop.html)
- [cgroupspy - Python cgroups interface](https://github.com/cloudera/cgroupspy)

## 🎯 模块总结

通过本模块的学习，你应该已经掌握了：

✅ **Cgroups 基础架构**：理解 v1/v2 差异和层次结构管理  
✅ **资源控制机制**：掌握 CPU、内存、IO、设备控制的实现原理  
✅ **统计监控系统**：理解资源使用统计和性能指标分析  
✅ **高级特性应用**：掌握动态调整、Rootless 支持等高级功能  
✅ **故障排除能力**：具备 cgroups 问题诊断和性能调优技能  

**下一步**: 进入 [模块 5: 文件系统与挂载管理](./05-文件系统与挂载管理.md)，学习容器文件系统隔离和挂载机制。