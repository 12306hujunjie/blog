# OCI 容器安全配置实战

> **系列导航：** [OCI 容器技术完全指南系列](./oci-series-index.md) → 第五篇：安全实战  
> **规范版本：** OCI Runtime Spec v1.0.2  
> **最后更新：** 2024-07-10

## 概述

容器安全是生产环境部署的重要考虑因素。本文基于 OCI 规范，深入讲解容器安全配置的最佳实践，包括 Seccomp、Capabilities、用户命名空间等安全特性的实战应用。

## 安全配置最佳实践

### 最小权限原则

#### 移除不必要的 Capabilities

```json
{
    "process": {
        "capabilities": {
            "effective": ["CAP_NET_BIND_SERVICE"],
            "bounding": ["CAP_NET_BIND_SERVICE"],
            "inheritable": [],
            "permitted": ["CAP_NET_BIND_SERVICE"],
            "ambient": []
        },
        "noNewPrivileges": true
    }
}
```

**常用 Capabilities 说明：**

| Capability | 用途 | 风险级别 |
|-----------|------|----------|
| `CAP_NET_BIND_SERVICE` | 绑定特权端口 (<1024) | 低 |
| `CAP_NET_ADMIN` | 网络管理 | 高 |
| `CAP_SYS_ADMIN` | 系统管理 | 极高 |
| `CAP_DAC_OVERRIDE` | 忽略文件权限 | 高 |
| `CAP_SETUID` | 设置用户ID | 中 |

### Seccomp 系统调用过滤

#### 白名单模式配置

