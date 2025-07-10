# OCI Runtime 规范详解 - Linux 容器配置完全指南

> **系列导航：** [OCI 容器技术完全指南系列](./oci-series-index.md) → 第二篇：运行时规范  
> **规范版本：** OCI Runtime Spec v1.0.2  
> **参考仓库：** [opencontainers/runtime-spec](https://github.com/opencontainers/runtime-spec)  
> **最后更新：** 2024-07-10

## 概述

OCI Runtime Specification 定义了容器运行时的标准化接口和行为规范，是 OCI 三大规范中最核心的部分。本文将深入解析 Runtime 规范中的 Linux 相关配置，帮助您全面掌握容器运行时的配置和管理。

## 核心配置结构

OCI 运行时配置以 JSON 格式定义，主要包含以下结构：

```json
{
    "ociVersion": "1.0.2",
    "process": { 
        "terminal": false,
        "user": { "uid": 0, "gid": 0 },
        "args": ["/bin/bash"],
        "env": ["PATH=/usr/local/bin:/usr/bin:/bin"],
        "cwd": "/",
        "capabilities": { ... },
        "noNewPrivileges": true
    },
    "root": {
        "path": "rootfs",
        "readonly": false
    },
    "hostname": "container-hostname",
    "mounts": [ ... ],
    "linux": { ... },
    "hooks": { ... }
}
```

### 配置字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `ociVersion` | string | 是 | OCI 规范版本 |
| `process` | object | 否 | 进程配置 |
| `root` | object | 否 | 根文件系统配置 |
| `hostname` | string | 否 | 容器主机名 |
| `mounts` | array | 否 | 挂载点配置 |
| `linux` | object | 否 | Linux 专用配置 |
| `hooks` | object | 否 | 生命周期 Hook |

## Linux 专用配置

Linux 配置是运行时规范的核心，涵盖了 Linux 内核的各种隔离和安全特性：

```go
type Linux struct {
    UIDMappings       []LinuxIDMapping    // 用户 ID 映射
    GIDMappings       []LinuxIDMapping    // 组 ID 映射
    Namespaces        []LinuxNamespace    // 命名空间配置
    Resources         *LinuxResources     // 资源限制 (cgroups)
    Devices          []LinuxDevice       // 设备配置
    Seccomp          *LinuxSeccomp       // 系统调用过滤
    Capabilities     *LinuxCapabilities  // 能力控制
    MaskedPaths      []string            // 隐藏路径
    ReadonlyPaths    []string            // 只读路径
}
```

### 命名空间隔离

Linux 支持 8 种命名空间类型，提供不同层面的隔离：

| 命名空间类型 | 作用域 | 说明 |
|-------------|--------|------|
| `pid` | 进程隔离 | 进程 ID 空间隔离 |
| `network` | 网络栈隔离 | 网络接口、路由表隔离 |
| `mount` | 挂载点隔离 | 文件系统挂载表隔离 |
| `ipc` | IPC 隔离 | System V IPC、POSIX 消息队列隔离 |
| `uts` | 主机名隔离 | 主机名和域名隔离 |
| `user` | 用户隔离 | 用户和组 ID 重映射 |
| `cgroup` | Cgroup 隔离 | Cgroup 层次结构隔离 |
| `time` | 时钟隔离 | 系统时钟隔离 |

#### 用户命名空间映射示例

```json
{
    "uidMappings": [
        {
            "containerID": 0,
            "hostID": 1000,
            "size": 65536
        }
    ],
    "gidMappings": [
        {
            "containerID": 0,
            "hostID": 1000,
            "size": 65536
        }
    ]
}
```

### 资源管理 (Cgroups)

#### 内存资源控制

```go
type LinuxMemory struct {
    Limit           *int64  // 内存限制 (字节)
    Reservation     *int64  // 软限制
    Swap            *int64  // 内存+交换限制
    Swappiness      *uint64 // 交换倾向 (0-100)
    DisableOOMKiller *bool  // 禁用 OOM Killer
}
```

#### CPU 资源控制

```go
type LinuxCPU struct {
    Shares          *uint64 // CPU 权重 (相对权重)
    Quota           *int64  // CPU 配额 (微秒) - 在给定周期内允许的 CPU 时间
    Burst           *uint64 // CPU 突发限制 (微秒) - 给定周期内额外允许的累积 CPU 时间
    Period          *uint64 // CPU 周期 (微秒) - 用于硬限制
    RealtimeRuntime *int64  // 实时调度可使用的时间 (微秒)
    RealtimePeriod  *uint64 // 实时调度的 CPU 周期 (微秒)
    Cpus            string  // CPU 集合 (如 "0-3,7") - cpuset 内使用的 CPU
    Mems            string  // 内存节点 - cpuset 内的内存节点列表
    Idle            *int64  // 空闲配置: 0=默认行为, 1=SCHED_IDLE
}
```

#### 块设备 I/O 控制

```go
type LinuxBlockIO struct {
    Weight                   *uint16               // I/O 权重
    ThrottleReadBpsDevice   []LinuxThrottleDevice // 读取带宽限制
    ThrottleWriteBpsDevice  []LinuxThrottleDevice // 写入带宽限制
    ThrottleReadIOPSDevice  []LinuxThrottleDevice // 读取 IOPS 限制
    ThrottleWriteIOPSDevice []LinuxThrottleDevice // 写入 IOPS 限制
}
```

### 安全配置

#### Seccomp 系统调用过滤

```go
type LinuxSeccomp struct {
    DefaultAction LinuxSeccompAction // 默认动作
    Architectures []Arch             // 支持的架构
    Syscalls      []LinuxSyscall     // 系统调用规则
}
```

**Seccomp 动作类型：**
- `SCMP_ACT_ALLOW`: 允许系统调用
- `SCMP_ACT_ERRNO`: 返回错误码
- `SCMP_ACT_KILL`: 终止进程
- `SCMP_ACT_TRAP`: 发送 SIGSYS 信号
- `SCMP_ACT_NOTIFY`: 通知用户空间

#### Linux Capabilities 能力控制

```go
type LinuxCapabilities struct {
    Bounding    []string // 边界能力集
    Effective   []string // 有效能力集
    Inheritable []string // 可继承能力集
    Permitted   []string // 允许能力集
    Ambient     []string // 环境能力集
}
```

**常用能力类型：**
- `CAP_NET_ADMIN`: 网络管理权限
- `CAP_SYS_ADMIN`: 系统管理权限
- `CAP_SETUID`: 设置用户 ID 权限
- `CAP_SETGID`: 设置组 ID 权限

### 设备管理

#### 设备配置

```go
type LinuxDevice struct {
    Path     string        // 设备在容器中的路径
    Type     string        // 设备类型 (c, b, u, p)
    Major    int64         // 主设备号
    Minor    int64         // 次设备号
    FileMode *os.FileMode  // 文件权限
    UID      *uint32       // 所有者 UID
    GID      *uint32       // 所有者 GID
}
```

**必需的默认设备：**
- `/dev/null`, `/dev/zero`, `/dev/full`
- `/dev/random`, `/dev/urandom`
- `/dev/tty`, `/dev/console`, `/dev/ptmx`

#### 设备 Cgroup 控制

```go
type LinuxDeviceCgroup struct {
    Allow  bool    // 允许或拒绝
    Type   string  // 设备类型 (a, c, b)
    Major  *int64  // 主设备号
    Minor  *int64  // 次设备号
    Access string  // 访问权限 (rwm)
}
```

### 挂载配置

#### 挂载点配置

```json
{
    "destination": "/proc",
    "type": "proc",
    "source": "proc",
    "options": ["nosuid", "noexec", "nodev"]
}
```

**Linux 挂载选项：**
- **基础选项**: `bind`, `rbind`, `ro`, `rw`, `noexec`, `nosuid`, `nodev`
- **传播选项**: `shared`, `slave`, `private`, `unbindable`
- **ID 映射**: `idmap`, `ridmap` (用户命名空间支持)

#### 必需的默认文件系统

| 路径     | 类型    | 作用 |
|----------|---------|------|
| /proc    | proc    | 进程信息 |
| /sys     | sysfs   | 系统信息 |
| /dev/pts | devpts  | 伪终端 |
| /dev/shm | tmpfs   | 共享内存 |

### Hook 系统和生命周期管理

#### Hook 类型

1. **`createRuntime`** - 运行时命名空间，环境创建后
2. **`createContainer`** - 容器命名空间，环境创建后
3. **`startContainer`** - 容器命名空间，用户进程执行前
4. **`poststart`** - 运行时命名空间，用户进程启动后
5. **`poststop`** - 运行时命名空间，容器删除后

#### Hook 结构

```go
type Hook struct {
    Path    string   // 可执行文件路径
    Args    []string // 参数
    Env     []string // 环境变量
    Timeout *int     // 超时时间 (秒)
}
```

### 运行时接口

#### 容器状态

```json
{
    "ociVersion": "1.0.2",
    "id": "container-id",
    "status": "running",
    "pid": 12345,
    "bundle": "/path/to/bundle"
}
```

#### 运行时操作

- `create <container-id>` - 创建容器
- `start <container-id>` - 启动容器进程
- `kill <container-id> <signal>` - 发送信号给容器
- `delete <container-id>` - 删除容器
- `state <container-id>` - 查询容器状态

## 实际配置示例

### 基础容器配置

```json
{
    "ociVersion": "1.0.2",
    "process": {
        "terminal": false,
        "user": {
            "uid": 1000,
            "gid": 1000
        },
        "args": ["/bin/bash"],
        "env": [
            "PATH=/usr/local/bin:/usr/bin:/bin",
            "TERM=xterm"
        ],
        "cwd": "/",
        "capabilities": {
            "effective": ["CAP_CHOWN", "CAP_DAC_OVERRIDE"],
            "bounding": ["CAP_CHOWN", "CAP_DAC_OVERRIDE"],
            "inheritable": [],
            "permitted": ["CAP_CHOWN", "CAP_DAC_OVERRIDE"],
            "ambient": []
        },
        "noNewPrivileges": true
    },
    "root": {
        "path": "rootfs",
        "readonly": true
    },
    "hostname": "mycontainer",
    "mounts": [
        {
            "destination": "/proc",
            "type": "proc",
            "source": "proc",
            "options": ["nosuid", "noexec", "nodev"]
        },
        {
            "destination": "/sys",
            "type": "sysfs",
            "source": "sysfs",
            "options": ["nosuid", "noexec", "nodev", "ro"]
        }
    ],
    "linux": {
        "namespaces": [
            {"type": "pid"},
            {"type": "network"},
            {"type": "ipc"},
            {"type": "uts"},
            {"type": "mount"},
            {"type": "user"}
        ],
        "uidMappings": [
            {
                "containerID": 1000,
                "hostID": 100000,
                "size": 1
            }
        ],
        "gidMappings": [
            {
                "containerID": 1000,
                "hostID": 100000,
                "size": 1
            }
        ],
        "resources": {
            "memory": {
                "limit": 134217728,
                "swappiness": 0
            },
            "cpu": {
                "shares": 512,
                "quota": 50000,
                "period": 100000
            }
        }
    }
}
```

### 高安全容器配置

```json
{
    "ociVersion": "1.0.2",
    "process": {
        "terminal": false,
        "user": {
            "uid": 1000,
            "gid": 1000
        },
        "args": ["/usr/local/bin/app"],
        "env": ["PATH=/usr/local/bin:/usr/bin:/bin"],
        "cwd": "/app",
        "capabilities": {
            "effective": [],
            "bounding": [],
            "inheritable": [],
            "permitted": [],
            "ambient": []
        },
        "noNewPrivileges": true,
        "oomScoreAdj": 100
    },
    "linux": {
        "seccomp": {
            "defaultAction": "SCMP_ACT_ERRNO",
            "architectures": ["SCMP_ARCH_X86_64"],
            "syscalls": [
                {
                    "names": [
                        "brk", "exit_group", "futex", "read", "write",
                        "mmap", "munmap", "rt_sigaction", "rt_sigprocmask"
                    ],
                    "action": "SCMP_ACT_ALLOW"
                }
            ]
        },
        "maskedPaths": [
            "/proc/acpi", "/proc/kcore", "/proc/keys",
            "/proc/latency_stats", "/proc/timer_list",
            "/proc/timer_stats", "/proc/sched_debug",
            "/proc/scsi", "/sys/firmware"
        ],
        "readonlyPaths": [
            "/proc/asound", "/proc/bus", "/proc/fs",
            "/proc/irq", "/proc/sys", "/proc/sysrq-trigger"
        ]
    }
}
```

## 最佳实践

### 安全配置建议

1. **最小权限原则**
   - 移除不必要的 capabilities
   - 设置 `noNewPrivileges: true`
   - 使用非 root 用户运行

2. **资源限制**
   - 设置合理的内存和 CPU 限制
   - 配置 I/O 带宽限制
   - 限制进程数量

3. **文件系统保护**
   - 使用只读根文件系统
   - 隐藏敏感的 /proc 和 /sys 路径
   - 配置适当的挂载选项

### 性能优化

1. **CPU 配置**
   - 根据应用特性设置 CPU shares
   - 使用 CPU 集合绑定
   - 配置适当的调度策略

2. **内存管理**
   - 设置内存预留避免竞争
   - 禁用 swap 保证性能一致性
   - 监控内存使用模式

## 下一步学习

完成 Runtime 规范学习后，建议继续学习：

1. **[OCI Image 规范详解](./oci-03-image-spec.md)** - 了解镜像格式和构建
2. **[OCI 容器安全配置实战](./oci-05-security-guide.md)** - 深入安全配置实践
3. **[OCI 容器监控调试与故障排除](./oci-06-monitoring-guide.md)** - 掌握运维技能

## 总结

OCI Runtime 规范为 Linux 容器提供了全面的配置框架，通过深入理解命名空间、Cgroups、安全配置等核心概念，您可以构建更安全、高效的容器化应用。

**关键要点：**
- Runtime 规范定义了容器的运行时行为
- Linux 专用配置涵盖了内核的各种特性
- 安全配置是容器部署的重要考虑因素
- 合理的资源限制能确保系统稳定性

---

**上一篇：** [OCI 容器技术入门指南](./oci-01-intro-guide.md)  
**下一篇：** [OCI Image 规范详解 - 容器镜像格式与构建](./oci-03-image-spec.md)  
**返回：** [OCI 容器技术完全指南系列](./oci-series-index.md)