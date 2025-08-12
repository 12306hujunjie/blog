---
title: OCI 容器监控调试与故障排除
date: 2024-02-06
tags:
 - OCI
 - 云原生
 - 监控
categories:
 - 云原生
sidebar: auto
---

# OCI 容器监控调试与故障排除

> **系列导航：** [OCI 容器技术完全指南系列](./oci-series-index.md) → 第六篇：监控调试  
> **规范版本：** OCI Runtime Spec v1.0.2  
> **最后更新：** 2024-07-10

## 概述

容器监控和故障排除是保障生产环境稳定运行的关键技能。本文基于 OCI 规范，深入讲解容器监控体系建设、调试工具使用和常见问题的排查方法，帮助运维人员快速定位和解决容器相关问题。

## 容器状态监控

### 基础状态查询

#### 运行时状态检查

```bash
#!/bin/bash
# container-status-check.sh

CONTAINER_ID=$1

echo "=== Container Status Overview ==="

# 1. 基础状态信息
echo "1. Basic Status:"
runc state $CONTAINER_ID 2>/dev/null || echo "Container not found"

# 2. 进程信息
echo -e "\n2. Process Information:"
if [ -f /sys/fs/cgroup/pids/system.slice/docker-${CONTAINER_ID}.scope/pids.current ]; then
    echo "Active PIDs: $(cat /sys/fs/cgroup/pids/system.slice/docker-${CONTAINER_ID}.scope/pids.current)"
    echo "PID Limit: $(cat /sys/fs/cgroup/pids/system.slice/docker-${CONTAINER_ID}.scope/pids.max)"
fi

# 3. 命名空间信息
echo -e "\n3. Namespace Information:"
if [ -d /proc/$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID 2>/dev/null)/ns ]; then
    ls -la /proc/$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID)/ns/
fi

# 4. 挂载信息
echo -e "\n4. Mount Information:"
docker exec $CONTAINER_ID mount 2>/dev/null | grep -v "tmpfs on /dev" | head -10
```

#### 资源使用监控

```bash
#!/bin/bash
# resource-monitor.sh

CONTAINER_ID=$1
DURATION=${2:-60}

echo "=== Resource Monitoring for $DURATION seconds ==="

# 1. 内存使用监控
echo "1. Memory Usage:"
while [ $DURATION -gt 0 ]; do
    if [ -f /sys/fs/cgroup/memory/docker/$CONTAINER_ID/memory.usage_in_bytes ]; then
        USAGE=$(cat /sys/fs/cgroup/memory/docker/$CONTAINER_ID/memory.usage_in_bytes)
        LIMIT=$(cat /sys/fs/cgroup/memory/docker/$CONTAINER_ID/memory.limit_in_bytes)
        PERCENT=$(echo "scale=2; $USAGE * 100 / $LIMIT" | bc)
        echo "$(date): Memory: ${USAGE} bytes (${PERCENT}% of limit)"
    fi
    
    # 2. CPU 使用监控
    if [ -f /sys/fs/cgroup/cpu/docker/$CONTAINER_ID/cpuacct.usage ]; then
        CPU_USAGE=$(cat /sys/fs/cgroup/cpu/docker/$CONTAINER_ID/cpuacct.usage)
        echo "$(date): CPU: ${CPU_USAGE} nanoseconds"
    fi
    
    sleep 5
    DURATION=$((DURATION - 5))
done
```

### 高级监控工具

#### cAdvisor 部署

