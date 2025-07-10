# runc 容器生命周期流程图

## 1. runc 容器创建总体流程

```mermaid
graph TD
    A[runc create/run] --> B[解析OCI配置]
    B --> C[创建Factory]
    C --> D[生成libcontainer配置]
    D --> E[创建Container实例]
    E --> F[启动父进程]
    F --> G[nsexec.c引导]
    G --> H[创建命名空间]
    H --> I[设置安全策略]
    I --> J[挂载文件系统]
    J --> K[应用资源限制]
    K --> L[执行init进程]
    L --> M[启动容器进程]
    M --> N[容器运行中]
```

## 2. runc 命令流程对比

```mermaid
graph LR
    subgraph "runc create"
        A1[create命令] --> B1[startContainer]
        B1 --> C1[CT_ACT_CREATE]
        C1 --> D1[容器已创建但未启动]
    end
    
    subgraph "runc start"
        A2[start命令] --> B2[加载现有容器]
        B2 --> C2[container.Start]
        C2 --> D2[启动容器进程]
    end
    
    subgraph "runc run"
        A3[run命令] --> B3[startContainer]
        B3 --> C3[CT_ACT_RUN]
        C3 --> D3[创建并立即启动]
    end
```

## 3. nsexec.c 三阶段引导过程

```mermaid
graph TD
    A[Stage 0: STAGE_PARENT] --> B[Stage 1: STAGE_CHILD]
    B --> C[Stage 2: STAGE_INIT]
    
    subgraph "Stage 0 详细"
        A1[解析netlink配置]
        A2[创建子进程clone_parent]
        A3[处理用户命名空间映射]
        A4[管理进程同步]
    end
    
    subgraph "Stage 1 详细"
        B1[加入指定命名空间setns]
        B2[unshare新命名空间]
        B3[创建PID命名空间子进程]
        B4[协调用户命名空间映射]
    end
    
    subgraph "Stage 2 详细"
        C1[设置会话ID setsid]
        C2[切换到容器用户/组]
        C3[返回Go运行时最终设置]
    end
```

## 4. 命名空间创建顺序和依赖关系

```
命名空间创建顺序（关键在于User NS必须最先创建）:

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User NS     │───▶│ IPC NS      │───▶│ UTS NS      │
│ (NEWUSER)   │    │ (NEWIPC)    │    │ (NEWUTS)    │
│ 用户隔离    │    │ IPC隔离     │    │ 主机名隔离  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Network NS  │    │ PID NS      │    │ Mount NS    │
│ (NEWNET)    │    │ (NEWPID)    │    │ (NEWNS)     │
│ 网络隔离    │    │ 进程隔离    │    │ 文件系统隔离│
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐
│ Cgroup NS   │    │ Time NS     │
│ (NEWCGROUP) │    │ (NEWTIME)   │
│ Cgroup隔离  │    │ 时间隔离    │
└─────────────┘    └─────────────┘
```

## 5. 进程通信和同步机制

```
父进程 (runc)          子进程 (init)         容器进程
      │                     │                    │
      │  initSockParent ◄──►│ initSockChild      │
      │  ─────────────────── │                   │
      │                     │                   │
      │  syncSockParent ◄──►│ syncSockChild      │
      │  ─────────────────── │                   │
      │                     │                   │
      │  logPipeParent  ◄───│ logPipeChild       │
      │  ─────────────────── │                   │
      │                     │                   │
      │     FIFO通道     ◄──│────────────────────│
      │  ─────────────────── │                   │
      
同步消息类型:
- SYNC_USERMAP_PLS/ACK  (用户映射请求/确认)
- SYNC_RECVPID_PLS/ACK  (PID发送请求/确认)
- SYNC_GRANDCHILD       (孙进程就绪)
- SYNC_CHILD_FINISH     (子进程完成)
- SYNC_TIMEOFFSETS_*    (时间偏移设置)
```

## 6. 安全策略应用流程

```mermaid
graph TD
    A[容器创建] --> B[命名空间隔离]
    B --> C[用户权限管理]
    C --> D[Capabilities设置]
    D --> E[Seccomp过滤器]
    E --> F[LSM策略应用]
    F --> G[NoNewPrivileges]
    G --> H[文件系统安全]
    H --> I[资源限制]
    I --> J[执行容器进程]
    
    subgraph "安全层级"
        B1[命名空间隔离 - 第一层]
        D1[Capabilities - 第二层]
        E1[Seccomp - 第三层]
        F1[AppArmor/SELinux - 第四层]
        I1[Cgroups限制 - 第五层]
    end
```

## 7. 文件系统挂载和隔离流程

```
┌────────────────────────────────────────────────────────────┐
│                      Rootfs 准备流程                       │
├────────────────────────────────────────────────────────────┤
│                                                           │
│  1. Mount Namespace 创建                                  │
│     └── unshare(CLONE_NEWNS)                             │
│                                                           │
│  2. 基础挂载点准备                                        │
│     ├── /proc (proc文件系统)                             │
│     ├── /sys (sysfs文件系统)                             │
│     ├── /dev (devtmpfs或bind挂载)                        │
│     └── /dev/pts (devpts伪终端)                          │
│                                                           │
│  3. 用户挂载点处理                                        │
│     ├── bind挂载 (源目录绑定)                            │
│     ├── tmpfs挂载 (内存文件系统)                         │
│     └── 特殊文件系统                                      │
│                                                           │
│  4. 安全挂载选项                                          │
│     ├── MS_NOEXEC (禁止执行)                             │
│     ├── MS_NOSUID (禁止setuid)                           │
│     ├── MS_NODEV (禁止设备文件)                          │
│     └── 挂载传播控制                                      │
│                                                           │
│  5. pivot_root或chroot                                   │
│     └── 切换根文件系统                                    │
│                                                           │
│  6. 路径安全处理                                          │
│     ├── MaskedPaths (隐藏路径)                           │
│     └── ReadonlyPaths (只读路径)                         │
│                                                           │
└────────────────────────────────────────────────────────────┘
```