```json
{
    "linux": {
        "seccomp": {
            "defaultAction": "SCMP_ACT_ERRNO",
            "architectures": ["SCMP_ARCH_X86_64", "SCMP_ARCH_X86", "SCMP_ARCH_X32"],
            "syscalls": [
                {
                    "names": [
                        "read", "write", "open", "close", "stat", "fstat",
                        "lstat", "poll", "lseek", "mmap", "mprotect", "munmap",
                        "brk", "rt_sigaction", "rt_sigprocmask", "rt_sigreturn",
                        "ioctl", "pread64", "pwrite64", "readv", "writev",
                        "access", "pipe", "select", "sched_yield", "mremap",
                        "msync", "mincore", "madvise", "shmget", "shmat",
                        "shmctl", "dup", "dup2", "pause", "nanosleep",
                        "getitimer", "alarm", "setitimer", "getpid", "sendfile",
                        "socket", "connect", "accept", "sendto", "recvfrom",
                        "sendmsg", "recvmsg", "shutdown", "bind", "listen",
                        "getsockname", "getpeername", "socketpair", "setsockopt",
                        "getsockopt", "clone", "fork", "vfork", "execve",
                        "exit", "wait4", "kill", "uname", "semget", "semop",
                        "semctl", "shmdt", "msgget", "msgsnd", "msgrcv",
                        "msgctl", "fcntl", "flock", "fsync", "fdatasync",
                        "truncate", "ftruncate", "getdents", "getcwd",
                        "chdir", "fchdir", "rename", "mkdir", "rmdir",
                        "creat", "link", "unlink", "symlink", "readlink",
                        "chmod", "fchmod", "chown", "fchown", "lchown",
                        "umask", "gettimeofday", "getrlimit", "getrusage",
                        "sysinfo", "times", "ptrace", "getuid", "syslog",
                        "getgid", "setuid", "setgid", "geteuid", "getegid",
                        "setpgid", "getppid", "getpgrp", "setsid", "setreuid",
                        "setregid", "getgroups", "setgroups", "setresuid",
                        "getresuid", "setresgid", "getresgid", "getpgid",
                        "setfsuid", "setfsgid", "getsid", "capget", "capset",
                        "rt_sigpending", "rt_sigtimedwait", "rt_sigqueueinfo",
                        "rt_sigsuspend", "sigaltstack", "utime", "mknod",
                        "uselib", "personality", "ustat", "statfs", "fstatfs",
                        "sysfs", "getpriority", "setpriority", "sched_setparam",
                        "sched_getparam", "sched_setscheduler", "sched_getscheduler",
                        "sched_get_priority_max", "sched_get_priority_min",
                        "sched_rr_get_interval", "mlock", "munlock", "mlockall",
                        "munlockall", "vhangup", "modify_ldt", "pivot_root",
                        "_sysctl", "prctl", "arch_prctl", "adjtimex", "setrlimit",
                        "chroot", "sync", "acct", "settimeofday", "mount",
                        "umount2", "swapon", "swapoff", "reboot", "sethostname",
                        "setdomainname", "iopl", "ioperm", "create_module",
                        "init_module", "delete_module", "get_kernel_syms",
                        "query_module", "quotactl", "nfsservctl", "getpmsg",
                        "putpmsg", "afs_syscall", "tuxcall", "security",
                        "gettid", "readahead", "setxattr", "lsetxattr",
                        "fsetxattr", "getxattr", "lgetxattr", "fgetxattr",
                        "listxattr", "llistxattr", "flistxattr", "removexattr",
                        "lremovexattr", "fremovexattr", "tkill", "time",
                        "futex", "sched_setaffinity", "sched_getaffinity",
                        "set_thread_area", "io_setup", "io_destroy", "io_getevents",
                        "io_submit", "io_cancel", "get_thread_area", "lookup_dcookie",
                        "epoll_create", "epoll_ctl_old", "epoll_wait_old",
                        "remap_file_pages", "getdents64", "set_tid_address",
                        "restart_syscall", "semtimedop", "fadvise64", "timer_create",
                        "timer_settime", "timer_gettime", "timer_getoverrun",
                        "timer_delete", "clock_settime", "clock_gettime",
                        "clock_getres", "clock_nanosleep", "exit_group",
                        "epoll_wait", "epoll_ctl", "tgkill", "utimes",
                        "vserver", "mbind", "set_mempolicy", "get_mempolicy",
                        "mq_open", "mq_unlink", "mq_timedsend", "mq_timedreceive",
                        "mq_notify", "mq_getsetattr", "kexec_load", "waitid",
                        "add_key", "request_key", "keyctl", "ioprio_set",
                        "ioprio_get", "inotify_init", "inotify_add_watch",
                        "inotify_rm_watch", "migrate_pages", "openat", "mkdirat",
                        "mknodat", "fchownat", "futimesat", "newfstatat",
                        "unlinkat", "renameat", "linkat", "symlinkat",
                        "readlinkat", "fchmodat", "faccessat", "pselect6",
                        "ppoll", "unshare", "set_robust_list", "get_robust_list",
                        "splice", "tee", "sync_file_range", "vmsplice",
                        "move_pages", "utimensat", "epoll_pwait", "signalfd",
                        "timerfd_create", "eventfd", "fallocate", "timerfd_settime",
                        "timerfd_gettime", "accept4", "signalfd4", "eventfd2",
                        "epoll_create1", "dup3", "pipe2", "inotify_init1",
                        "preadv", "pwritev", "rt_tgsigqueueinfo", "perf_event_open",
                        "recvmmsg", "fanotify_init", "fanotify_mark", "prlimit64",
                        "name_to_handle_at", "open_by_handle_at", "clock_adjtime",
                        "syncfs", "sendmmsg", "setns", "getcpu", "process_vm_readv",
                        "process_vm_writev", "kcmp", "finit_module", "sched_setattr",
                        "sched_getattr", "renameat2", "seccomp", "getrandom",
                        "memfd_create", "kexec_file_load", "bpf", "execveat",
                        "userfaultfd", "membarrier", "mlock2", "copy_file_range",
                        "preadv2", "pwritev2"
                    ],
                    "action": "SCMP_ACT_ALLOW"
                },
                {
                    "names": ["kill"],
                    "action": "SCMP_ACT_ALLOW",
                    "args": [
                        {
                            "index": 1,
                            "value": 15,
                            "op": "SCMP_CMP_EQ"
                        }
                    ]
                }
            ]
        }
    }
}
```

#### 参数过滤示例

```json
{
    "names": ["socket"],
    "action": "SCMP_ACT_ERRNO",
    "errnoRet": 1,
    "args": [
        {
            "index": 0,
            "value": 2,
            "op": "SCMP_CMP_NE"
        }
    ]
}
```

### 用户命名空间配置

#### 非特权容器运行