```yaml
# cadvisor-deployment.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: cadvisor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      name: cadvisor
  template:
    metadata:
      labels:
        name: cadvisor
    spec:
      hostNetwork: true
      hostPID: true
      containers:
      - name: cadvisor
        image: gcr.io/cadvisor/cadvisor:v0.47.0
        ports:
        - containerPort: 8080
          protocol: TCP
        securityContext:
          privileged: true
        volumeMounts:
        - name: rootfs
          mountPath: /rootfs
          readOnly: true
        - name: var-run
          mountPath: /var/run
          readOnly: true
        - name: sys
          mountPath: /sys
          readOnly: true
        - name: docker
          mountPath: /var/lib/docker
          readOnly: true
        - name: disk
          mountPath: /dev/disk
          readOnly: true
        resources:
          requests:
            memory: 200Mi
            cpu: 150m
          limits:
            memory: 300Mi
            cpu: 300m
      volumes:
      - name: rootfs
        hostPath:
          path: /
      - name: var-run
        hostPath:
          path: /var/run
      - name: sys
        hostPath:
          path: /sys
      - name: docker
        hostPath:
          path: /var/lib/docker
      - name: disk
        hostPath:
          path: /dev/disk
      terminationGracePeriodSeconds: 30
```

#### Prometheus 指标收集

```yaml
# prometheus-config.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "container-rules.yml"

scrape_configs:
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
    metrics_path: /metrics
    scrape_interval: 10s
    metric_relabel_configs:
    - source_labels: [__name__]
      regex: 'container_.*'
      target_label: __name__
      replacement: '${1}'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s

  - job_name: 'container-runtime'
    static_configs:
      - targets: ['containerd:9090']
    metrics_path: /v1/metrics
```

#### 实时资源监控脚本

```bash
#!/bin/bash
# real-time-monitor.sh

CONTAINER_ID=$1

if [ -z "$CONTAINER_ID" ]; then
    echo "Usage: $0 <container-id>"
    exit 1
fi

# 创建监控窗口
trap 'kill $(jobs -p) 2>/dev/null; exit' INT TERM

echo "Starting real-time monitoring for container: $CONTAINER_ID"
echo "Press Ctrl+C to stop"

while true; do
    clear
    echo "=== Container Real-time Monitoring ==="
    echo "Container ID: $CONTAINER_ID"
    echo "Timestamp: $(date)"
    echo
    
    # CPU 使用率
    echo "--- CPU Usage ---"
    docker exec $CONTAINER_ID top -bn1 | grep "Cpu(s)" | \
    awk '{print "CPU Usage: " $2 " user, " $4 " system, " $8 " idle"}'
    
    # 内存使用
    echo -e "\n--- Memory Usage ---"
    docker exec $CONTAINER_ID free -h
    
    # 磁盘使用
    echo -e "\n--- Disk Usage ---"
    docker exec $CONTAINER_ID df -h | head -5
    
    # 网络统计
    echo -e "\n--- Network Statistics ---"
    docker exec $CONTAINER_ID cat /proc/net/dev | grep -v "lo:" | head -3
    
    # 进程信息
    echo -e "\n--- Top Processes ---"
    docker exec $CONTAINER_ID ps aux --sort=-%cpu | head -5
    
    sleep 2
done
```

## 性能分析

### CPU 性能分析

#### perf 工具使用

```bash
#!/bin/bash
# cpu-performance-analysis.sh

CONTAINER_ID=$1
DURATION=${2:-30}

echo "=== CPU Performance Analysis ==="

# 1. 获取容器主进程 PID
PID=$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID)
echo "Container PID: $PID"

# 2. CPU 使用率分析
echo -e "\n1. CPU Utilization:"
docker exec $CONTAINER_ID top -b -n1 -p 1 | grep -A 1 "PID"

# 3. 使用 perf 进行性能分析
echo -e "\n2. Performance profiling (${DURATION}s):"
if command -v perf >/dev/null 2>&1; then
    sudo perf record -p $PID sleep $DURATION
    sudo perf report --stdio | head -20
else
    echo "perf not available, using alternative methods"
fi

# 4. 系统调用分析
echo -e "\n3. System call analysis:"
timeout $DURATION strace -c -p $PID 2>&1 | tail -20

# 5. CPU 调度信息
echo -e "\n4. CPU scheduling info:"
if [ -f /proc/$PID/sched ]; then
    cat /proc/$PID/sched | head -20
fi
```

#### 火焰图生成

