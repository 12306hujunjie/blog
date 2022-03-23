---
title: k3s(轻量级k8s)跨云部署
date: 2022-01-03
tags:
 - k3s
 - best-practice
categories:
 - cloud-base
sidebar: auto
---

### 一. 快速安装
1. server 国内安装    
`curl -sfL http://rancher-mirror.cnrancher.com/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -`
2. server 国外安装    
`curl -sfL https://get.k3s.io | sh -`
3. worker 国内安装    
`curl -sfL http://rancher-mirror.cnrancher.com/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn K3S_URL=${K3S_URL} K3S_TOKEN=${K3S_TOKEN} sh -`
4. worker 国外安装    
`curl -sfL https://get.k3s.io | K3S_URL=${K3S_URL} K3S_TOKEN=${K3S_TOKEN} sh -`  

**notice**:    

- worker 安装前先export一下环境变量  
`export K3S_URL=https://110.40.186.64:6443`  
`export K3S_TOKEN=xxxxx::server:xxxxx`

- `K3S_TOKEN` 在server环境的`/var/lib/rancher/k3s/server/node-token`路径

- 每台计算机必须具有唯一的主机名。如果您的计算机没有唯一的主机名，请传递`K3S_NODE_NAME`环境变量，并为每个节点提供一个有效且唯一的主机名。

### 二、先进行`server`端配置
编辑systemd配置文件
```shell
vim /etc/systemd/system/k3s-server.service
###########################################
[Unit]
Description=Lightweight Kubernetes
Documentation=https://k3s.io
Wants=network-online.target

[Service]
Type=notify
KillMode=process
Delegate=yes
LimitNOFILE=1048576
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
TimeoutStartSec=0
ExecStartPre=-/sbin/modprobe br_netfilter
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/bin/k3s \
    server \
    --node-external-ip <public-ip> \
    --no-deploy servicelb \
#    --cluster-domain magina.k3s \
    --flannel-backend wireguard \
    --kube-proxy-arg "proxy-mode=ipvs" "masquerade-all=true" \
    --kube-proxy-arg "metrics-bind-address=0.0.0.0"

Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```  
主要是修改 `ExecStart` 启动参数    
- `--node-external-ip`: 如果是跨云服务, 需要指定公网IP    
- `--no-deploy`: 不使用k3s自带的负载均衡模块    
- `--cluster-domain`: 自定义域名, 微服务使用, 如果不指定, 默认`cluster.local`    
- `--flannel-backend`: 这里我是跨公有云部署, 使用`wireguard`模式, 如果是内网可以不指定, 默认`vxlan`    


如果使用`wireguard`，注意所有node节点上都要安装`wireguard`， `ubuntu`只需要`apt-get update` 并 `apt-get install wireguard` 即可  
执行完毕后调用`systemctl daemon-reload` 并执行 `systemctl restart k3s` 即可更新配置

### 三、更新`agent`配置
编辑systemd配置文件
```shell
vim /etc/systemd/system/k3s-agent.service
###########################################
[Unit]
Description=Lightweight Kubernetes
Documentation=https://k3s.io
Wants=network-online.target

[Service]
Type=exec
KillMode=process
Delegate=yes
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TasksMax=infinity
TimeoutStartSec=0
ExecStartPre=-/sbin/modprobe br_netfilter
ExecStartPre=-/sbin/modprobe overlay
ExecStart=/usr/bin/k3s agent \
    --server https://<server-ip>:6443 \
    --token xxxxxx::server:xxxxxx \
    --node-external-ip <public-ip> \
    --kube-proxy-arg "proxy-mode=ipvs" "masquerade-all=true"

Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```
主要是修改 `ExecStart` 启动参数    
- --server: server服务的连接地址    
- --node-external-ip: 如果是跨云服务, 需要指定公网IP    
- --token: 在server服务器中查看`cat /var/lib/rancher/k3s/server/token`    

### 四、更新节点ip
`kubectl edit node k3s-server-01`  
`metadata:annotations:`后添加一行  
`flannel.alpha.coreos.com/public-ip-overwrite: server-public-ip`

至此就完成了:tada:

kubectl run dig --rm -it --image=rickiechina/dig --overrides='{"spec": {"nodeSelector": { "kubernetes.io/hostname": "k3s-worker1" }}}' -- /bin/sh
curl -sfL <http://rancher-mirror.cnrancher.com/k3s/k3s-install.sh> | INSTALL_K3S_MIRROR=cn sh  -s -  --node-external-ip 121.5.154.166 --advertise-address 121.5.154.166 --node-ip 10.0.4.10