## 8. Cgroups 资源管理架构

```mermaid
graph TB
    A[Container] --> B[Cgroup Manager]
    B --> C[Memory Controller]
    B --> D[CPU Controller]
    B --> E[BlockIO Controller]
    B --> F[Device Controller]
    B --> G[Network Controller]
    
    C --> C1[memory.limit_in_bytes]
    C --> C2[memory.oom_control]
    C --> C3[memory.swappiness]
    
    D --> D1[cpu.shares]
    D --> D2[cpu.cfs_quota_us]
    D --> D3[cpu.cfs_period_us]
    D --> D4[cpuset.cpus]
    
    E --> E1[blkio.weight]
    E --> E2[blkio.throttle.read_bps_device]
    E --> E3[blkio.throttle.write_bps_device]
    
    F --> F1[devices.allow]
    F --> F2[devices.deny]
    
    G --> G1[net_cls.classid]
    G --> G2[net_prio.ifpriomap]
```

## 9. 容器状态转换图

```mermaid
stateDiagram-v2
    [*] --> Creating: runc create/run
    Creating --> Created: 创建成功
    Creating --> [*]: 创建失败
    
    Created --> Running: runc start
    Created --> [*]: runc delete
    
    Running --> Paused: runc pause
    Paused --> Running: runc resume
    
    Running --> Stopped: 进程退出
    Paused --> Stopped: runc kill
    
    Stopped --> [*]: runc delete
    
    note right of Creating
        - OCI配置解析
        - 命名空间创建
        - 资源分配
    end note
    
    note right of Running
        - 进程执行中
        - 资源监控
        - 信号处理
    end note
```

## 10. runc 错误处理和清理流程

```
┌─────────────────────────────────────────────────────────────┐
│                    错误处理和清理机制                        │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  创建阶段错误处理:                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  defer func() {                                     │   │
│  │      if retErr != nil {                             │   │
│  │          _ = p.terminate()        // 终止进程       │   │
│  │          _ = p.manager.Destroy()  // 清理cgroup     │   │
│  │          _ = p.intelRdtManager.Destroy() // 清理RDT │   │
│  │      }                                              │   │
│  │  }()                                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                            │
│  运行时错误检测:                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  - OOM检测和处理                                     │   │
│  │  - 进程退出状态监控                                  │   │
│  │  - 信号传播和处理                                    │   │
│  │  - 僵尸进程清理                                      │   │
│  │  - 文件描述符泄漏防护                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                            │
│  清理顺序:                                                 │
│  1. 发送SIGKILL信号                                        │
│  2. 等待进程终止                                           │
│  3. 清理cgroup资源                                         │
│  4. 清理Intel RDT资源                                      │
│  5. 清理挂载点                                             │
│  6. 清理状态文件                                           │
│  7. 关闭通信通道                                           │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

## 11. 网络配置和管理流程

```mermaid
graph TD
    A[容器网络配置] --> B[Network Namespace创建]
    B --> C[网络策略应用]
    C --> D[Loopback接口配置]
    C --> E[外部网络接口]
    C --> F[路由配置]
    
    D --> D1[lo接口启动]
    D --> D2[127.0.0.1配置]
    
    E --> E1[veth pair创建]
    E --> E2[接口移动到容器NS]
    E --> E3[IP地址配置]
    
    F --> F1[默认路由]
    F --> F2[静态路由]
    F --> F3[路由策略]
    
    subgraph "网络隔离层级"
        G1[网络命名空间隔离]
        G2[接口级别隔离]
        G3[路由级别隔离]
        G4[防火墙规则隔离]
    end
```

## 12. 系统调用使用时序图

```mermaid
sequenceDiagram
    participant P as Parent Process
    participant C as Child Process
    participant K as Linux Kernel
    
    P->>K: clone(CLONE_NEWNS|CLONE_NEWPID|...)
    K-->>P: child_pid
    
    P->>C: 发送配置数据
    C->>K: setns(existing_ns_fd)
    C->>K: unshare(CLONE_NEWUSER)
    C->>K: prctl(PR_SET_NO_NEW_PRIVS)
    
    C->>K: mount("/proc", "/proc", "proc", MS_NOEXEC|MS_NOSUID|MS_NODEV)
    C->>K: mount("/sys", "/sys", "sysfs", MS_NOEXEC|MS_NOSUID|MS_NODEV)
    C->>K: mount("/dev", "/dev", "devtmpfs", 0)
    
    C->>K: pivot_root("/container/root", "/container/root/old")
    C->>K: umount("/old")
    
    C->>K: capset(&header, &data)
    C->>K: prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog)
    
    C->>K: execve("/container/bin/app", argv, envp)
    K-->>C: 容器进程开始执行
```

这些图表详细展示了runc容器运行时的各个关键流程，从高层架构到具体实现细节，帮助理解runc是如何协调Linux内核的各种特性来实现安全、隔离的容器环境。