```bash
#!/bin/bash
# generate-flamegraph.sh

CONTAINER_ID=$1
DURATION=${2:-60}

# 安装 FlameGraph 工具
if [ ! -d "/opt/FlameGraph" ]; then
    git clone https://github.com/brendangregg/FlameGraph.git /opt/FlameGraph
fi

PID=$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID)

echo "Generating CPU flamegraph for container $CONTAINER_ID"

# 收集性能数据
sudo perf record -F 99 -p $PID -g -- sleep $DURATION

# 生成火焰图
sudo perf script | /opt/FlameGraph/stackcollapse-perf.pl | \
/opt/FlameGraph/flamegraph.pl > /tmp/container-$CONTAINER_ID-flamegraph.svg

echo "Flamegraph saved to: /tmp/container-$CONTAINER_ID-flamegraph.svg"
```

### 内存分析

#### 内存使用详细分析

```bash
#!/bin/bash
# memory-analysis.sh

CONTAINER_ID=$1
PID=$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID)

echo "=== Memory Analysis for Container $CONTAINER_ID ==="

# 1. 内存概览
echo "1. Memory Overview:"
docker exec $CONTAINER_ID cat /proc/meminfo | grep -E "(MemTotal|MemFree|MemAvailable|Buffers|Cached|SwapTotal|SwapFree)"

# 2. 进程内存使用
echo -e "\n2. Process Memory Usage:"
docker exec $CONTAINER_ID ps aux --sort=-%mem | head -10

# 3. 内存映射详情
echo -e "\n3. Memory Mapping Details:"
if [ -f /proc/$PID/smaps ]; then
    echo "Memory segments analysis:"
    awk '
    /^Size:/ { size += $2 }
    /^Rss:/ { rss += $2 }
    /^Pss:/ { pss += $2 }
    /^Shared_Clean:/ { shared_clean += $2 }
    /^Shared_Dirty:/ { shared_dirty += $2 }
    /^Private_Clean:/ { private_clean += $2 }
    /^Private_Dirty:/ { private_dirty += $2 }
    END {
        print "Total Size: " size " KB"
        print "Resident Set Size (RSS): " rss " KB"
        print "Proportional Set Size (PSS): " pss " KB"
        print "Shared Clean: " shared_clean " KB"
        print "Shared Dirty: " shared_dirty " KB"
        print "Private Clean: " private_clean " KB"
        print "Private Dirty: " private_dirty " KB"
    }' /proc/$PID/smaps
fi

# 4. 内存泄漏检测
echo -e "\n4. Memory Leak Detection:"
for i in {1..5}; do
    RSS=$(grep VmRSS /proc/$PID/status | awk '{print $2}')
    echo "Sample $i: RSS = $RSS KB"
    sleep 10
done
```

#### Valgrind 内存检查

```bash
#!/bin/bash
# valgrind-check.sh

# 在容器内运行 Valgrind
docker exec $CONTAINER_ID valgrind \
    --tool=memcheck \
    --leak-check=full \
    --show-leak-kinds=all \
    --track-origins=yes \
    --verbose \
    --log-file=/tmp/valgrind-report.txt \
    /usr/local/bin/your-application

# 分析报告
docker exec $CONTAINER_ID cat /tmp/valgrind-report.txt
```

### I/O 性能分析

#### 磁盘 I/O 监控

```bash
#!/bin/bash
# io-analysis.sh

CONTAINER_ID=$1
DURATION=${2:-60}

echo "=== I/O Performance Analysis ==="

# 1. 磁盘使用情况
echo "1. Disk Usage:"
docker exec $CONTAINER_ID df -h

# 2. I/O 统计
echo -e "\n2. I/O Statistics:"
docker exec $CONTAINER_ID iostat -x 1 5

# 3. 文件描述符使用
echo -e "\n3. File Descriptor Usage:"
PID=$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID)
echo "Open file descriptors: $(ls /proc/$PID/fd | wc -l)"
echo "File descriptor limit: $(cat /proc/$PID/limits | grep "Max open files")"

# 4. I/O 进程监控
echo -e "\n4. I/O Process Monitoring:"
docker exec $CONTAINER_ID iotop -b -n 3 -d 1

# 5. 系统调用 I/O 跟踪
echo -e "\n5. I/O System Call Tracing:"
timeout $DURATION strace -e trace=file,write,read -p $PID 2>&1 | head -50
```