```json
{
    "process": {
        "user": {
            "uid": 1000,
            "gid": 1000
        }
    },
    "linux": {
        "namespaces": [
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
        ]
    }
}
```

### 文件系统安全

#### 只读根文件系统

```json
{
    "root": {
        "path": "rootfs",
        "readonly": true
    },
    "mounts": [
        {
            "destination": "/tmp",
            "type": "tmpfs",
            "source": "tmpfs",
            "options": ["nosuid", "nodev", "size=100m", "mode=1777"]
        },
        {
            "destination": "/var/log",
            "type": "tmpfs",
            "source": "tmpfs",
            "options": ["nosuid", "nodev", "size=50m"]
        }
    ]
}
```

#### 敏感路径保护

```json
{
    "linux": {
        "maskedPaths": [
            "/proc/acpi",
            "/proc/asound",
            "/proc/kcore",
            "/proc/keys",
            "/proc/latency_stats",
            "/proc/timer_list",
            "/proc/timer_stats",
            "/proc/sched_debug",
            "/proc/scsi",
            "/sys/firmware",
            "/sys/fs/selinux"
        ],
        "readonlyPaths": [
            "/proc/bus",
            "/proc/fs",
            "/proc/irq",
            "/proc/sys",
            "/proc/sysrq-trigger"
        ]
    }
}
```

## 安全扫描和审计

### 镜像安全扫描

#### 使用 Trivy

```bash
# 扫描本地镜像
trivy image nginx:latest

# 扫描远程镜像
trivy image registry.example.com/myapp:latest

# 输出 JSON 格式
trivy image --format json nginx:latest

# 只显示高危漏洞
trivy image --severity HIGH,CRITICAL nginx:latest

# 忽略未修复的漏洞
trivy image --ignore-unfixed nginx:latest
```

#### 使用 Grype

```bash
# 基础扫描
grype nginx:latest

# 指定输出格式
grype nginx:latest -o json

# 扫描 SBOM
grype sbom:./sbom.json
```

#### 使用 Clair

```bash
# 启动 Clair 服务
docker run -d --name clair-db postgres:13
docker run -d --name clair --link clair-db:postgres \
  -v /tmp/clair_config:/config \
  quay.io/coreos/clair:latest

# 使用 clairctl 扫描
clairctl analyze nginx:latest
```

### 运行时安全监控

#### Falco 规则配置

```yaml
# /etc/falco/falco_rules.yaml
- rule: Write below binary dir
  desc: an attempt to write to any file below a set of binary directories
  condition: >
    bin_dir and evt.dir = < and open_write
    and not package_mgmt_procs
    and not exe_running_docker_save
  output: >
    File below a known binary directory opened for writing 
    (user=%user.name command=%proc.cmdline file=%fd.name parent=%proc.pname)
  priority: ERROR

- rule: Read sensitive file trusted after startup
  desc: an attempt to read any sensitive file (e.g. files containing user/password/authentication information)
  condition: >
    sensitive_files and open_read
    and not proc_is_new
    and proc.name!="sshd"
  output: >
    Sensitive file opened for reading by trusted program after startup
    (user=%user.name command=%proc.cmdline file=%fd.name parent=%proc.pname gparent=%proc.aname[2])
  priority: WARNING

- rule: Network tool launched in container
  desc: A network tool was launched inside a container
  condition: >
    spawned_process and container
    and network_tool_procs
  output: >
    Network tool launched in container (user=%user.name command=%proc.cmdline container_id=%container.id image=%container.image.repository)
  priority: WARNING
```

#### 启动 Falco

```bash
# Docker 方式运行
docker run -i -t \
  --name falco \
  --privileged \
  -v /var/run/docker.sock:/host/var/run/docker.sock \
  -v /dev:/host/dev \
  -v /proc:/host/proc:ro \
  -v /boot:/host/boot:ro \
  -v /lib/modules:/host/lib/modules:ro \
  -v /usr:/host/usr:ro \
  -v /etc:/host/etc:ro \
  falcosecurity/falco:latest

# Kubernetes DaemonSet
kubectl apply -f https://raw.githubusercontent.com/falcosecurity/falco/master/examples/k8s_audit_config/falco-k8s-audit.yaml
```