#### 存储性能测试

```bash
#!/bin/bash
# storage-benchmark.sh

CONTAINER_ID=$1

echo "=== Storage Performance Benchmark ==="

# 1. 顺序读写测试
echo "1. Sequential Read/Write Test:"
docker exec $CONTAINER_ID dd if=/dev/zero of=/tmp/testfile bs=1M count=100 oflag=direct 2>&1 | grep -E "(copied|s)"
docker exec $CONTAINER_ID dd if=/tmp/testfile of=/dev/null bs=1M iflag=direct 2>&1 | grep -E "(copied|s)"

# 2. 随机读写测试 (需要 fio)
echo -e "\n2. Random Read/Write Test:"
docker exec $CONTAINER_ID fio --name=random-rw \
    --ioengine=libaio --iodepth=4 --rw=randrw --bs=4k \
    --direct=1 --size=100M --numjobs=1 --runtime=30 \
    --filename=/tmp/fio-test --group_reporting 2>/dev/null || \
    echo "fio not available in container"

# 3. 清理测试文件
docker exec $CONTAINER_ID rm -f /tmp/testfile /tmp/fio-test
```

## 网络诊断

### 网络连接性测试

```bash
#!/bin/bash
# network-diagnosis.sh

CONTAINER_ID=$1

echo "=== Network Diagnosis for Container $CONTAINER_ID ==="

# 1. 网络接口信息
echo "1. Network Interfaces:"
docker exec $CONTAINER_ID ip addr show

# 2. 路由表
echo -e "\n2. Routing Table:"
docker exec $CONTAINER_ID ip route show

# 3. 网络连接状态
echo -e "\n3. Network Connections:"
docker exec $CONTAINER_ID netstat -tuln 2>/dev/null || \
docker exec $CONTAINER_ID ss -tuln

# 4. DNS 解析测试
echo -e "\n4. DNS Resolution Test:"
docker exec $CONTAINER_ID nslookup google.com 2>/dev/null || \
docker exec $CONTAINER_ID dig google.com

# 5. 网络连通性测试
echo -e "\n5. Connectivity Test:"
docker exec $CONTAINER_ID ping -c 3 8.8.8.8
docker exec $CONTAINER_ID curl -I --connect-timeout 5 http://httpbin.org/get 2>/dev/null || \
echo "HTTP connectivity test failed"

# 6. 防火墙规则检查
echo -e "\n6. Firewall Rules:"
docker exec $CONTAINER_ID iptables -L 2>/dev/null || echo "iptables not available"
```

### 网络流量分析

#### tcpdump 抓包分析

```bash
#!/bin/bash
# network-capture.sh

CONTAINER_ID=$1
INTERFACE=${2:-eth0}
DURATION=${3:-60}

echo "=== Network Traffic Capture ==="

# 1. 获取容器网络命名空间
PID=$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID)
echo "Container PID: $PID"

# 2. 在容器网络命名空间中抓包
echo "Capturing traffic on interface $INTERFACE for ${DURATION}s..."
sudo nsenter -t $PID -n tcpdump -i $INTERFACE -w /tmp/container-$CONTAINER_ID.pcap &
TCPDUMP_PID=$!

sleep $DURATION
sudo kill $TCPDUMP_PID 2>/dev/null

# 3. 分析抓包结果
echo -e "\n3. Traffic Analysis:"
if [ -f /tmp/container-$CONTAINER_ID.pcap ]; then
    echo "Packet count by protocol:"
    sudo tcpdump -r /tmp/container-$CONTAINER_ID.pcap -n | \
    awk '{print $3}' | cut -d'.' -f1-4 | sort | uniq -c | sort -nr | head -10
    
    echo -e "\nTop destination ports:"
    sudo tcpdump -r /tmp/container-$CONTAINER_ID.pcap -n | \
    grep -oP ':\d+' | sort | uniq -c | sort -nr | head -10
fi
```

#### 网络性能测试

```bash
#!/bin/bash
# network-performance.sh

CONTAINER_ID=$1
TARGET_HOST=${2:-8.8.8.8}

echo "=== Network Performance Test ==="

# 1. 延迟测试
echo "1. Latency Test:"
docker exec $CONTAINER_ID ping -c 10 $TARGET_HOST | tail -1

# 2. 带宽测试 (使用 iperf3)
echo -e "\n2. Bandwidth Test:"
if docker exec $CONTAINER_ID which iperf3 >/dev/null 2>&1; then
    # 需要外部 iperf3 服务器
    docker exec $CONTAINER_ID iperf3 -c iperf.example.com -t 10 2>/dev/null || \
    echo "External iperf3 server not available"
else
    echo "iperf3 not available in container"
fi

# 3. 吞吐量测试
echo -e "\n3. Throughput Test:"
docker exec $CONTAINER_ID wget -O /dev/null http://speedtest.example.com/100MB.bin 2>&1 | \
grep -E "(saved|/s)" || echo "Throughput test failed"
```

## 日志管理

### 结构化日志配置

#### Fluentd 日志收集

```yaml
# fluentd-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      format json
      time_key time
      time_format %Y-%m-%dT%H:%M:%S.%NZ
    </source>
    
    <filter kubernetes.**>
      @type kubernetes_metadata
    </filter>
    
    <filter kubernetes.**>
      @type record_transformer
      <record>
        container_id ${record["docker"]["container_id"]}
        container_name ${record["kubernetes"]["container_name"]}
        pod_name ${record["kubernetes"]["pod_name"]}
        namespace ${record["kubernetes"]["namespace_name"]}
      </record>
    </filter>
    
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      index_name container-logs
      type_name _doc
      logstash_format true
      logstash_prefix container-logs
      include_tag_key true
      tag_key @log_name
      flush_interval 1s
    </match>
```

#### Promtail + Loki 配置

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/log/containers/*.log
    
    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          expressions:
            tag: attrs.tag
          source: attrs
      - regex:
          expression: '^(?P<container_name>(?:[^_]+_){2})(?P<pod_name>[^_]+)_(?P<namespace>[^_]+)_'
          source: tag
      - timestamp:
          source: time
          format: RFC3339Nano
      - labels:
          stream:
          container_name:
          pod_name:
          namespace:
      - output:
          source: output
```

### 日志分析工具

#### ELK 栈查询示例

```bash
#!/bin/bash
# log-analysis.sh

CONTAINER_ID=$1
TIME_RANGE=${2:-"1h"}

echo "=== Container Log Analysis ==="

# 1. Elasticsearch 查询
curl -X GET "elasticsearch:9200/container-logs-*/_search" \
-H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"match": {"container_id": "'$CONTAINER_ID'"}},
        {"range": {"@timestamp": {"gte": "now-'$TIME_RANGE'"}}}
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}],
  "size": 100
}' | jq '.hits.hits[]._source | {timestamp: .["@timestamp"], level: .level, message: .message}'

# 2. 错误日志统计
echo -e "\n2. Error Log Statistics:"
curl -X GET "elasticsearch:9200/container-logs-*/_search" \
-H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"match": {"container_id": "'$CONTAINER_ID'"}},
        {"match": {"level": "ERROR"}},
        {"range": {"@timestamp": {"gte": "now-'$TIME_RANGE'"}}}
      ]
    }
  },
  "aggs": {
    "error_count": {
      "date_histogram": {
        "field": "@timestamp",
        "interval": "5m"
      }
    }
  },
  "size": 0
}' | jq '.aggregations.error_count.buckets[]'
```

## 故障排除

### 常见问题诊断

#### 容器启动失败

```bash
#!/bin/bash
# startup-failure-diagnosis.sh