## 安全加固脚本

### 容器安全检查脚本

```bash
#!/bin/bash
# container-security-check.sh

CONTAINER_ID=$1

if [ -z "$CONTAINER_ID" ]; then
    echo "Usage: $0 <container-id>"
    exit 1
fi

echo "=== Container Security Check for $CONTAINER_ID ==="

# 检查运行用户
echo "1. Checking running user..."
USER_INFO=$(docker exec $CONTAINER_ID id)
echo "Running as: $USER_INFO"

if [[ $USER_INFO == *"uid=0"* ]]; then
    echo "⚠️  WARNING: Container running as root"
else
    echo "✅ Container running as non-root user"
fi

# 检查 Capabilities
echo -e "\n2. Checking capabilities..."
CAPS=$(docker exec $CONTAINER_ID grep Cap /proc/1/status)
echo "$CAPS"

# 检查 Seccomp
echo -e "\n3. Checking seccomp..."
SECCOMP=$(docker exec $CONTAINER_ID grep Seccomp /proc/1/status)
echo "$SECCOMP"

if [[ $SECCOMP == *"Seccomp:	0"* ]]; then
    echo "⚠️  WARNING: Seccomp disabled"
else
    echo "✅ Seccomp enabled"
fi

# 检查命名空间
echo -e "\n4. Checking namespaces..."
docker exec $CONTAINER_ID ls -la /proc/1/ns/

# 检查挂载点
echo -e "\n5. Checking mount points..."
docker exec $CONTAINER_ID mount | grep -E "(proc|sys|dev)"

# 检查网络配置
echo -e "\n6. Checking network configuration..."
docker exec $CONTAINER_ID ip addr show

echo -e "\n=== Security Check Complete ==="
```

### 自动化安全扫描

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build image
      run: docker build -t myapp:test .
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'myapp:test'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run Hadolint
      uses: hadolint/hadolint-action@v3.1.0
      with:
        dockerfile: Dockerfile
```

## 合规性和标准

### CIS Benchmarks

根据 CIS Docker Benchmark 的关键安全建议：

1. **主机安全**
   - 保持 Docker 版本更新
   - 配置 Docker 守护进程安全参数
   - 使用专用分区存储 Docker 数据

2. **容器镜像安全**
   - 扫描镜像漏洞
   - 使用最小化基础镜像
   - 不在镜像中存储敏感信息

3. **运行时安全**
   - 限制容器资源使用
   - 设置适当的重启策略
   - 启用内容信任验证

### NIST 安全框架

遵循 NIST Cybersecurity Framework：

1. **识别 (Identify)**
   - 资产清单管理
   - 威胁建模分析

2. **保护 (Protect)**
   - 访问控制策略
   - 数据保护措施

3. **检测 (Detect)**
   - 安全监控配置
   - 异常行为检测

4. **响应 (Respond)**
   - 事件响应计划
   - 安全团队协调

5. **恢复 (Recover)**
   - 业务连续性计划
   - 系统恢复程序

## 下一步学习

完成安全配置学习后，建议继续学习：

1. **[OCI 容器监控调试与故障排除](./oci-06-monitoring-guide.md)** - 掌握运维技能
2. **[OCI 容器生产环境实践案例](./oci-07-production-guide.md)** - 了解生产环境应用
3. **[OCI Runtime 规范详解](./oci-02-runtime-spec.md)** - 深入运行时配置

## 总结

容器安全是一个多层次的防护体系，需要从镜像构建、运行时配置、网络隔离等多个维度进行考虑。通过合理配置 OCI 规范中的安全特性，结合安全扫描和监控工具，可以构建更加安全可靠的容器化应用。

**关键要点：**
- 坚持最小权限原则，移除不必要的 capabilities
- 使用 Seccomp 和用户命名空间提供深度防护
- 实施镜像安全扫描和运行时监控
- 遵循安全合规标准和最佳实践

---

**上一篇：** [OCI Distribution 规范详解 - 容器镜像分发协议](./oci-04-distribution-spec.md)  
**下一篇：** [OCI 容器监控调试与故障排除](./oci-06-monitoring-guide.md)  
**返回：** [OCI 容器技术完全指南系列](./oci-series-index.md)