CONTAINER_ID=$1

echo "=== Container Startup Failure Diagnosis ==="

# 1. 检查容器状态
echo "1. Container Status:"
docker inspect $CONTAINER_ID --format='{{.State.Status}}: {{.State.Error}}'

# 2. 检查退出代码
echo -e "\n2. Exit Code:"
docker inspect $CONTAINER_ID --format='Exit Code: {{.State.ExitCode}}'

# 3. 查看启动日志
echo -e "\n3. Startup Logs:"
docker logs $CONTAINER_ID 2>&1 | tail -50

# 4. 检查资源限制
echo -e "\n4. Resource Limits:"
docker inspect $CONTAINER_ID --format='Memory Limit: {{.HostConfig.Memory}}'
docker inspect $CONTAINER_ID --format='CPU Limit: {{.HostConfig.CpuQuota}}/{{.HostConfig.CpuPeriod}}'

# 5. 检查挂载点
echo -e "\n5. Mount Points:"
docker inspect $CONTAINER_ID --format='{{range .Mounts}}{{.Source}} -> {{.Destination}} ({{.Mode}}){{"\n"}}{{end}}'

# 6. 检查网络配置
echo -e "\n6. Network Configuration:"
docker inspect $CONTAINER_ID --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}}: {{$v.IPAddress}}{{"\n"}}{{end}}'

# 7. 检查安全配置
echo -e "\n7. Security Configuration:"
docker inspect $CONTAINER_ID --format='Privileged: {{.HostConfig.Privileged}}'
docker inspect $CONTAINER_ID --format='User: {{.Config.User}}'
```

#### 内存 OOM 问题

```bash
#!/bin/bash
# oom-diagnosis.sh

CONTAINER_ID=$1

echo "=== OOM (Out of Memory) Diagnosis ==="

# 1. 检查系统日志中的 OOM 事件
echo "1. System OOM Events:"
dmesg | grep -i "killed process" | tail -10

# 2. 检查容器内存限制和使用
echo -e "\n2. Container Memory Status:"
docker stats $CONTAINER_ID --no-stream

# 3. 检查 cgroup 内存统计
echo -e "\n3. Cgroup Memory Statistics:"
if [ -f /sys/fs/cgroup/memory/docker/$CONTAINER_ID/memory.stat ]; then
    echo "Memory statistics:"
    cat /sys/fs/cgroup/memory/docker/$CONTAINER_ID/memory.stat | grep -E "(cache|rss|swap)"
    
    echo -e "\nMemory events:"
    cat /sys/fs/cgroup/memory/docker/$CONTAINER_ID/memory.events 2>/dev/null || \
    cat /sys/fs/cgroup/memory/docker/$CONTAINER_ID/memory.oom_control
fi

# 4. 分析进程内存使用
echo -e "\n4. Process Memory Usage:"
docker exec $CONTAINER_ID ps aux --sort=-%mem | head -10

# 5. 内存泄漏检测
echo -e "\n5. Memory Growth Detection:"
for i in {1..5}; do
    USAGE=$(docker stats $CONTAINER_ID --no-stream --format "{{.MemUsage}}")
    echo "Sample $i: $USAGE"
    sleep 30
done
```

#### 网络连接问题

```bash
#!/bin/bash
# network-troubleshooting.sh

CONTAINER_ID=$1
TARGET=${2:-"google.com"}

echo "=== Network Troubleshooting ==="

# 1. 基础连接测试
echo "1. Basic Connectivity Test:"
docker exec $CONTAINER_ID ping -c 3 8.8.8.8 || echo "Basic connectivity failed"

# 2. DNS 解析测试
echo -e "\n2. DNS Resolution Test:"
docker exec $CONTAINER_ID nslookup $TARGET || docker exec $CONTAINER_ID dig $TARGET

# 3. 端口连接测试
echo -e "\n3. Port Connectivity Test:"
docker exec $CONTAINER_ID telnet $TARGET 80 <<< "" 2>/dev/null || \
docker exec $CONTAINER_ID nc -zv $TARGET 80

# 4. 防火墙规则检查
echo -e "\n4. Firewall Rules:"
iptables -L | grep -A 5 -B 5 "DOCKER"

# 5. 网络命名空间检查
echo -e "\n5. Network Namespace:"
PID=$(docker inspect --format '{{.State.Pid}}' $CONTAINER_ID)
sudo nsenter -t $PID -n ip addr
sudo nsenter -t $PID -n ip route

# 6. 容器网络模式
echo -e "\n6. Network Mode:"
docker inspect $CONTAINER_ID --format='Network Mode: {{.HostConfig.NetworkMode}}'
```

### 自动化故障检测

#### 健康检查脚本

```bash
#!/bin/bash
# container-health-check.sh

CONTAINER_ID=$1
THRESHOLD_CPU=80
THRESHOLD_MEM=90
THRESHOLD_DISK=85

echo "=== Automated Health Check ==="

# 1. CPU 使用率检查
CPU_USAGE=$(docker stats $CONTAINER_ID --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
if (( $(echo "$CPU_USAGE > $THRESHOLD_CPU" | bc -l) )); then
    echo "❌ CPU usage is high: ${CPU_USAGE}%"
    exit 1
else
    echo "✅ CPU usage is normal: ${CPU_USAGE}%"
fi

# 2. 内存使用率检查
MEM_USAGE=$(docker stats $CONTAINER_ID --no-stream --format "{{.MemPerc}}" | sed 's/%//')
if (( $(echo "$MEM_USAGE > $THRESHOLD_MEM" | bc -l) )); then
    echo "❌ Memory usage is high: ${MEM_USAGE}%"
    exit 1
else
    echo "✅ Memory usage is normal: ${MEM_USAGE}%"
fi

# 3. 磁盘使用率检查
DISK_USAGE=$(docker exec $CONTAINER_ID df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt "$THRESHOLD_DISK" ]; then
    echo "❌ Disk usage is high: ${DISK_USAGE}%"
    exit 1
else
    echo "✅ Disk usage is normal: ${DISK_USAGE}%"
fi

# 4. 进程状态检查
if ! docker exec $CONTAINER_ID pgrep -f "main-process" > /dev/null; then
    echo "❌ Main process is not running"
    exit 1
else
    echo "✅ Main process is running"
fi

# 5. 网络连接检查
if ! docker exec $CONTAINER_ID ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    echo "❌ Network connectivity failed"
    exit 1
else
    echo "✅ Network connectivity is good"
fi

echo "🎉 All health checks passed!"
```

## 下一步学习

完成监控调试学习后，建议继续学习：

1. **[OCI 容器生产环境实践案例](./oci-07-production-guide.md)** - 了解企业级监控体系
2. **[OCI 容器安全配置实战](./oci-05-security-guide.md)** - 学习安全监控配置
3. **[OCI Runtime 规范详解](./oci-02-runtime-spec.md)** - 深入理解运行时机制

## 总结

容器监控和故障排除是一个系统工程，需要建立完善的监控体系、掌握专业的调试工具，并形成标准化的故障处理流程。通过本文介绍的方法和工具，您可以构建高效的容器运维体系。

**关键要点：**
- 建立多层次的监控体系（基础指标、应用指标、业务指标）
- 掌握性能分析工具的使用方法
- 建立标准化的故障排除流程
- 实施自动化的健康检查和告警机制

---

**上一篇：** [OCI 容器安全配置实战](./oci-05-security-guide.md)  
**下一篇：** [OCI 容器生产环境实践案例](./oci-07-production-guide.md)  
**返回：** [OCI 容器技术完全指南系列](./oci-series-index.md)